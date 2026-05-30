import { createStore, produce, reconcile } from 'solid-js/store'
import type { Diagnostic, IrModel, IrNode, NodeId, EditCommand } from './types'

interface CallSignature {
  returnType: string
  paramTypes: string[]
  variadic?: boolean
}

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

function normalizeTypeName(type: string): string {
  const trimmed = type.trim()
  const arrayArg = genericTypeArg(trimmed, 'Array')
  if (arrayArg) return `Array<${normalizeTypeName(arrayArg)}>`
  const iteratorArg = genericTypeArg(trimmed, 'Iterator')
  if (iteratorArg) return `Iterator<${normalizeTypeName(iteratorArg)}>`
  const fnMatch = /^Fn\((.*)\) -> (.+)$/.exec(trimmed)
  if (fnMatch) {
    const params = fnMatch[1].trim()
    const normalizedParams = params ? params.split(',').map((part) => normalizeTypeName(part.trim())).join(', ') : ''
    return `Fn(${normalizedParams}) -> ${normalizeTypeName(fnMatch[2])}`
  }
  switch (trimmed.toLowerCase()) {
    case 'int':
    case 'integer':
    case 'float':
    case 'double':
    case 'number':
      return 'Number'
    case 'bool':
    case 'boolean':
      return 'Bool'
    case 'str':
    case 'string':
      return 'String'
    case 'unit':
    case 'void':
      return 'Unit'
    case 'array':
      return 'Array<Any>'
    default:
      return trimmed
  }
}

function inferLiteralType(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return 'Unit'
  if (/^[-+]?\d+(\.\d+)?$/.test(trimmed)) return 'Number'
  if (trimmed === 'true' || trimmed === 'false') return 'Bool'
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) return 'String'
  if (/^\[.*\]$/.test(trimmed)) return 'Array<Any>'
  return 'Any'
}

function isAnyType(type: string | undefined): boolean {
  return !type || type === 'Any'
}

function genericTypeArg(type: string, prefix: 'Array' | 'Iterator'): string | null {
  const match = new RegExp(`^${prefix}<(.+)>$`).exec(type.trim())
  return match?.[1] ?? null
}

function isArrayType(type: string): boolean {
  return type === 'Array' || type.startsWith('Array<')
}

function isIteratorType(type: string): boolean {
  return type.startsWith('Iterator<')
}

function elementTypeOf(type: string): string {
  return genericTypeArg(type, 'Array') ?? genericTypeArg(type, 'Iterator') ?? 'Any'
}

function formatFunctionType(paramTypes: string[], returnType: string): string {
  return `Fn(${paramTypes.join(', ')}) -> ${returnType}`
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
  if (!node) return 'Any'
  if (node.kind === 'FnDecl') {
    const paramTypes = (node.children.params ?? [])
      .map((paramId) => declaredTypeOf(nodeModelRef?.nodes[paramId] ?? node))
    return formatFunctionType(paramTypes, declaredTypeOf(node))
  }
  return normalizeTypeName(node.analysis?.inferredType ?? node.analysis?.declaredType ?? 'Any')
}

function inferBinaryType(op: string, leftType: string, rightType: string): string {
  leftType = normalizeTypeName(leftType)
  rightType = normalizeTypeName(rightType)
  if (['==', '!=', '<', '<=', '>', '>=', '&&', '||'].includes(op)) return 'Bool'
  if (op === '+') {
    if (leftType === 'String' || rightType === 'String') return 'String'
    if (leftType === 'Number' && rightType === 'Number') return 'Number'
  }
  if (['-', '*', '/', '%'].includes(op) && leftType === 'Number' && rightType === 'Number') return 'Number'
  return leftType === rightType ? leftType : 'Any'
}

function isAssignable(expected: string, actual: string): boolean {
  expected = normalizeTypeName(expected)
  actual = normalizeTypeName(actual)
  if (expected === 'Any' || actual === 'Any') return true
  if (expected === actual) return true
  if (isArrayType(expected) && isArrayType(actual)) {
    return isAssignable(elementTypeOf(expected), elementTypeOf(actual))
  }
  if (isIteratorType(expected) && isIteratorType(actual)) {
    return isAssignable(elementTypeOf(expected), elementTypeOf(actual))
  }
  if (isIteratorType(expected) && isArrayType(actual)) {
    return isAssignable(elementTypeOf(expected), elementTypeOf(actual))
  }
  return false
}

function setExpectedType(node: IrNode, expectedType: string) {
  if (isAnyType(expectedType)) return
  node.analysis ??= {}
  node.analysis.expectedType = expectedType
}

function setExpectedChildType(node: IrNode, role: string, index: number, expectedType: string) {
  if (isAnyType(expectedType)) return
  node.analysis ??= {}
  node.analysis.expectedChildTypes ??= {}
  const entry = node.analysis.expectedChildTypes[role] ?? []
  entry[index] = expectedType
  node.analysis.expectedChildTypes[role] = entry
}

function builtinSignature(name: string): CallSignature | null {
  if (name === 'print') return { returnType: 'Unit', paramTypes: ['Any'], variadic: true }
  if (name === 'range') return { returnType: 'Iterator<Number>', paramTypes: ['Number', 'Number'] }
  if (name === 'len') return { returnType: 'Number', paramTypes: ['Any'] }
  if (name === 'push') return { returnType: 'Array<Any>', paramTypes: ['Array<Any>', 'Any'] }
  if (name === 'pop') return { returnType: 'Any', paramTypes: ['Array<Any>'] }
  if (name === 'slice') return { returnType: 'Array<Any>', paramTypes: ['Array<Any>', 'Number', 'Number'], variadic: false }
  if (name === 'append') return { returnType: 'Array<Any>', paramTypes: ['Array<Any>', 'Any'] }
  if (name === 'str') return { returnType: 'String', paramTypes: ['Any'] }
  if (name === 'num') return { returnType: 'Number', paramTypes: ['Any'] }
  if (name === 'floor' || name === 'ceil' || name === 'abs' || name === 'sqrt') return { returnType: 'Number', paramTypes: ['Number'] }
  if (name === 'min' || name === 'max') return { returnType: 'Number', paramTypes: ['Number', 'Number'] }
  if (name === 'keys') return { returnType: 'Array<String>', paramTypes: ['Any'] }
  if (name === 'split') return { returnType: 'Array<String>', paramTypes: ['String', 'String'] }
  if (name === 'join') return { returnType: 'String', paramTypes: ['Array<Any>', 'String'] }
  if (name === 'type') return { returnType: 'String', paramTypes: ['Any'] }
  if (name === 'has') return { returnType: 'Bool', paramTypes: ['Any', 'Any'] }
  return null
}

function builtinIdentifierType(name: string): string | null {
  const signature = builtinSignature(name)
  if (!signature) return null
  return formatFunctionType(signature.paramTypes, signature.returnType)
}

let nodeModelRef: IrModel | null = null

function getFunctionSignature(node: IrNode | undefined, model: IrModel): CallSignature | null {
  if (!node) return null
  if (node.kind === 'FnDecl') {
    return {
      returnType: declaredTypeOf(node),
      paramTypes: (node.children.params ?? []).map((paramId) => declaredTypeOf(model.nodes[paramId])),
    }
  }
  if (node.kind === 'IdentifierExpr') {
    const ref = node.refs.declaration ? model.nodes[node.refs.declaration] : undefined
    return getFunctionSignature(ref, model) ?? builtinSignature(stringProp(node, 'name'))
  }
  return null
}

function collectReturnTypes(model: IrModel, nodeIds: NodeId[]): string[] {
  const results: string[] = []
  const visit = (id: NodeId) => {
    const node = model.nodes[id]
    if (!node) return
    if (node.kind === 'ReturnStmt') {
      results.push(node.analysis?.inferredType ?? 'Unit')
    }
    for (const childIds of Object.values(node.children)) {
      for (const childId of childIds) visit(childId)
    }
  }
  for (const id of nodeIds) visit(id)
  return results
}

function mergeReturnTypes(types: string[], fallback: string): string {
  const nonUnit = types.filter((type) => type !== 'Unit' && type !== 'Any')
  if (nonUnit.length === 0) return fallback
  const first = nonUnit[0]
  return nonUnit.every((type) => type === first) ? first : 'Any'
}

function inferExpectedTypeForKind(kind: string): string {
  switch (kind) {
    case 'ArrayLiteralExpr': return 'Array<Any>'
    case 'IndexExpr':
      return 'Any'
    case 'UnaryExpr':
    case 'BinaryExpr':
    case 'LiteralExpr':
    case 'IdentifierExpr':
    case 'CallExpr':
    case 'AssignExpr':
    case 'MemberExpr':
      return 'Any'
    default:
      return 'Any'
  }
}

export function getExpectedChildType(model: IrModel, parentId: NodeId, role: string, index = 0): string | null {
  const parent = model.nodes[parentId]
  if (!parent) return null
  const expected = parent.analysis?.expectedChildTypes?.[role]
  if (expected?.length) return expected[index] ?? expected[expected.length - 1] ?? null

  switch (parent.kind) {
    case 'LetDecl':
    case 'LetStmt':
    case 'FieldDecl':
    case 'Parameter':
      return role === 'value' ? (declaredTypeOf(parent) || null) : null
    case 'ReturnStmt':
      return role === 'value' ? (parent.analysis?.expectedType ?? null) : null
    case 'IfStmt':
    case 'WhileStmt':
      return role === 'condition' ? 'Bool' : null
    case 'ForStmt':
      return role === 'iterable' ? 'Iterator<Any>' : null
    case 'UnaryExpr': {
      const op = stringProp(parent, 'op') || '-'
      return role === 'expr' ? (op === '!' ? 'Bool' : op === '-' ? 'Number' : null) : null
    }
    case 'BinaryExpr': {
      if (role !== 'left' && role !== 'right') return null
      const op = stringProp(parent, 'op') || '+'
      if (['-', '*', '/', '%', '<', '<=', '>', '>='].includes(op)) return 'Number'
      if (['&&', '||'].includes(op)) return 'Bool'
      if (op === '+' && parent.analysis?.expectedType === 'String') return 'String'
      if (op === '+' && parent.analysis?.expectedType === 'Number') return 'Number'
      return null
    }
    case 'AssignExpr':
      return role === 'value' ? (getExpectedChildType(model, parentId, 'target', 0) ?? parent.analysis?.inferredType ?? null) : null
    case 'CallExpr': {
      if (role !== 'args') return null
      const calleeId = firstChildId(parent, 'callee')
      const signature = calleeId ? getFunctionSignature(model.nodes[calleeId], model) : null
      return signature?.paramTypes[index] ?? (signature?.variadic ? signature.paramTypes[0] : null) ?? null
    }
    case 'ArrayLiteralExpr':
      return role === 'elements' && parent.analysis?.expectedType ? elementTypeOf(parent.analysis.expectedType) : null
    case 'MemberExpr':
      return role === 'object' && stringProp(parent, 'member') === 'length' ? 'Array<Any>' : null
    case 'IndexExpr':
      if (role === 'object') return 'Array<Any>'
      if (role === 'index') return 'Number'
      return null
    default:
      return null
  }
}

function kindMatchesExpectedType(kind: string, expectedType: string): boolean {
  if (isAnyType(expectedType)) return true
  if (kind === 'IdentifierExpr' || kind === 'CallExpr' || kind === 'AssignExpr' || kind === 'MemberExpr') return true
  if (kind === 'ArrayLiteralExpr') return isArrayType(expectedType) || isIteratorType(expectedType)
  if (kind === 'IndexExpr') return true
  if (kind === 'UnaryExpr') return expectedType === 'Number' || expectedType === 'Bool'
  if (kind === 'BinaryExpr') return expectedType === 'Number' || expectedType === 'String' || expectedType === 'Bool'
  if (kind === 'LiteralExpr') return !expectedType.startsWith('Fn(')
  return inferExpectedTypeForKind(kind) === 'Any' || isAssignable(expectedType, inferExpectedTypeForKind(kind))
}

export function filterKindsForInsert(allowedKinds: string[], expectedType: string | null | undefined): string[] {
  if (isAnyType(expectedType ?? 'Any')) return allowedKinds
  const filtered = allowedKinds.filter((kind) => kindMatchesExpectedType(kind, expectedType ?? 'Any'))
  return filtered.length > 0 ? filtered : allowedKinds
}

function pushDiagnostic(node: IrNode, severity: Diagnostic['severity'], message: string) {
  node.analysis ??= {}
  node.analysis.diagnostics ??= []
  node.analysis.diagnostics.push({ severity, message })
}

function enforceExpectedType(node: IrNode, expectedType: string, inferredType: string, label = 'expression') {
  if (isAnyType(expectedType) || isAnyType(inferredType)) return
  if (!isAssignable(expectedType, inferredType)) {
    pushDiagnostic(node, 'error', `${label} has type ${normalizeTypeName(inferredType)}, expected ${normalizeTypeName(expectedType)}`)
  }
}

function resolveModel(model: IrModel) {
  nodeModelRef = model
  for (const node of Object.values(model.nodes)) {
    node.refs = {}
    node.analysis = {}
  }

  function visit(nodeId: NodeId, scope: Scope | null, expectedType = 'Any', returnType = 'Unit'): string {
    const node = model.nodes[nodeId]
    if (!node) return 'Any'
    setExpectedType(node, expectedType)

    switch (node.kind) {
      case 'File': {
        const fileScope = createScope(scope)
        for (const childId of node.children.declarations ?? []) {
          const child = model.nodes[childId]
          const name = child ? declarationName(child) : ''
          if (name) scopeSet(fileScope, name, childId)
        }
        for (const childId of node.children.declarations ?? []) {
          visit(childId, fileScope, 'Any', returnType)
        }
        node.analysis = { inferredType: 'File' }
        return 'File'
      }
      case 'StructDecl': {
        const structScope = createScope(scope)
        const name = declarationName(node)
        if (name) scopeSet(structScope, name, nodeId)
        for (const fieldId of node.children.fields ?? []) visit(fieldId, structScope, 'Any', returnType)
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
          if (param) setExpectedChildType(node, 'params', (node.children.params ?? []).indexOf(paramId), declaredTypeOf(param))
          visit(paramId, fnScope, param ? declaredTypeOf(param) : 'Any', declaredTypeOf(node))
        }
        for (const [index, bodyId] of (node.children.body ?? []).entries()) {
          visit(bodyId, fnScope, 'Any', declaredTypeOf(node))
          setExpectedChildType(node, 'body', index, 'Unit')
        }
        const fnReturnType = declaredTypeOf(node)
        const inferredReturn = mergeReturnTypes(collectReturnTypes(model, node.children.body ?? []), fnReturnType)
        node.analysis = {
          declaredType: fnReturnType,
          inferredType: inferredReturn,
        }
        if (!isAssignable(fnReturnType, inferredReturn)) {
          pushDiagnostic(node, 'error', `function ${name || nodeId} returns ${inferredReturn}, expected ${fnReturnType}`)
        }
        return formatFunctionType((node.children.params ?? []).map((paramId) => declaredTypeOf(model.nodes[paramId])), fnReturnType)
      }
      case 'FieldDecl':
      case 'Parameter':
      case 'LetDecl':
      case 'LetStmt': {
        const name = declarationName(node)
        const valueScope = scope ?? createScope()

        const valueRole = firstChildId(node, 'value')
        const declaredType = declaredTypeOf(node)
        const valueExpected = declaredType !== 'Any' ? declaredType : expectedType
        if (valueRole) setExpectedChildType(node, 'value', 0, valueExpected)
        const inferred = valueRole ? visit(valueRole, valueScope, valueExpected, returnType) : declaredType

        if (name && scope) scopeSet(scope, name, nodeId)

        node.analysis = {
          declaredType: declaredType === 'Any' && inferred !== 'Any' ? inferred : declaredType,
          inferredType: inferred || declaredType,
        }
        if (node.kind === 'LetDecl' || node.kind === 'LetStmt' || node.kind === 'Parameter' || node.kind === 'FieldDecl') {
          const effectiveDeclared = node.analysis.declaredType ?? declaredType
          const effectiveInferred = node.analysis.inferredType ?? inferred
          if (effectiveDeclared && effectiveInferred && !isAssignable(effectiveDeclared, effectiveInferred)) {
            pushDiagnostic(node, 'error', `${node.kind} type ${effectiveDeclared} does not match ${effectiveInferred}`)
          }
        }
        return node.analysis.inferredType ?? 'Any'
      }
      case 'ReturnStmt': {
        const valueId = firstChildId(node, 'value')
        if (valueId) setExpectedChildType(node, 'value', 0, returnType)
        const inferred = valueId ? visit(valueId, scope, returnType, returnType) : 'Unit'
        node.analysis = { inferredType: inferred }
        if (!isAssignable(returnType, inferred)) {
          pushDiagnostic(node, 'error', `return type ${inferred} does not match ${returnType}`)
        }
        return inferred
      }
      case 'ExprStmt': {
        const exprId = firstChildId(node, 'expr')
        const inferred = exprId ? visit(exprId, scope, expectedType, returnType) : 'Unit'
        node.analysis = { inferredType: inferred }
        return inferred
      }
      case 'IfStmt': {
        const conditionId = firstChildId(node, 'condition')
        if (conditionId) setExpectedChildType(node, 'condition', 0, 'Bool')
        const conditionType = conditionId ? visit(conditionId, scope, 'Bool', returnType) : 'Any'
        const analysis = { inferredType: 'Unit' as const }
        const thenScope = createScope(scope)
        for (const [index, childId] of (node.children.thenBody ?? []).entries()) {
          setExpectedChildType(node, 'thenBody', index, 'Unit')
          visit(childId, thenScope, 'Any', returnType)
        }
        const elseScope = createScope(scope)
        for (const [index, childId] of (node.children.elseBody ?? []).entries()) {
          setExpectedChildType(node, 'elseBody', index, 'Unit')
          visit(childId, elseScope, 'Any', returnType)
        }
        node.analysis = analysis
        if (conditionType !== 'Bool' && conditionType !== 'Any') {
          pushDiagnostic(node, 'warning', `if condition is ${conditionType}, expected Bool`)
        }
        return 'Unit'
      }
      case 'WhileStmt': {
        const conditionId = firstChildId(node, 'condition')
        if (conditionId) setExpectedChildType(node, 'condition', 0, 'Bool')
        const conditionType = conditionId ? visit(conditionId, scope, 'Bool', returnType) : 'Any'
        node.analysis = { inferredType: 'Unit' }
        const loopScope = createScope(scope)
        for (const [index, childId] of (node.children.body ?? []).entries()) {
          setExpectedChildType(node, 'body', index, 'Unit')
          visit(childId, loopScope, 'Any', returnType)
        }
        if (conditionType !== 'Bool' && conditionType !== 'Any') {
          pushDiagnostic(node, 'warning', `while condition is ${conditionType}, expected Bool`)
        }
        return 'Unit'
      }
      case 'ForStmt': {
        const iterableId = firstChildId(node, 'iterable')
        if (iterableId) setExpectedChildType(node, 'iterable', 0, 'Iterator<Any>')
        const iterableType = iterableId ? visit(iterableId, scope, 'Iterator<Any>', returnType) : 'Any'
        const loopScope = createScope(scope)
        const itemName = stringProp(node, 'item') || 'item'
        scopeSet(loopScope, itemName, nodeId)
        for (const [index, childId] of (node.children.body ?? []).entries()) {
          setExpectedChildType(node, 'body', index, 'Unit')
          visit(childId, loopScope, 'Any', returnType)
        }
        node.analysis = { inferredType: 'Unit', declaredType: elementTypeOf(iterableType) }
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
        } else if (builtinIdentifierType(name)) {
          node.refs.declaration = ''
        } else if (name) {
          pushDiagnostic(node, 'error', `unresolved identifier ${name}`)
        }
        const target = targetId ? model.nodes[targetId] : undefined
        const inferred = targetId ? getNodeType(target) : (builtinIdentifierType(name) ?? 'Any')
        node.analysis = { inferredType: inferred, diagnostics: node.analysis?.diagnostics }
        enforceExpectedType(node, expectedType, inferred, 'identifier')
        return inferred
      }
      case 'LiteralExpr': {
        const inferred = inferLiteralType(stringProp(node, 'value'))
        node.analysis = { inferredType: inferred }
        enforceExpectedType(node, expectedType, inferred, 'literal')
        return inferred
      }
      case 'BinaryExpr': {
        const leftId = firstChildId(node, 'left')
        const rightId = firstChildId(node, 'right')
        const op = stringProp(node, 'op') || '+'
        const childExpected = ['-', '*', '/', '%', '<', '<=', '>', '>='].includes(op)
          ? 'Number'
          : ['&&', '||'].includes(op)
            ? 'Bool'
            : expectedType === 'String' && op === '+'
              ? 'String'
              : expectedType === 'Number' && op === '+'
                ? 'Number'
                : 'Any'
        if (leftId) setExpectedChildType(node, 'left', 0, childExpected)
        if (rightId) setExpectedChildType(node, 'right', 0, childExpected)
        const leftType = leftId ? visit(leftId, scope, childExpected, returnType) : 'Any'
        const rightType = rightId ? visit(rightId, scope, childExpected, returnType) : 'Any'
        const inferred = inferBinaryType(op, leftType, rightType)
        node.analysis = { inferredType: inferred }
        if (inferred === 'Any' && leftType !== 'Any' && rightType !== 'Any') {
          pushDiagnostic(node, 'warning', `operator ${op} is not well-typed for ${leftType} and ${rightType}`)
        }
        enforceExpectedType(node, expectedType, inferred, 'binary expression')
        return inferred
      }
      case 'UnaryExpr': {
        const exprId = firstChildId(node, 'expr')
        const op = stringProp(node, 'op') || '-'
        const childExpected = op === '!' ? 'Bool' : op === '-' ? 'Number' : 'Any'
        if (exprId) setExpectedChildType(node, 'expr', 0, childExpected)
        const exprType = exprId ? visit(exprId, scope, childExpected, returnType) : 'Any'
        const inferred = op === '!' ? 'Bool' : exprType === 'Number' && op === '-' ? 'Number' : exprType
        node.analysis = { inferredType: inferred }
        if (op === '!' && exprType !== 'Bool' && exprType !== 'Any') {
          pushDiagnostic(node, 'warning', `unary ! expects Bool, got ${exprType}`)
        }
        if (op === '-' && exprType !== 'Number' && exprType !== 'Any') {
          pushDiagnostic(node, 'warning', `unary - expects Number, got ${exprType}`)
        }
        enforceExpectedType(node, expectedType, inferred, 'unary expression')
        return inferred
      }
      case 'MemberExpr': {
        const objectId = firstChildId(node, 'object')
        const member = stringProp(node, 'member')
        if (objectId && member === 'length') setExpectedChildType(node, 'object', 0, 'Array<Any>')
        const objectType = objectId ? visit(objectId, scope, member === 'length' ? 'Array<Any>' : 'Any', returnType) : 'Any'
        const inferred = member === 'length' ? 'Number' : objectType === 'Any' ? 'Any' : member ? 'Any' : objectType
        node.analysis = { inferredType: inferred }
        if (objectType === 'Any') {
          pushDiagnostic(node, 'warning', 'member access target has unknown type')
        }
        enforceExpectedType(node, expectedType, inferred, 'member expression')
        return inferred
      }
      case 'IndexExpr': {
        const objectId = firstChildId(node, 'object')
        const indexId = firstChildId(node, 'index')
        if (objectId) setExpectedChildType(node, 'object', 0, 'Array<Any>')
        if (indexId) setExpectedChildType(node, 'index', 0, 'Number')
        const objectType = objectId ? visit(objectId, scope, 'Array<Any>', returnType) : 'Any'
        const indexType = indexId ? visit(indexId, scope, 'Number', returnType) : 'Any'
        const inferred = isArrayType(objectType) ? elementTypeOf(objectType) : 'Any'
        node.analysis = { inferredType: inferred }
        if (!isAnyType(indexType) && indexType !== 'Number') {
          pushDiagnostic(node, 'warning', `index has type ${indexType}, expected Number`)
        }
        if (!isAnyType(objectType) && !isArrayType(objectType)) {
          pushDiagnostic(node, 'warning', `index target has type ${objectType}, expected Array`)
        }
        enforceExpectedType(node, expectedType, inferred, 'index expression')
        return inferred
      }
      case 'ArrayLiteralExpr': {
        const expectedElementType = isArrayType(expectedType) || isIteratorType(expectedType) ? elementTypeOf(expectedType) : 'Any'
        const elementTypes = (node.children.elements ?? []).map((elementId, index) => {
          setExpectedChildType(node, 'elements', index, expectedElementType)
          return visit(elementId, scope, expectedElementType, returnType)
        })
        const nonAny = elementTypes.filter((type) => type !== 'Any')
        const firstType = nonAny[0] ?? 'Any'
        const homogeneous = nonAny.every((type) => type === firstType)
        const inferred = firstType === 'Any'
          ? (isArrayType(expectedType) || isIteratorType(expectedType) ? `Array<${expectedElementType}>` : 'Array<Any>')
          : homogeneous ? `Array<${firstType}>` : 'Array<Any>'
        node.analysis = { inferredType: inferred }
        if (!homogeneous && nonAny.length > 1) {
          pushDiagnostic(node, 'warning', `array literal mixes element types: ${nonAny.join(', ')}`)
        }
        enforceExpectedType(node, expectedType, inferred, 'array literal')
        return inferred
      }
      case 'CallExpr': {
        const calleeId = firstChildId(node, 'callee')
        const calleeType = calleeId ? visit(calleeId, scope, 'Any', returnType) : 'Any'
        const signature = calleeId ? getFunctionSignature(model.nodes[calleeId], model) : null
        for (const [index, argId] of (node.children.args ?? []).entries()) {
          const argExpected = signature?.paramTypes[index] ?? (signature?.variadic ? signature.paramTypes[0] : 'Any')
          setExpectedChildType(node, 'args', index, argExpected)
          visit(argId, scope, argExpected, returnType)
        }
        const inferred = signature?.returnType ?? 'Any'
        node.analysis = { inferredType: inferred }
        if (!signature && calleeType === 'Any') {
          pushDiagnostic(node, 'warning', 'call target has unknown type')
        }
        enforceExpectedType(node, expectedType, inferred, 'call expression')
        return inferred
      }
      case 'AssignExpr': {
        const targetId = firstChildId(node, 'target')
        const valueId = firstChildId(node, 'value')
        const targetType = targetId ? visit(targetId, scope, 'Any', returnType) : 'Any'
        if (targetId) setExpectedChildType(node, 'target', 0, targetType)
        if (valueId) setExpectedChildType(node, 'value', 0, targetType)
        const valueType = valueId ? visit(valueId, scope, targetType, returnType) : 'Any'
        node.analysis = { inferredType: targetType !== 'Any' ? targetType : valueType }
        if (!isAssignable(targetType, valueType)) {
          pushDiagnostic(node, 'error', `cannot assign ${valueType} to ${targetType}`)
        }
        return node.analysis.inferredType || 'Any'
      }
      default: {
        for (const childIds of Object.values(node.children)) {
          for (const childId of childIds) visit(childId, scope, 'Any', returnType)
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
  const past: IrModel[] = []
  const future: IrModel[] = []

  function cloneModelSnapshot(source: IrModel): IrModel {
    return JSON.parse(JSON.stringify(source)) as IrModel
  }

  function takeSnapshot(): IrModel {
    return cloneModelSnapshot({ nodes: model.nodes as unknown as Record<NodeId, IrNode>, rootId: model.rootId })
  }

  function applyCommand(cmd: EditCommand) {
    past.push(takeSnapshot())
    future.length = 0
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

  function undo(): boolean {
    const prev = past.pop()
    if (!prev) return false
    future.push(takeSnapshot())
    setModel(reconcile(prev))
    return true
  }

  function redo(): boolean {
    const next = future.pop()
    if (!next) return false
    past.push(takeSnapshot())
    setModel(reconcile(next))
    return true
  }

  function replaceModel(nextRoot: any) {
    const nextNodes: Record<NodeId, IrNode> = {}
    const nextSeed = seedModel(nextRoot, nextNodes)
    const nextModel: IrModel = { nodes: nextNodes, rootId: nextSeed.id }
    resolveModel(nextModel)
    past.length = 0
    future.length = 0
    setModel(reconcile(nextModel))
  }

  return { model, applyCommand, undo, redo, replaceModel }
}
