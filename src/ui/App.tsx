import { Component, createEffect, createMemo, createSignal, Show, onMount, onCleanup } from 'solid-js'
import { createIrModel, filterKindsForInsert, getExpectedChildType } from '../ir/model'
import { runIrProgram } from '../ir/interpreter'
import NodeRenderer from './NodeRenderer'
import Sidebar from './Sidebar'
import ProjectionEditor from './ProjectionEditor'
import InsertMenu, { type InsertContext } from './InsertMenu'
import { selectedNodeId, setSelectedNodeId, editingNodeProp, setEditingNodeProp, setHighlightedNodeIds } from '../editor/state'
import { buildNavOrder, getParentContext, type ParentContext } from '../editor/navigation'
import { ROLE_ALLOWED_KINDS, CONCEPT_CHILD_SLOTS, makeNode, genId } from '../editor/concepts'

const AUTOSAVE_STORAGE_KEY = 'projed.program.autosave.v1'
const MANUAL_SAVE_STORAGE_KEY = 'projed.program.saved.v1'

const baseExampleAst = {
  id: 'file-1',
  kind: 'File',
  props: {},
  children: {
    declarations: [
      {
        id: 'struct-person',
        kind: 'StructDecl',
        props: { name: 'Person' },
        children: {
          fields: [
            { id: 'field-name', kind: 'FieldDecl', props: { name: 'name', type: 'String' }, children: {} },
            { id: 'field-age', kind: 'FieldDecl', props: { name: 'age', type: 'Int' }, children: {} },
          ],
        },
      },
      {
        id: 'fn-greet',
        kind: 'FnDecl',
        props: { name: 'greet', returnType: 'String' },
        children: {
          params: [
            { id: 'param-who', kind: 'Parameter', props: { name: 'who', type: 'String' }, children: {} },
          ],
          body: [
            {
              id: 'stmt-array',
              kind: 'LetStmt',
              props: { name: 'numbers', type: 'Array<Number>' },
              children: {
                value: [
                  {
                    id: 'array-numbers',
                    kind: 'ArrayLiteralExpr',
                    props: {},
                    children: {
                      elements: [
                        { id: 'lit-one', kind: 'LiteralExpr', props: { value: '1' }, children: {} },
                        { id: 'lit-two', kind: 'LiteralExpr', props: { value: '2' }, children: {} },
                        { id: 'lit-three', kind: 'LiteralExpr', props: { value: '3' }, children: {} },
                      ],
                    },
                  },
                ],
              },
            },
            {
              id: 'stmt-message',
              kind: 'LetStmt',
              props: { name: 'message', type: 'String' },
              children: {
                value: [
                  {
                    id: 'expr-greeting',
                    kind: 'BinaryExpr',
                    props: { op: '+' },
                    children: {
                      left: [{ id: 'lit-hello', kind: 'LiteralExpr', props: { value: '"Hello, "' }, children: {} }],
                      right: [{ id: 'id-who', kind: 'IdentifierExpr', props: { name: 'who' }, children: {} }],
                    },
                  },
                ],
              },
            },
            {
              id: 'stmt-negative',
              kind: 'ExprStmt',
              props: {},
              children: {
                expr: [
                  {
                    id: 'unary-negative',
                    kind: 'UnaryExpr',
                    props: { op: '-' },
                    children: {
                      expr: [{ id: 'lit-ten', kind: 'LiteralExpr', props: { value: '10' }, children: {} }],
                    },
                  },
                ],
              },
            },
            {
              id: 'stmt-member',
              kind: 'ExprStmt',
              props: {},
              children: {
                expr: [
                  {
                    id: 'member-length',
                    kind: 'MemberExpr',
                    props: { member: 'length' },
                    children: {
                      object: [{ id: 'id-numbers-member', kind: 'IdentifierExpr', props: { name: 'numbers' }, children: {} }],
                    },
                  },
                ],
              },
            },
            {
              id: 'stmt-loop',
              kind: 'ForStmt',
              props: { item: 'item' },
              children: {
                iterable: [
                  {
                    id: 'call-range',
                    kind: 'CallExpr',
                    props: {},
                    children: {
                      callee: [{ id: 'id-range', kind: 'IdentifierExpr', props: { name: 'range' }, children: {} }],
                      args: [
                        { id: 'lit-zero', kind: 'LiteralExpr', props: { value: '0' }, children: {} },
                        { id: 'lit-range-end', kind: 'LiteralExpr', props: { value: '3' }, children: {} },
                      ],
                    },
                  },
                ],
                body: [
                  {
                    id: 'stmt-loop-print',
                    kind: 'ExprStmt',
                    props: {},
                    children: {
                      expr: [
                        {
                          id: 'call-loop-print',
                          kind: 'CallExpr',
                          props: {},
                          children: {
                            callee: [{ id: 'id-print-loop', kind: 'IdentifierExpr', props: { name: 'print' }, children: {} }],
                            args: [{ id: 'id-item', kind: 'IdentifierExpr', props: { name: 'item' }, children: {} }],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              id: 'stmt-call-print',
              kind: 'ExprStmt',
              props: {},
              children: {
                expr: [
                  {
                    id: 'call-print-message',
                    kind: 'CallExpr',
                    props: {},
                    children: {
                      callee: [{ id: 'id-print', kind: 'IdentifierExpr', props: { name: 'print' }, children: {} }],
                      args: [{ id: 'id-message', kind: 'IdentifierExpr', props: { name: 'message' }, children: {} }],
                    },
                  },
                ],
              },
            },
            {
              id: 'stmt-return-message',
              kind: 'ReturnStmt',
              props: {},
              children: {
                value: [{ id: 'id-message-ret', kind: 'IdentifierExpr', props: { name: 'message' }, children: {} }],
              },
            },
          ],
        },
      },
      {
        id: 'fn-main',
        kind: 'FnDecl',
        props: { name: 'main', returnType: 'Unit' },
        children: {
          params: [],
          body: [
            {
              id: 'stmt-main-greeting',
              kind: 'LetStmt',
              props: { name: 'greeting', type: 'String' },
              children: {
                value: [
                  {
                    id: 'call-main-greet',
                    kind: 'CallExpr',
                    props: {},
                    children: {
                      callee: [{ id: 'id-main-greet', kind: 'IdentifierExpr', props: { name: 'greet' }, children: {} }],
                      args: [{ id: 'lit-main-who', kind: 'LiteralExpr', props: { value: '"World"' }, children: {} }],
                    },
                  },
                ],
              },
            },
            {
              id: 'stmt-main-print',
              kind: 'ExprStmt',
              props: {},
              children: {
                expr: [
                  {
                    id: 'call-main-print',
                    kind: 'CallExpr',
                    props: {},
                    children: {
                      callee: [{ id: 'id-main-print', kind: 'IdentifierExpr', props: { name: 'print' }, children: {} }],
                      args: [{ id: 'id-main-greeting', kind: 'IdentifierExpr', props: { name: 'greeting' }, children: {} }],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        id: 'let-version',
        kind: 'LetDecl',
        props: { name: 'version', type: 'Number' },
        children: {
          value: [{ id: 'lit-version', kind: 'LiteralExpr', props: { value: '1' }, children: {} }],
        },
      },
    ],
  },
}

function cloneAst<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function readStoredProgram(key: string): any | null {
  try {
    const raw = globalThis.localStorage?.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeStoredProgram(key: string, program: any) {
  try {
    globalThis.localStorage?.setItem(key, JSON.stringify(program))
  } catch {
    // Ignore storage failures.
  }
}

const App: Component = () => {
  const initialProgram = readStoredProgram(AUTOSAVE_STORAGE_KEY) ?? readStoredProgram(MANUAL_SAVE_STORAGE_KEY) ?? cloneAst(baseExampleAst)
  const { model, applyCommand, undo, redo, replaceModel } = createIrModel(initialProgram)
  const [insertCtx, setInsertCtx] = createSignal<InsertContext | null>(null)
  const [insertInitialQuery, setInsertInitialQuery] = createSignal('')
  const [clipboardNode, setClipboardNode] = createSignal<any | null>(null)
  const [outputText, setOutputText] = createSignal('')
  const [savedSnapshot, setSavedSnapshot] = createSignal<string>(JSON.stringify(readStoredProgram(MANUAL_SAVE_STORAGE_KEY) ?? initialProgram))

  function makeInsertContext(parentId: string, role: string, index: number, allowedKinds: string[]): InsertContext | null {
    const expectedType = getExpectedChildType(model, parentId, role, index)
    const filteredKinds = filterKindsForInsert(allowedKinds, expectedType)
    if (!filteredKinds.length) return null
    return { parentId, role, index, allowedKinds: filteredKinds, expectedType }
  }

  function serializeSubtree(nodeId: string): any | null {
    const node = model.nodes[nodeId]
    if (!node) return null
    const children: Record<string, any[]> = {}
    for (const [role, ids] of Object.entries(node.children)) {
      children[role] = ids.map((id) => serializeSubtree(id)).filter(Boolean) as any[]
    }
    return {
      id: node.id,
      kind: node.kind,
      props: { ...node.props },
      children,
      refs: {},
    }
  }

  function saveProgram() {
    const snapshot = serializeSubtree(model.rootId)
    if (!snapshot) return
    const serialized = JSON.stringify(snapshot)
    writeStoredProgram(MANUAL_SAVE_STORAGE_KEY, snapshot)
    writeStoredProgram(AUTOSAVE_STORAGE_KEY, snapshot)
    setSavedSnapshot(serialized)
    setOutputText('[saved] current program stored in browser localStorage')
  }

  function loadProgram() {
    const snapshot = readStoredProgram(MANUAL_SAVE_STORAGE_KEY)
    if (!snapshot) {
      setOutputText('[load failed] no saved program found in browser localStorage')
      return
    }
    replaceModel(snapshot)
    selectNode(null)
    const serialized = JSON.stringify(snapshot)
    writeStoredProgram(AUTOSAVE_STORAGE_KEY, snapshot)
    setSavedSnapshot(serialized)
    setOutputText('[loaded] restored program from browser localStorage')
  }

  function loadBaseExample() {
    const snapshot = cloneAst(baseExampleAst)
    replaceModel(snapshot)
    selectNode(null)
    writeStoredProgram(AUTOSAVE_STORAGE_KEY, snapshot)
    setOutputText('[loaded] base example restored')
  }

  const currentSnapshot = createMemo(() => {
    const snapshot = serializeSubtree(model.rootId)
    return snapshot ? JSON.stringify(snapshot) : ''
  })

  const saveStateText = createMemo(() => currentSnapshot() === savedSnapshot() ? 'Saved' : 'Unsaved changes')

  function cloneWithFreshIds(node: any): any {
    const clonedChildren: Record<string, any[]> = {}
    for (const [role, kids] of Object.entries<any[]>(node.children ?? {})) {
      clonedChildren[role] = kids.map((kid) => cloneWithFreshIds(kid))
    }
    return {
      ...node,
      id: genId(String(node.kind ?? 'node').toLowerCase()),
      children: clonedChildren,
      refs: {},
      analysis: undefined,
    }
  }

  function isEditingInput() {
    const el = document.activeElement
    return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
  }

  function parseSlotId(id: string): { parentId: string; role: string } | null {
    if (!id.startsWith('__slot__:')) return null
    const rest = id.slice('__slot__:'.length)
    const colonIdx = rest.indexOf(':')
    if (colonIdx < 0) return null
    return { parentId: rest.slice(0, colonIdx), role: rest.slice(colonIdx + 1) }
  }

  function getSiblingsOf(nodeId: string | null): { siblings: string[]; ctx: ParentContext } | null {
    if (!nodeId || nodeId === model.rootId) return null
    if (parseSlotId(nodeId)) return null
    const ctx = getParentContext(model, nodeId)
    if (!ctx) return null
    const siblings = model.nodes[ctx.parentId]?.children[ctx.role] ?? []
    return { siblings, ctx }
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  function selectNode(nodeId: string | null) {
    setEditingNodeProp(null)
    setSelectedNodeId(nodeId)
  }

  function selectNext() {
    const order = buildNavOrder(model)
    const cur = selectedNodeId()
    if (!cur) { selectNode(order[1] ?? null); return }
    const idx = order.indexOf(cur)
    if (idx >= 0 && idx + 1 < order.length) selectNode(order[idx + 1])
  }

  function selectPrev() {
    const order = buildNavOrder(model)
    const cur = selectedNodeId()
    if (!cur) return
    const idx = order.indexOf(cur)
    if (idx > 1) selectNode(order[idx - 1])
  }

  function selectParent() {
    const nodeId = selectedNodeId()
    if (!nodeId || nodeId === model.rootId) return
    const slot = parseSlotId(nodeId)
    if (slot) { selectNode(slot.parentId); return }
    const ctx = getParentContext(model, nodeId)
    if (ctx) selectNode(ctx.parentId)
  }

  // h: prev sibling if one exists, else go to parent
  function selectPrevSiblingOrParent() {
    const nodeId = selectedNodeId()
    if (!nodeId) return
    const slot = parseSlotId(nodeId)
    if (slot) { selectNode(slot.parentId); return }
    const result = getSiblingsOf(nodeId)
    if (!result) return
    const { siblings, ctx } = result
    if (ctx.index > 0) selectNode(siblings[ctx.index - 1])
    else selectNode(ctx.parentId)
  }

  function selectFirstChild() {
    const nodeId = selectedNodeId()
    if (!nodeId) return
    const node = model.nodes[nodeId]
    if (!node) return
    for (const children of Object.values(node.children)) {
      if (children.length > 0) { selectNode(children[0]); return }
    }
  }

  // l: next sibling if one exists, else descend into first child
  function selectNextSiblingOrChild() {
    const nodeId = selectedNodeId()
    if (!nodeId) return
    const result = getSiblingsOf(nodeId)
    if (result && result.ctx.index < result.siblings.length - 1) {
      selectNode(result.siblings[result.ctx.index + 1])
      return
    }
    selectFirstChild()
  }

  function selectFirstSibling() {
    const result = getSiblingsOf(selectedNodeId())
    if (result && result.siblings.length > 0) selectNode(result.siblings[0])
  }

  function selectLastSibling() {
    const result = getSiblingsOf(selectedNodeId())
    if (result && result.siblings.length > 0) selectNode(result.siblings[result.siblings.length - 1])
  }

  // ── Insert helpers ───────────────────────────────────────────────────────────

  function makeInsertContextFromSlot(slot: { parentId: string; role: string }): InsertContext | null {
    const parent = model.nodes[slot.parentId]
    if (!parent) return null
    const allowed = ROLE_ALLOWED_KINDS[slot.role] ?? CONCEPT_CHILD_SLOTS[parent.kind]?.[slot.role] ?? []
    if (!allowed.length) return null
    const index = (parent.children[slot.role] ?? []).length
    return makeInsertContext(slot.parentId, slot.role, index, allowed)
  }

  function openInsertSibling(ch: string, above = false) {
    const nodeId = selectedNodeId()
    if (!nodeId || nodeId === model.rootId) return
    // placeholder slot: both i and a fill the slot
    const slot = parseSlotId(nodeId)
    if (slot) {
      const ctx = makeInsertContextFromSlot(slot)
      if (!ctx) return
      setInsertCtx(ctx)
      setInsertInitialQuery(ch)
      return
    }
    const ctx = getParentContext(model, nodeId)
    if (!ctx) return
    const allowed = ROLE_ALLOWED_KINDS[ctx.role] ?? []
    if (!allowed.length) return
    const index = above ? ctx.index : ctx.index + 1
    const insertCtx = makeInsertContext(ctx.parentId, ctx.role, index, allowed)
    if (!insertCtx) return
    setInsertCtx(insertCtx)
    setInsertInitialQuery(ch)
  }

  function openInsertChild() {
    const nodeId = selectedNodeId()
    if (!nodeId) return
    const node = model.nodes[nodeId]
    if (!node) return
    const slots = CONCEPT_CHILD_SLOTS[node.kind] ?? {}
    for (const [role, allowed] of Object.entries(slots)) {
      if (allowed.length > 0) {
        const index = (node.children[role] ?? []).length
        const ctx = makeInsertContext(nodeId, role, index, allowed)
        if (!ctx) continue
        setInsertCtx(ctx)
        setInsertInitialQuery('')
        return
      }
    }
  }

  // kept for the "type any char to insert" fallback
  function openInsert(ch: string) { openInsertSibling(ch, false) }

  function handleInsert(kind: string, preFill?: Record<string, string>) {
    const ctx = insertCtx()
    if (!ctx) return
    const node = makeNode(kind)
    if (preFill) {
      for (const [k, v] of Object.entries(preFill)) node.props[k] = v
    }
    applyCommand({ type: 'INSERT_CHILD', parentId: ctx.parentId, role: ctx.role, child: node, index: ctx.index })
    setInsertCtx(null)
    setInsertInitialQuery('')
    selectNode(node.id)
    if (!preFill) {
      const firstProp = Object.keys(node.props)[0]
      if (firstProp) setEditingNodeProp({ nodeId: node.id, propName: firstProp })
    }
  }

  function deleteSelected() {
    const nodeId = selectedNodeId()
    if (!nodeId || nodeId === model.rootId) return
    const result = getSiblingsOf(nodeId)
    if (!result) return
    const { siblings, ctx } = result
    const nextSelected = ctx.index + 1 < siblings.length ? siblings[ctx.index + 1] : ctx.index > 0 ? siblings[ctx.index - 1] : ctx.parentId
    applyCommand({ type: 'DELETE_NODE', nodeId, parentId: ctx.parentId, role: ctx.role })
    selectNode(nextSelected)
  }

  function startEditingFirstProp() {
    const nodeId = selectedNodeId()
    if (!nodeId) return
    const slot = parseSlotId(nodeId)
    if (slot) {
      const ctx = makeInsertContextFromSlot(slot)
      if (!ctx) return
      setInsertCtx(ctx)
      setInsertInitialQuery('')
      return
    }
    const node = model.nodes[nodeId]
    if (!node) return
    const firstProp = Object.keys(node.props)[0]
    if (firstProp) setEditingNodeProp({ nodeId, propName: firstProp })
  }

  function copySelected() {
    const nodeId = selectedNodeId()
    if (!nodeId || nodeId === model.rootId) return
    const subtree = serializeSubtree(nodeId)
    if (subtree) setClipboardNode(subtree)
  }

  function cutSelected() {
    const nodeId = selectedNodeId()
    if (!nodeId || nodeId === model.rootId) return
    copySelected()
    deleteSelected()
  }

  function duplicateSelected() {
    const nodeId = selectedNodeId()
    if (!nodeId || nodeId === model.rootId) return
    const result = getSiblingsOf(nodeId)
    if (!result) return
    const subtree = serializeSubtree(nodeId)
    if (!subtree) return
    const clone = cloneWithFreshIds(subtree)
    applyCommand({ type: 'INSERT_CHILD', parentId: result.ctx.parentId, role: result.ctx.role, child: clone, index: result.ctx.index + 1 })
    selectNode(clone.id)
  }

  function moveSelectedUp() {
    const nodeId = selectedNodeId()
    if (!nodeId) return
    const result = getSiblingsOf(nodeId)
    if (!result || result.ctx.index === 0) return
    applyCommand({ type: 'MOVE_CHILD', parentId: result.ctx.parentId, role: result.ctx.role, fromIndex: result.ctx.index, toIndex: result.ctx.index - 1 })
  }

  function moveSelectedDown() {
    const nodeId = selectedNodeId()
    if (!nodeId) return
    const result = getSiblingsOf(nodeId)
    if (!result || result.ctx.index >= result.siblings.length - 1) return
    applyCommand({ type: 'MOVE_CHILD', parentId: result.ctx.parentId, role: result.ctx.role, fromIndex: result.ctx.index, toIndex: result.ctx.index + 1 })
  }

  function pasteClipboard() {
    const clip = clipboardNode()
    if (!clip) return

    const selected = selectedNodeId()
    if (selected && selected !== model.rootId) {
      const ctx = getParentContext(model, selected)
      if (!ctx) return
      const allowed = ROLE_ALLOWED_KINDS[ctx.role] ?? []
      if (!allowed.includes(clip.kind)) return
      const child = cloneWithFreshIds(clip)
      applyCommand({
        type: 'INSERT_CHILD',
        parentId: ctx.parentId,
        role: ctx.role,
        child,
        index: ctx.index + 1,
      })
      selectNode(child.id)
      return
    }

    const root = model.nodes[model.rootId]
    const role = 'declarations'
    const allowed = ROLE_ALLOWED_KINDS[role] ?? []
    if (!root || !allowed.includes(clip.kind)) return
    const child = cloneWithFreshIds(clip)
    const index = (root.children[role] ?? []).length
    applyCommand({
      type: 'INSERT_CHILD',
      parentId: model.rootId,
      role,
      child,
      index,
    })
    selectNode(child.id)
  }

  function runProgram() {
    const errorDiagnostics = Object.values(model.nodes)
      .flatMap((node) => (node.analysis?.diagnostics ?? []).map((diag) => ({ node, diag })))
      .filter(({ diag }) => diag.severity === 'error')

    if (errorDiagnostics.length > 0) {
      const lines = errorDiagnostics.slice(0, 8).map(({ node, diag }) => {
        const name = typeof node.props.name === 'string' && node.props.name.trim() ? ` ${node.props.name}` : ''
        return `${node.kind}${name}: ${diag.message}`
      })
      if (errorDiagnostics.length > lines.length) lines.push(`...and ${errorDiagnostics.length - lines.length} more error(s)`)
      setOutputText(`[typecheck failed]\n${lines.join('\n')}`)
      return
    }

    try {
      const out = runIrProgram(model)
      setOutputText(out || '<no output>')
    } catch (e) {
      setOutputText(`[runtime error] ${String(e)}`)
    }
  }

  createEffect(() => {
    const nodeId = selectedNodeId()
    if (!nodeId) { setHighlightedNodeIds(new Set<string>()); return }
    const node = model.nodes[nodeId]
    if (!node) { setHighlightedNodeIds(new Set<string>()); return }

    const ids = new Set<string>()
    // Resolve the declaration anchor: either this node IS the declaration (others ref it),
    // or this node holds a ref to its own declaration.
    const ownDecl = node.refs?.declaration || null  // '' for builtins → falsy
    const anchorId = ownDecl || nodeId

    for (const n of Object.values(model.nodes)) {
      if (n.id === nodeId) continue
      const decl = n.refs?.declaration
      if (decl && decl === anchorId) ids.add(n.id)  // usages of the anchor
    }
    // If this node is itself a usage, also highlight its declaration
    if (ownDecl) ids.add(ownDecl)

    setHighlightedNodeIds(ids)
  })

  createEffect(() => {
    const snapshot = serializeSubtree(model.rootId)
    if (snapshot) writeStoredProgram(AUTOSAVE_STORAGE_KEY, snapshot)
  })

  function onKeyDown(e: KeyboardEvent) {
    if (insertCtx()) return
    const withMeta = e.ctrlKey || e.metaKey
    if (withMeta && !e.altKey) {
      const key = e.key.toLowerCase()
      if (key === 'a' && !isEditingInput()) { e.preventDefault(); selectNode(model.rootId); return }
      if (key === 'c' && !isEditingInput()) { e.preventDefault(); copySelected(); return }
      if (key === 'x' && !isEditingInput()) { e.preventDefault(); cutSelected(); return }
      if (key === 'v' && !isEditingInput()) { e.preventDefault(); pasteClipboard(); return }
      if (key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return }
      if (key === 'y' || (key === 'z' && e.shiftKey)) { e.preventDefault(); redo(); return }
    }
    if (isEditingInput()) return
    if (e.ctrlKey || e.metaKey || e.altKey) return
    switch (e.key) {
      // ── Movement ──
      case 'ArrowDown': case 'j': e.preventDefault(); selectNext(); break
      case 'ArrowUp': case 'k': e.preventDefault(); selectPrev(); break
      case 'ArrowLeft': case 'h': e.preventDefault(); selectPrevSiblingOrParent(); break
      case 'ArrowRight': case 'l': e.preventDefault(); selectNextSiblingOrChild(); break
      case '0': case '_': e.preventDefault(); selectFirstSibling(); break
      case '$': e.preventDefault(); selectLastSibling(); break
      case 'd': e.preventDefault(); duplicateSelected(); break
      case '[': e.preventDefault(); moveSelectedUp(); break
      case ']': e.preventDefault(); moveSelectedDown(); break
      // ── Edit ──
      case 'e':
      case 'Enter':
      case 'F2': e.preventDefault(); startEditingFirstProp(); break
      // ── Insert ──
      case 'i': e.preventDefault(); openInsertSibling('', true); break
      case 'a': e.preventDefault(); openInsertSibling('', false); break
      case 'I': e.preventDefault(); openInsertChild(); break
      case 'o': e.preventDefault(); openInsertSibling('', false); break
      case 'O': e.preventDefault(); openInsertSibling('', true); break
      // ── Delete ──
      case 'Backspace':
      case 'Delete': e.preventDefault(); deleteSelected(); break
      // ── Misc ──
      case 'Escape': selectNode(null); break
      default:
        if (e.key.length === 1) openInsert(e.key)
    }
  }

  onMount(() => {
    window.addEventListener('keydown', onKeyDown)
    onCleanup(() => window.removeEventListener('keydown', onKeyDown))
  })

  const statusText = createMemo(() => {
    if (insertCtx()) return ''
    if (editingNodeProp()) return 'Enter confirm · Esc cancel'
    const sel = selectedNodeId()
    if (!sel) return 'Click or hjkl/↑↓←→ to select a node'
    if (sel === model.rootId) return 'hjkl navigate'
    if (parseSlotId(sel)) return 'e / i / a fill slot · Esc deselect'
    return 'hjkl/↑↓←→ navigate · 0/$ first/last · d dup · [/] move · e edit · i/a insert · I child · Del delete · Ctrl+C/X/V · Ctrl+Z/Y'
  })

  return (
    <div class="app">
      <header class="toolbar">
        <span class="app-title">Projed</span>
        <span class={`toolbar-save-state ${currentSnapshot() === savedSnapshot() ? 'is-saved' : 'is-dirty'}`}>{saveStateText()}</span>
        <button class="toolbar-btn" onClick={saveProgram}>Save</button>
        <button class="toolbar-btn" onClick={loadProgram}>Load</button>
        <button class="toolbar-btn" onClick={loadBaseExample}>Base Example</button>
        <button class="toolbar-btn" onClick={runProgram}>Run</button>
        <ProjectionEditor model={model} />
      </header>
      <div class="workspace">
        <main class="editor-surface" onClick={() => selectNode(null)}>
          <NodeRenderer nodeId={model.rootId} model={model} onCommand={applyCommand} />
        </main>
        <Sidebar
            model={model}
            onCommand={applyCommand}
            onSelect={(nodeId) => selectNode(nodeId)}
            onRequestInsert={(parentId, role, index) => {
              const parent = model.nodes[parentId]
              if (!parent) return
              const allowed = ROLE_ALLOWED_KINDS[role] ?? CONCEPT_CHILD_SLOTS[parent.kind]?.[role] ?? []
              if (!allowed.length) return
              const ctx = makeInsertContext(parentId, role, index, allowed)
              if (!ctx) return
              setInsertCtx(ctx)
              setInsertInitialQuery('')
            }}
          />
      </div>
      <div class="output-panel">
        <div class="output-header">
          <div class="output-title">Output</div>
          <button class="toolbar-btn" onClick={() => setOutputText('')}>Clear</button>
        </div>
        <pre class="output-content">{outputText()}</pre>
      </div>
      <div class="status-bar">{statusText()}</div>
      <Show when={insertCtx()}>
        {(ctx) => (
          <InsertMenu
            context={ctx()}
            initialQuery={insertInitialQuery()}
            onSelect={handleInsert}
            onClose={() => { setInsertCtx(null); setInsertInitialQuery('') }}
          />
        )}
      </Show>
    </div>
  )
}

export default App
