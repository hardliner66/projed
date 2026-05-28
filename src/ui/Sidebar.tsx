import { Component, For, Show, createMemo } from 'solid-js'
import type { IrModel, EditCommand } from '../ir/types'
import { selectedNodeId } from '../editor/state'

interface Props {
  model: IrModel
  onCommand: (cmd: EditCommand) => void
}

const Sidebar: Component<Props> = (props) => {
  const node = createMemo(() => {
    const id = selectedNodeId()
    return id ? props.model.nodes[id] : null
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

            <Show when={Object.keys(n().props).length > 0}>
              <Section title="Properties">
                <For each={Object.entries(n().props)}>
                  {([key, val]) => (
                    <div class="prop-row">
                      <span class="prop-key">{key}</span>
                      <input
                        class="prop-input"
                        type="text"
                        value={String(val ?? '')}
                        onChange={(e) =>
                          props.onCommand({ type: 'SET_PROP', nodeId: n().id, prop: key, value: e.currentTarget.value })
                        }
                      />
                    </div>
                  )}
                </For>
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
                  {([role, target]) => <Row label={role} value={target} />}
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
