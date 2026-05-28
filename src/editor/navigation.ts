import type { IrModel } from '../ir/types'

export interface ParentContext {
  parentId: string
  role: string
  index: number
}

export function getParentContext(model: IrModel, nodeId: string): ParentContext | null {
  for (const [pid, pnode] of Object.entries(model.nodes)) {
    for (const [role, children] of Object.entries(pnode.children)) {
      const idx = children.indexOf(nodeId)
      if (idx >= 0) return { parentId: pid, role, index: idx }
    }
  }
  return null
}

export function buildNavOrder(model: IrModel): string[] {
  const visited = new Set<string>()
  const result: string[] = []

  function visit(id: string) {
    if (visited.has(id)) return
    visited.add(id)
    const node = model.nodes[id]
    if (!node) return
    result.push(id)
    for (const children of Object.values(node.children)) {
      for (const childId of children) visit(childId)
    }
  }

  visit(model.rootId)
  return result
}
