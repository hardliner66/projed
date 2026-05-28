import { createSignal } from 'solid-js'
import type { NodeId } from '../ir/types'

export interface EditingProp {
  nodeId: NodeId
  propName: string
}

const [selectedNodeId, setSelectedNodeId] = createSignal<NodeId | null>(null)
const [editingNodeProp, setEditingNodeProp] = createSignal<EditingProp | null>(null)

export { selectedNodeId, setSelectedNodeId, editingNodeProp, setEditingNodeProp }
