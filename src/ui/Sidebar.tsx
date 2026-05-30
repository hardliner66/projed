import { Component, For, Show, createMemo } from 'solid-js'
import type { IrModel, EditCommand } from '../ir/types'
import { CONCEPTS, ROLE_ALLOWED_KINDS, CONCEPT_CHILD_SLOTS } from '../editor/concepts'
import { getParentContext } from '../editor/navigation'
import { selectedNodeId, setEditingNodeProp } from '../editor/state'

interface Props {
  model: IrModel
  onCommand: (cmd: EditCommand) => void
  onRequestInsert: (parentId: string, role: string, index: number) => void
  onSelect: (nodeId: string) => void
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

  const ancestorChain = createMemo(() => {
    const n = node()
    if (!n) return []
    const chain: Array<{ id: string; label: string }> = []
    const visited = new Set<string>()
    let currentId: string | null = n.id
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId)
      const current = props.model.nodes[currentId]
      if (!current) break
      const name = typeof current.props.name === 'string' && current.props.name
        ? ` (${current.props.name})` : ''
      chain.unshift({ id: current.id, label: `${current.kind}${name}` })
      if (currentId === props.model.rootId) break
      const ctx = getParentContext(props.model, currentId)
      currentId = ctx ? ctx.parentId : null
    }
    return chain
  })

  function select(id: string) {
    setEditingNodeProp(null)
    props.onSelect(id)
  }

  function nodeLabel(id: string): string {
    const n = props.model.nodes[id]
    if (!n) return id
    const name = typeof n.props.name === 'string' && n.props.name ? ` ${n.props.name}` : ''
    const value = typeof n.props.value === 'string' && n.props.value && !name
      ? ` ${n.props.value}` : ''
    return `${n.kind}${name || value}`
  }

  function canInsertIntoRole(nodeKind: string, role: string): boolean {
    return (ROLE_ALLOWED_KINDS[role] ?? CONCEPT_CHILD_SLOTS[nodeKind]?.[role] ?? []).length > 0
  }

  return (
    <aside class="sidebar">
      <div class="sidebar-header">Inspector</div>
      <Show when={node()} fallback={<div class="sidebar-empty">No node selected</div>}>
        {(n) => (
          <div class="sidebar-content">

            <Show when={ancestorChain().length > 1}>
              <Section title="Path">
                <div class="sidebar-path">
                  <For each={ancestorChain()}>
                    {(ancestor, i) => (
                      <>
                        <Show when={i() > 0}><span class="breadcrumb-sep">›</span></Show>
                        <span
                          class={`breadcrumb-item${ancestor.id === n().id ? ' breadcrumb-current' : ''}`}
                          onClick={() => ancestor.id !== n().id && select(ancestor.id)}
                        >{ancestor.label}</span>
                      </>
                    )}
                  </For>
                </div>
              </Section>
            </Show>

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
                    <div class="children-role">
                      <div class="role-header">
                        <span class="role-label">{role}</span>
                        <Show when={canInsertIntoRole(n().kind, role)}>
                          <button
                            class="sidebar-add-btn"
                            onClick={() => props.onRequestInsert(n().id, role, ids.length)}
                          >+ add</button>
                        </Show>
                      </div>
                      <Show when={ids.length > 0} fallback={
                        <div class="child-empty">empty</div>
                      }>
                        <For each={ids}>
                          {(childId) => (
                            <div class="child-item">
                              <button class="child-nav-btn" onClick={() => select(childId)}>
                                {nodeLabel(childId)}
                              </button>
                              <button
                                class="child-delete-btn"
                                title="Remove"
                                onClick={() => props.onCommand({
                                  type: 'DELETE_NODE',
                                  nodeId: childId,
                                  parentId: n().id,
                                  role,
                                })}
                              >✕</button>
                            </div>
                          )}
                        </For>
                      </Show>
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
                      <div class="info-row clickable" onClick={() => select(target)}>
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
