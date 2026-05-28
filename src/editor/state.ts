import { createSignal } from 'solid-js'
import type { NodeId } from '../ir/types'

export interface Cursor {
  nodeId: NodeId
  prop?: string
  offset?: number
}

const [selectedNodeId, setSelectedNodeId] = createSignal<NodeId | null>(null)
const [cursor, setCursor] = createSignal<Cursor | null>(null)

export { selectedNodeId, setSelectedNodeId, cursor, setCursor }
