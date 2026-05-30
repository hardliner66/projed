import { Component, createSignal, createMemo, For, Show, onMount } from 'solid-js'
import { CONCEPTS } from '../editor/concepts'

export interface InsertContext {
  parentId: string
  role: string
  index: number
  allowedKinds: string[]
  expectedType?: string | null
}

interface Props {
  context: InsertContext
  initialQuery: string
  onSelect: (kind: string) => void
  onClose: () => void
}

function fuzzyScore(q: string, kind: string, label: string, aliases: string[]): number {
  if (!q) return 1
  const query = q.toLowerCase()
  const targets = [label.toLowerCase(), kind.toLowerCase(), ...aliases.map(a => a.toLowerCase())]
  for (const t of targets) {
    if (t === query) return 1000
    if (t.startsWith(query)) return 800
    if (t.includes(query)) return 500
  }
  for (const t of targets) {
    let qi = 0, score = 0
    for (let ti = 0; ti < t.length && qi < query.length; ti++) {
      if (t[ti] === query[qi]) { qi++; score += 10 }
    }
    if (qi === query.length) return score
  }
  return 0
}

const InsertMenu: Component<Props> = (props) => {
  const [query, setQuery] = createSignal(props.initialQuery)
  const [focusedIdx, setFocusedIdx] = createSignal(0)
  let inputRef!: HTMLInputElement

  onMount(() => {
    inputRef.focus()
    if (props.initialQuery) {
      inputRef.setSelectionRange(props.initialQuery.length, props.initialQuery.length)
    }
  })

  const candidates = createMemo(() => {
    const q = query()
    return props.context.allowedKinds
      .map(kind => {
        const def = CONCEPTS[kind]
        if (!def) return null
        const score = fuzzyScore(q, kind, def.label, def.aliases)
        return score > 0 ? { kind, def, score } : null
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.score - a.score)
  })

  function confirm() {
    const item = candidates()[focusedIdx()]
    if (item) props.onSelect(item.kind)
  }

  function onKeyDown(e: KeyboardEvent) {
    e.stopPropagation()
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setFocusedIdx(i => Math.min(i + 1, candidates().length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setFocusedIdx(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      confirm()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      props.onClose()
    }
  }

  return (
    <div class="insert-backdrop" onClick={props.onClose}>
      <div class="insert-menu" onClick={e => e.stopPropagation()}>
        <div class="insert-header">
          Insert into <span class="insert-role">{props.context.role}</span>
          <Show when={props.context.expectedType && props.context.expectedType !== 'Any'}>
            <span class="insert-expected">expects {props.context.expectedType}</span>
          </Show>
        </div>
        <input
          ref={inputRef}
          class="insert-query"
          type="text"
          placeholder="Search node types…"
          value={query()}
          onInput={e => { setQuery(e.currentTarget.value); setFocusedIdx(0) }}
          onKeyDown={onKeyDown}
        />
        <div class="insert-candidates">
          <For each={candidates()}>
            {(item, i) => (
              <div
                class={`insert-candidate ${i() === focusedIdx() ? 'focused' : ''}`}
                onClick={() => props.onSelect(item.kind)}
                onMouseEnter={() => setFocusedIdx(i())}
              >
                <span class="candidate-label">{item.def.label}</span>
                <span class="candidate-kind">{item.kind}</span>
                <span class="candidate-aliases">{item.def.aliases.slice(0, 3).join(', ')}</span>
              </div>
            )}
          </For>
          <Show when={candidates().length === 0}>
            <div class="insert-empty">No matching node types</div>
          </Show>
        </div>
      </div>
    </div>
  )
}

export default InsertMenu
