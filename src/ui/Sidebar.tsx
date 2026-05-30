import { Component, For, Show, createMemo } from 'solid-js'
import type { IrModel, EditCommand } from '../ir/types'
import type { CellDef } from '../projection/types'
import { getProjections } from '../projection/registry'
import { selectedNodeId, setSelectedNodeId, setEditingNodeProp } from '../editor/state'

/** Collect all prop names referenced anywhere in a CellDef tree. */
function collectPropNames(cells: CellDef[]): Set<string> {
  const result = new Set<string>()
  function walk(cell: CellDef) {
    if (cell.type === 'prop') { result.add(cell.name); return }
    if (cell.type === 'block' || cell.type === 'indent') cell.children.forEach(walk)
    if (cell.type === 'childList' && cell.separator) walk(cell.separator)
  }
  cells.forEach(walk)
  return result
}

interface Props {
  model: IrModel
  onCommand: (cmd: EditCommand) => void
}

const Sidebar: Component<Props> = (props) => {
  const node = createMemo(() => {
    const id = selectedNodeId()
    return id ? props.model.nodes[id] : null
  })

  // Always subscribe to getProjections() regardless of node, so any projection
  // change (including rule removal) immediately invalidates the derived memos.
  const projectedPropNames = createMemo(() => {
    const projections = getProjections()  // subscribe to projection changes unconditionally
    const n = node()
    if (!n) return new Set<string>()
    const cells = projections[n.kind]
    return cells ? collectPropNames(cells) : new Set<string>()
  })

  const hasRule = createMemo(() => {
    const n = node()
    if (!n) return false
    return n.kind in getProjections()
  })

  const propsToShow = createMemo(() => {
    const n = node()
    if (!n) return [] as [string, unknown][]
    const allProps = Object.entries(n.props)
    if (!hasRule()) return allProps                                       // no rule → show everything
    const mapped = projectedPropNames()
    return allProps.filter(([k]) => !mapped.has(k))                      // partial rule → only unmapped
  })

  return (
    <aside class="sidebar">
      <div class="sidebar-header">Inspector</div>
      <Show when={node()} fallback={<div class="sidebar-empty">No node selected</div>}>
        {(n) => (
          <div class="sidebar-content">
            <Section title="Identity">
              <Row label="ID" value={n().id} />
              <Row label="Kind" value={n().kind} />
            </Section>

            <Show when={n().analysis?.declaredType || n().analysis?.inferredType || n().analysis?.expectedType}>
              <Section title="Types">
                <Row label="Declared" value={n().analysis?.declaredType ?? '—'} />
                <Row label="Inferred" value={n().analysis?.inferredType ?? '—'} />
                <Row label="Expected" value={n().analysis?.expectedType ?? '—'} />
              </Section>
            </Show>

            <Show when={(n().analysis?.diagnostics?.length ?? 0) > 0}>
              <Section title="Diagnostics">
                <For each={n().analysis?.diagnostics ?? []}>
                  {(diag) => <div class={`diag-row diag-${diag.severity}`}>{diag.message}</div>}
                </For>
              </Section>
            </Show>

            <Show when={propsToShow().length > 0}>
              <Section title={hasRule() ? 'Unmapped Properties' : 'Properties'}>
                <div class="props-grid">
                  <div class="props-grid-header">Property</div>
                  <div class="props-grid-header">Value</div>
                  <For each={propsToShow()}>
                    {([key, val]) => (
                      <>
                        <div class="props-grid-key">{key}</div>
                        <input
                          class="prop-input props-grid-input"
                          type="text"
                          value={String(val ?? '')}
                          onChange={(e) =>
                            props.onCommand({ type: 'SET_PROP', nodeId: n().id, prop: key, value: e.currentTarget.value })
                          }
                        />
                      </>
                    )}
                  </For>
                </div>
              </Section>
            </Show>

            <Show when={Object.keys(n().children).length > 0}>
              <Section title="Children">
                <For each={Object.entries(n().children)}>
                  {([role, ids]) => (
                    <div class="children-row">
                      <span class="role-label">{role}</span>
                      <span class="role-ids">{ids.join(', ') || '—'}</span>
                    </div>
                  )}
                </For>
              </Section>
            </Show>

            <Show when={Object.keys(n().refs).length > 0}>
              <Section title="References">
                <For each={Object.entries(n().refs)}>
                  {([role, target]) => {
                    const resolved = props.model.nodes[target]
                    const value = resolved
                      ? `${resolved.kind}${resolved.props.name ? ` ${String(resolved.props.name)}` : ''}`
                      : target
                    return (
                      <div class="info-row clickable" onClick={() => { setEditingNodeProp(null); setSelectedNodeId(target) }}>
                        <span class="info-label">{role}</span>
                        <span class="info-value">{value}</span>
                      </div>
                    )
                  }}
                </For>
              </Section>
            </Show>
          </div>
        )}
      </Show>
    </aside>
  )
}

const Section: Component<{ title: string; children: any }> = (props) => (
  <div class="sidebar-section">
    <div class="section-title">{props.title}</div>
    {props.children}
  </div>
)

const Row: Component<{ label: string; value: string }> = (props) => (
  <div class="info-row">
    <span class="info-label">{props.label}</span>
    <span class="info-value">{props.value}</span>
  </div>
)

export default Sidebar
