import { Component, For, Show, Switch, Match } from 'solid-js'
import type { IrNode, IrModel, EditCommand } from '../ir/types'
import type { CellDef, ProjectionMap } from '../projection/types'
import { getProjections } from '../projection/registry'
import { selectedNodeId, setSelectedNodeId, setEditingNodeProp } from '../editor/state'
import LabelCell from './cells/LabelCell'
import PropCell from './cells/PropCell'

interface Props {
  nodeId: string
  model: IrModel
  onCommand: (cmd: EditCommand) => void
  projectionMap?: ProjectionMap
}

const NodeRenderer: Component<Props> = (props) => {
  const node = () => props.model.nodes[props.nodeId]
  const cells = () => (props.projectionMap ?? getProjections())[node()?.kind]
  const isSelected = () => selectedNodeId() === props.nodeId

  function handleClick(e: MouseEvent) {
    e.stopPropagation()
    setEditingNodeProp(null)
    setSelectedNodeId(props.nodeId)
  }

  return (
    <Show when={node()} fallback={<span class="error">missing:{props.nodeId}</span>}>
      <div
        class={`node-wrapper ${isSelected() ? 'selected' : ''}`}
        onClick={handleClick}
      >
        <Show when={cells()} fallback={<FallbackRenderer node={node()} />}>
          <CellListRenderer
            cells={cells()!}
            node={node()}
            model={props.model}
            onCommand={props.onCommand}
            projectionMap={props.projectionMap}
          />
        </Show>
      </div>
    </Show>
  )
}

interface CellListProps {
  cells: CellDef[]
  node: IrNode
  model: IrModel
  onCommand: (cmd: EditCommand) => void
  projectionMap?: ProjectionMap
}

export const CellListRenderer: Component<CellListProps> = (props) => (
  <For each={props.cells}>
    {(cell) => (
      <CellRenderer
        cell={cell}
        node={props.node}
        model={props.model}
        onCommand={props.onCommand}
        projectionMap={props.projectionMap}
      />
    )}
  </For>
)

interface CellProps {
  cell: CellDef
  node: IrNode
  model: IrModel
  onCommand: (cmd: EditCommand) => void
  projectionMap?: ProjectionMap
}

const CellRenderer: Component<CellProps> = (props) => {
  const cell = () => props.cell

  return (
    <Switch>
      <Match when={cell().type === 'label' && cell() as Extract<CellDef, { type: 'label' }>}>
        {(c) => <LabelCell text={c().text} style={c().style} />}
      </Match>

      <Match when={cell().type === 'prop' && cell() as Extract<CellDef, { type: 'prop' }>}>
        {(c) => (
          <PropCell
            node={props.node}
            propName={c().name}
            onCommand={props.onCommand}
            multiline={c().multiline}
          />
        )}
      </Match>

      <Match when={cell().type === 'child' && cell() as Extract<CellDef, { type: 'child' }>}>
        {(c) => {
          const slotId = () => `__slot__:${props.node.id}:${c().name}`
          const childId = () => props.node.children[c().name]?.[0]
          return (
            <Show when={childId()} fallback={
              <span
                class="placeholder-slot"
                classList={{ selected: selectedNodeId() === slotId() }}
                onClick={(e) => { e.stopPropagation(); setEditingNodeProp(null); setSelectedNodeId(slotId()) }}
              >‹{c().name}›</span>
            }>
              <NodeRenderer
                nodeId={childId()!}
                model={props.model}
                onCommand={props.onCommand}
                projectionMap={props.projectionMap}
              />
            </Show>
          )
        }}
      </Match>

      <Match when={cell().type === 'childList' && cell() as Extract<CellDef, { type: 'childList' }>}>
        {(c) => {
          const slotId = () => `__slot__:${props.node.id}:${c().name}`
          const ids = () => props.node.children[c().name] ?? []
          return (
            <div class={`child-list ${c().indent ? 'indented' : ''} ${c().inline ? 'inline' : ''}`}>
              <For each={ids()}>
                {(childId, i) => (
                  <>
                    <NodeRenderer
                      nodeId={childId}
                      model={props.model}
                      onCommand={props.onCommand}
                      projectionMap={props.projectionMap}
                    />
                    <Show when={c().separator && i() < ids().length - 1}>
                      <CellRenderer
                        cell={c().separator!}
                        node={props.node}
                        model={props.model}
                        onCommand={props.onCommand}
                        projectionMap={props.projectionMap}
                      />
                    </Show>
                  </>
                )}
              </For>
              <Show when={ids().length === 0}>
                <span
                  class="placeholder-slot empty-list"
                  classList={{ selected: selectedNodeId() === slotId() }}
                  onClick={(e) => { e.stopPropagation(); setEditingNodeProp(null); setSelectedNodeId(slotId()) }}
                >&lt;empty {c().name}&gt;</span>
              </Show>
            </div>
          )
        }}
      </Match>

      <Match when={cell().type === 'block' && cell() as Extract<CellDef, { type: 'block' }>}>
        {(c) => (
          <div class={`cell-block dir-${c().direction ?? 'row'}`}>
            <CellListRenderer
              cells={c().children}
              node={props.node}
              model={props.model}
              onCommand={props.onCommand}
              projectionMap={props.projectionMap}
            />
          </div>
        )}
      </Match>

      <Match when={cell().type === 'indent' && cell() as Extract<CellDef, { type: 'indent' }>}>
        {(c) => (
          <div class="cell-indent">
            <CellListRenderer
              cells={c().children}
              node={props.node}
              model={props.model}
              onCommand={props.onCommand}
              projectionMap={props.projectionMap}
            />
          </div>
        )}
      </Match>

      <Match when={cell().type === 'newline'}>
        <br />
      </Match>
    </Switch>
  )
}

const FallbackRenderer: Component<{ node: IrNode }> = (props) => (
  <span class="fallback-node">
    &lt;{props.node.kind}
    <For each={Object.entries(props.node.props)}>
      {([k, v]) => <span class="fallback-prop"> {k}="{String(v)}"</span>}
    </For>
    &gt;
  </span>
)

export default NodeRenderer
