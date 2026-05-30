import { createSignal } from 'solid-js'
import type { NodeId } from '../ir/types'

export interface EditingProp {
  nodeId: NodeId
  propName: string
}

const [selectedNodeId, setSelectedNodeId] = createSignal<NodeId | null>(null)
const [editingNodeProp, setEditingNodeProp] = createSignal<EditingProp | null>(null)
const [highlightedNodeIds, setHighlightedNodeIds] = createSignal<ReadonlySet<string>>(new Set<string>())

export { selectedNodeId, setSelectedNodeId, editingNodeProp, setEditingNodeProp, highlightedNodeIds, setHighlightedNodeIds }
