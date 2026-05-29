import { createStore, produce } from 'solid-js/store'
import type { IrModel, IrNode, NodeId, EditCommand } from './types'

interface Scope {
  parent: Scope | null
  bindings: Map<string, NodeId>
}

function createScope(parent: Scope | null = null): Scope {
  return { parent, bindings: new Map() }
}

function scopeSet(scope: Scope, name: string, nodeId: NodeId) {
  scope.bindings.set(name, nodeId)
}

function scopeLookup(scope: Scope | null, name: string): NodeId | null {
  for (let current = scope; current; current = current.parent) {
    const found = current.bindings.get(name)
    if (found) return found
  }
  return null
}

function firstChildId(node: IrNode, role: string): NodeId | undefined {
  return node.children[role]?.[0]
}

function stringProp(node: IrNode, name: string): string {
  const value = node.props[name]
  return typeof value === 'string' ? value : ''
}

function inferLiteralType(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return 'Unit'
  if (/^[-+]?\d+(\.\d+)?$/.test(trimmed)) return 'Number'
  if (trimmed === 'true' || trimmed === 'false') return 'Bool'
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return 'String'
  if (/^\[.*\]$/.test(trimmed)) return 'Array'
  return 'Any'
}

function declaredTypeOf(node: IrNode): string {
  if (node.kind === 'FnDecl') return stringProp(node, 'returnType') || 'Unit'
  if (node.kind === 'FieldDecl' || node.kind === 'Parameter') return stringProp(node, 'type') || 'Any'
  if (node.kind === 'LetDecl' || node.kind === 'LetStmt') return stringProp(node, 'type') || 'Any'
  return 'Any'
}

function declarationName(node: IrNode): string {
  if (node.kind === 'StructDecl' || node.kind === 'FnDecl' || node.kind === 'LetDecl' || node.kind === 'LetStmt') {
    return stringProp(node, 'name')
  }
  if (node.kind === 'FieldDecl' || node.kind === 'Parameter' || node.kind === 'IdentifierExpr') {
    return stringProp(node, 'name')
  }
  return ''
}

function getNodeType(node: IrNode | undefined): string {
  return node?.analysis?.inferredType ?? node?.analysis?.declaredType ?? 'Any'
}

function inferBinaryType(op: string, leftType: string, rightType: string): string {
  if (['==', '!=', '<', '<=', '>', '>=', '&&', '||'].includes(op)) return 'Bool'
  if (op === '+') {
    if (leftType === 'String' || rightType === 'String') return 'String'
    if (leftType === 'Number' && rightType === 'Number') return 'Number'
  }
  if (['-', '*', '/', '%'].includes(op) && leftType === 'Number' && rightType === 'Number') return 'Number'
  return leftType === rightType ? leftType : 'Any'
}

function resolveModel(model: IrModel) {
  for (const node of Object.values(model.nodes)) {
    node.refs = {}
    node.analysis = {}
  }

  function visit(nodeId: NodeId, scope: Scope | null): string {
    const node = model.nodes[nodeId]
    if (!node) return 'Any'

    switch (node.kind) {
      case 'File': {
        const fileScope = createScope(scope)
        for (const childId of node.children.declarations ?? []) {
          const child = model.nodes[childId]
          const name = child ? declarationName(child) : ''
          if (name) scopeSet(fileScope, name, childId)
        }
        for (const childId of node.children.declarations ?? []) {
          visit(childId, fileScope)
        }
        node.analysis = { inferredType: 'File' }
        return 'File'
      }
      case 'StructDecl': {
        const structScope = createScope(scope)
        const name = declarationName(node)
        if (name) scopeSet(structScope, name, nodeId)
        for (const fieldId of node.children.fields ?? []) visit(fieldId, structScope)
        node.analysis = { declaredType: name || 'Struct', inferredType: name || 'Struct' }
        return node.analysis.inferredType ?? 'Struct'
      }
      case 'FnDecl': {
        const fnScope = createScope(scope)
        const name = declarationName(node)
        if (name) scopeSet(fnScope, name, nodeId)
        for (const paramId of node.children.params ?? []) {
          const param = model.nodes[paramId]
          const paramName = param ? declarationName(param) : ''
          if (paramName) scopeSet(fnScope, paramName, paramId)
          visit(paramId, fnScope)
        }
        for (const bodyId of node.children.body ?? []) visit(bodyId, fnScope)
        const returnType = declaredTypeOf(node)
        node.analysis = {
          declaredType: returnType,
          inferredType: returnType,
        }
        return returnType
      }
      case 'FieldDecl':
      case 'Parameter':
      case 'LetDecl':
      case 'LetStmt': {
        const name = declarationName(node)
        const valueScope = scope ?? createScope()

        const valueRole = firstChildId(node, 'value')
        const inferred = valueRole ? visit(valueRole, valueScope) : declaredTypeOf(node)
        const declaredType = declaredTypeOf(node)

        if (name && scope) scopeSet(scope, name, nodeId)

        node.analysis = {
          declaredType: declaredType === 'Any' && inferred !== 'Any' ? inferred : declaredType,
          inferredType: inferred || declaredType,
        }
        return node.analysis.inferredType ?? 'Any'
      }
      case 'ReturnStmt': {
        const valueId = firstChildId(node, 'value')
        const inferred = valueId ? visit(valueId, scope) : 'Unit'
        node.analysis = { inferredType: inferred }
        return inferred
      }
      case 'ExprStmt': {
        const exprId = firstChildId(node, 'expr')
        const inferred = exprId ? visit(exprId, scope) : 'Unit'
        node.analysis = { inferredType: inferred }
        return inferred
      }
      case 'IfStmt': {
        const conditionId = firstChildId(node, 'condition')
        if (conditionId) visit(conditionId, scope)
        const thenScope = createScope(scope)
        for (const childId of node.children.thenBody ?? []) visit(childId, thenScope)
        const elseScope = createScope(scope)
        for (const childId of node.children.elseBody ?? []) visit(childId, elseScope)
        node.analysis = { inferredType: 'Unit' }
        return 'Unit'
      }
      case 'WhileStmt': {
        const conditionId = firstChildId(node, 'condition')
        if (conditionId) visit(conditionId, scope)
        const loopScope = createScope(scope)
        for (const childId of node.children.body ?? []) visit(childId, loopScope)
        node.analysis = { inferredType: 'Unit' }
        return 'Unit'
      }
      case 'ForStmt': {
        const iterableId = firstChildId(node, 'iterable')
        const iterableType = iterableId ? visit(iterableId, scope) : 'Any'
        const loopScope = createScope(scope)
        const itemName = stringProp(node, 'item') || 'item'
        scopeSet(loopScope, itemName, nodeId)
        for (const childId of node.children.body ?? []) visit(childId, loopScope)
        node.analysis = { inferredType: 'Unit', declaredType: iterableType }
        return 'Unit'
      }
      case 'BreakStmt':
      case 'ContinueStmt':
        node.analysis = { inferredType: 'Unit' }
        return 'Unit'
      case 'IdentifierExpr': {
        const name = stringProp(node, 'name')
        const targetId = scopeLookup(scope, name)
        if (targetId) {
          node.refs.declaration = targetId
        }
        const target = targetId ? model.nodes[targetId] : undefined
        const inferred = getNodeType(target)
        node.analysis = { inferredType: inferred }
        return inferred
      }
      case 'LiteralExpr': {
        const inferred = inferLiteralType(stringProp(node, 'value'))
        node.analysis = { inferredType: inferred }
        return inferred
      }
      case 'BinaryExpr': {
        const leftId = firstChildId(node, 'left')
        const rightId = firstChildId(node, 'right')
        const leftType = leftId ? visit(leftId, scope) : 'Any'
        const rightType = rightId ? visit(rightId, scope) : 'Any'
        const inferred = inferBinaryType(stringProp(node, 'op') || '+', leftType, rightType)
        node.analysis = { inferredType: inferred }
        return inferred
      }
      case 'CallExpr': {
        const calleeId = firstChildId(node, 'callee')
        const calleeType = calleeId ? visit(calleeId, scope) : 'Any'
        for (const argId of node.children.args ?? []) visit(argId, scope)
        node.analysis = { inferredType: calleeType }
        return calleeType
      }
      case 'AssignExpr': {
        const targetId = firstChildId(node, 'target')
        const valueId = firstChildId(node, 'value')
        const targetType = targetId ? visit(targetId, scope) : 'Any'
        const valueType = valueId ? visit(valueId, scope) : 'Any'
        node.analysis = { inferredType: targetType !== 'Any' ? targetType : valueType }
        return node.analysis.inferredType || 'Any'
      }
      default: {
        for (const childIds of Object.values(node.children)) {
          for (const childId of childIds) visit(childId, scope)
        }
        node.analysis = { inferredType: declaredTypeOf(node) }
        return node.analysis.inferredType || 'Any'
      }
    }
  }

  visit(model.rootId, null)
}

function seedModel(root: any, out: Record<NodeId, IrNode> = {}): IrNode {
  const node: IrNode = {
    id: root.id,
    kind: root.kind,
    props: root.props ?? {},
    children: {},
    refs: root.refs ?? {},
    analysis: root.analysis,
  }
  for (const [role, kids] of Object.entries<any[]>(root.children ?? {})) {
    node.children[role] = kids.map((k: any) => {
      const child = seedModel(k, out)
      return child.id
    })
  }
  out[node.id] = node
  return node
}

export function createIrModel(initialRoot: any) {
  const nodes: Record<NodeId, IrNode> = {}
  const root = seedModel(initialRoot, nodes)
  resolveModel({ nodes, rootId: root.id })

  const [model, setModel] = createStore<IrModel>({ nodes, rootId: root.id })

  function applyCommand(cmd: EditCommand) {
    setModel(produce((m) => {
      switch (cmd.type) {
        case 'SET_PROP':
          m.nodes[cmd.nodeId].props[cmd.prop] = cmd.value
          break
        case 'INSERT_CHILD': {
          const children = seedModel(cmd.child, m.nodes)
          const siblings = m.nodes[cmd.parentId].children[cmd.role] ?? []
          const idx = cmd.index ?? siblings.length
          siblings.splice(idx, 0, children.id)
          m.nodes[cmd.parentId].children[cmd.role] = siblings
          break
        }
        case 'DELETE_NODE': {
          const siblings = m.nodes[cmd.parentId].children[cmd.role] ?? []
          const idx = siblings.indexOf(cmd.nodeId)
          if (idx >= 0) siblings.splice(idx, 1)
          function cascadeDelete(id: string) {
            const n = m.nodes[id]
            if (!n) return
            for (const kids of Object.values(n.children)) {
              for (const kid of kids) cascadeDelete(kid)
            }
            delete m.nodes[id]
          }
          cascadeDelete(cmd.nodeId)
          break
        }
        case 'MOVE_CHILD': {
          const siblings = m.nodes[cmd.parentId].children[cmd.role] ?? []
          const [item] = siblings.splice(cmd.fromIndex, 1)
          siblings.splice(cmd.toIndex, 0, item)
          break
        }
        case 'REPLACE_NODE': {
          const fresh = seedModel(cmd.replacement, m.nodes)
          // swap the id in all parent child lists
          for (const n of Object.values(m.nodes)) {
            for (const role of Object.keys(n.children)) {
              const list = n.children[role]
              const idx = list.indexOf(cmd.nodeId)
              if (idx >= 0) list[idx] = fresh.id
            }
          }
          delete m.nodes[cmd.nodeId]
          break
        }
      }
      resolveModel(m)
    }))
  }

  return { model, applyCommand }
}
