import { Component, createSignal, createMemo, For, Show, onMount } from 'solid-js'
import { CONCEPTS } from '../editor/concepts'

export interface InsertContext {
  parentId: string
  role: string
  index: number
  allowedKinds: string[]
  expectedType?: string | null
}

interface SmartCandidate {
  kind: string
  preFill: Record<string, string>
  display: string
  description: string
}

type DisplayItem =
  | ({ type: 'smart' } & SmartCandidate)
  | { type: 'concept'; kind: string; def: (typeof CONCEPTS)[string]; score: number }

interface Props {
  context: InsertContext
  initialQuery: string
  onSelect: (kind: string, preFill?: Record<string, string>) => void
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

function detectSmartCandidate(q: string, allowedKinds: string[]): SmartCandidate | null {
  if (!q) return null

  if (allowedKinds.includes('LiteralExpr')) {
    if (/^-?\d+(\.\d+)?$/.test(q))
      return { kind: 'LiteralExpr', preFill: { value: q }, display: q, description: 'number' }
    if (q === 'true' || q === 'false')
      return { kind: 'LiteralExpr', preFill: { value: q }, display: q, description: 'bool' }
    if (q === 'null')
      return { kind: 'LiteralExpr', preFill: { value: 'null' }, display: 'null', description: 'null' }
    if (q[0] === '"' || q[0] === "'") {
      const quote = q[0]
      const closed = q.length > 1 && q[q.length - 1] === quote ? q : q + quote
      return { kind: 'LiteralExpr', preFill: { value: closed }, display: closed, description: 'string' }
    }
  }

  if (q === '[' && allowedKinds.includes('ArrayLiteralExpr'))
    return { kind: 'ArrayLiteralExpr', preFill: {}, display: '[ ]', description: 'array' }

  // Identifier: only when no other allowed concept has a strong prefix/exact match
  if (/^[a-zA-Z_]\w*$/.test(q) && allowedKinds.includes('IdentifierExpr')) {
    const lower = q.toLowerCase()
    const strongConceptMatch = allowedKinds
      .filter(k => k !== 'IdentifierExpr')
      .some(kind => {
        const def = CONCEPTS[kind]
        if (!def) return false
        return [def.label, ...def.aliases].some(t => {
          const tl = t.toLowerCase()
          return tl === lower || tl.startsWith(lower)
        })
      })
    if (!strongConceptMatch)
      return { kind: 'IdentifierExpr', preFill: { name: q }, display: q, description: 'identifier' }
  }

  return null
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

  const smartCandidate = createMemo((): SmartCandidate | null =>
    detectSmartCandidate(query(), props.context.allowedKinds)
  )

  const conceptCandidates = createMemo(() => {
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

  const allItems = createMemo((): DisplayItem[] => {
    const items: DisplayItem[] = []
    const smart = smartCandidate()
    if (smart) items.push({ type: 'smart', ...smart })
    for (const c of conceptCandidates()) items.push({ type: 'concept', ...c })
    return items
  })

  function selectItem(idx: number) {
    const item = allItems()[idx]
    if (!item) return
    if (item.type === 'smart') { props.onSelect(item.kind, item.preFill); return }
    // Carry query forward as prop value for value-bearing concepts
    const q = query().trim()
    let preFill: Record<string, string> | undefined
    if (item.kind === 'LiteralExpr' && q && q !== item.def.label)
      preFill = { value: q }
    else if (item.kind === 'IdentifierExpr' && /^[a-zA-Z_]\w*$/.test(q) && q !== item.def.label)
      preFill = { name: q }
    props.onSelect(item.kind, preFill)
  }

  function onKeyDown(e: KeyboardEvent) {
    e.stopPropagation()
    const count = allItems().length
    if (e.key === 'ArrowDown') { e.preventDefault(); setFocusedIdx(i => Math.min(i + 1, count - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusedIdx(i => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); selectItem(focusedIdx()) }
    else if (e.key === 'Escape') { e.preventDefault(); props.onClose() }
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
          placeholder="type a value or search node types…"
          value={query()}
          onInput={e => { setQuery(e.currentTarget.value); setFocusedIdx(0) }}
          onKeyDown={onKeyDown}
        />
        <div class="insert-candidates">
          <For each={allItems()}>
            {(item, i) => item.type === 'smart' ? (
              <div
                class={`insert-candidate insert-smart${i() === focusedIdx() ? ' focused' : ''}`}
                onClick={() => selectItem(i())}
                onMouseEnter={() => setFocusedIdx(i())}
              >
                <span class="smart-value">{item.display}</span>
                <span class="smart-desc">{item.description}</span>
              </div>
            ) : (
              <div
                class={`insert-candidate${i() === focusedIdx() ? ' focused' : ''}`}
                onClick={() => selectItem(i())}
                onMouseEnter={() => setFocusedIdx(i())}
              >
                <span class="candidate-label">{item.def.label}</span>
                <span class="candidate-kind">{item.kind}</span>
                <span class="candidate-aliases">{item.def.aliases.slice(0, 3).join(', ')}</span>
              </div>
            )}
          </For>
          <Show when={allItems().length === 0}>
            <div class="insert-empty">No matching node types</div>
          </Show>
        </div>
      </div>
    </div>
  )
}

export default InsertMenu
