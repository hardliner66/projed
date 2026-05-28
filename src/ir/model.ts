import { createStore, produce } from 'solid-js/store'
import type { IrModel, IrNode, NodeId, PropertyId, RoleId, Value, EditCommand } from './types'

function flattenNodes(node: IrNode, out: Record<NodeId, IrNode> = {}): Record<NodeId, IrNode> {
  out[node.id] = node
  for (const children of Object.values(node.children)) {
    for (const child of children) {
      const childNode = out[child]
      if (!childNode) {
        // child already registered or will be — skip
      }
    }
  }
  return out
}

function collectNodes(root: IrNode): Record<NodeId, IrNode> {
  const out: Record<NodeId, IrNode> = {}
  const queue = [root]
  while (queue.length) {
    const n = queue.shift()!
    out[n.id] = n
    for (const role of Object.values(n.children)) {
      for (const childId of role) {
        // children stored as IDs in flat map; for initial seed we walk the inline tree
      }
    }
  }
  return out
}

function seedModel(root: any, out: Record<NodeId, IrNode> = {}): IrNode {
  const node: IrNode = {
    id: root.id,
    kind: root.kind,
    props: root.props ?? {},
    children: {},
    refs: root.refs ?? {},
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
          delete m.nodes[cmd.nodeId]
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
    }))
  }

  return { model, applyCommand }
}
