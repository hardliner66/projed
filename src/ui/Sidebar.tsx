import { Component, For, Show, createMemo } from 'solid-js'
import type { IrModel, EditCommand } from '../ir/types'
import { CONCEPTS } from '../editor/concepts'
import { selectedNodeId, setSelectedNodeId, setEditingNodeProp } from '../editor/state'

interface Props {
  model: IrModel
  onCommand: (cmd: EditCommand) => void
}

const Sidebar: Component<Props> = (props) => {
  const node = createMemo(() => {
    const id = selectedNodeId()
    return id ? props.model.nodes[id] : null
  })

  const diagnostics = createMemo(() => node()?.analysis?.diagnostics ?? [])

  const allPropKeys = createMemo(() => {
    const n = node()
    if (!n) return []
    const conceptKeys = Object.keys(CONCEPTS[n.kind]?.defaultProps ?? {})
    const nodeKeys = Object.keys(n.props)
    const seen = new Set(conceptKeys)
    return [...conceptKeys, ...nodeKeys.filter(k => !seen.has(k))]
  })

  const childEntries = createMemo(() => Object.entries(node()?.children ?? {}))
  const refEntries = createMemo(() => Object.entries(node()?.refs ?? {}))

  function selectReference(target: string) {
    setEditingNodeProp(null)
    setSelectedNodeId(target)
  }

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

            <Show when={diagnostics().length > 0}>
              <Section title="Diagnostics">
                <For each={diagnostics()}>
                  {(diag) => <div class={`diag-row diag-${diag.severity}`}>{diag.message}</div>}
                </For>
              </Section>
            </Show>

            <Show when={allPropKeys().length > 0}>
              <Section title="Properties">
                <div class="props-grid">
                  <div class="props-grid-header">Property</div>
                  <div class="props-grid-header">Value</div>
                  <For each={allPropKeys()}>
                    {(key) => (
                      <>
                        <div class="props-grid-key">{key}</div>
                        <input
                          class="prop-input props-grid-input"
                          type="text"
                          value={String(n().props[key] ?? '')}
                          onChange={(e) =>
                            props.onCommand({ type: 'SET_PROP', nodeId: n().id, prop: key, value: e.currentTarget.value })
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur()
                            if (e.key === 'Escape') {
                              e.currentTarget.value = String(n().props[key] ?? '')
                              e.currentTarget.blur()
                            }
                          }}
                        />
                      </>
                    )}
                  </For>
                </div>
              </Section>
            </Show>

            <Show when={childEntries().length > 0}>
              <Section title="Children">
                <For each={childEntries()}>
                  {([role, ids]) => (
                    <div class="children-row">
                      <span class="role-label">{role}</span>
                      <span class="role-ids">{ids.join(', ') || '—'}</span>
                    </div>
                  )}
                </For>
              </Section>
            </Show>

            <Show when={refEntries().length > 0}>
              <Section title="References">
                <For each={refEntries()}>
                  {([role, target]) => {
                    const resolved = props.model.nodes[target]
                    const value = resolved
                      ? `${resolved.kind}${resolved.props.name ? ` ${String(resolved.props.name)}` : ''}`
                      : target
                    return (
                      <div class="info-row clickable" onClick={() => selectReference(target)}>
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
