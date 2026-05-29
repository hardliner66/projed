export type NodeId = string
export type ConceptId = string
export type PropertyId = string
export type RoleId = string

export type Value = string | number | boolean | null

export interface NodeAnalysis {
  declaredType?: string
  inferredType?: string
}

export interface IrNode {
  id: NodeId
  kind: ConceptId
  props: Record<PropertyId, Value>
  children: Record<RoleId, NodeId[]>
  refs: Record<RoleId, NodeId>
  analysis?: NodeAnalysis
}

export interface IrModel {
  nodes: Record<NodeId, IrNode>
  rootId: NodeId
}

export type EditCommand =
  | { type: 'SET_PROP'; nodeId: NodeId; prop: PropertyId; value: Value }
  | { type: 'INSERT_CHILD'; parentId: NodeId; role: RoleId; child: IrNode; index?: number }
  | { type: 'DELETE_NODE'; nodeId: NodeId; parentId: NodeId; role: RoleId }
  | { type: 'MOVE_CHILD'; parentId: NodeId; role: RoleId; fromIndex: number; toIndex: number }
  | { type: 'REPLACE_NODE'; nodeId: NodeId; replacement: IrNode }
