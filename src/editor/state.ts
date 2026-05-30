import { createSignal } from 'solid-js'
import type { NodeId } from '../ir/types'

export interface EditingProp {
  nodeId: NodeId
  propName: string
}

export interface SearchState {
  query: string
  matchIds: string[]
  cursor: number
}

const [selectedNodeId, setSelectedNodeId] = createSignal<NodeId | null>(null)
const [editingNodeProp, setEditingNodeProp] = createSignal<EditingProp | null>(null)
const [highlightedNodeIds, setHighlightedNodeIds] = createSignal<ReadonlySet<string>>(new Set<string>())
const [collapsedNodeIds, setCollapsedNodeIds] = createSignal<ReadonlySet<string>>(new Set<string>())
const [searchState, setSearchState] = createSignal<SearchState | null>(null)

export { selectedNodeId, setSelectedNodeId, editingNodeProp, setEditingNodeProp, highlightedNodeIds, setHighlightedNodeIds, collapsedNodeIds, setCollapsedNodeIds, searchState, setSearchState }
