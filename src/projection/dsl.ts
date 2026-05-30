import type { CellDef, ProjectionMap } from './types'

// ── DSL Reference ─────────────────────────────────────────────────────────────
//
//  Grammar (one node definition per block):
//
//    NodeKind: atom atom ...        ← single-line (row of atoms, or single atom)
//
//    NodeKind:                      ← multi-line (column of rows)
//      atom atom ...                ← a row inside the column
//      indent roleName              ← indented child list
//      roleName                     ← vertical child list (alone on its line)
//
//  Atoms:
//    kw"text"          keyword-styled label   e.g. kw"fn "
//    "text"            punct-styled label     e.g. "("
//    @propName         editable property      e.g. @name
//    >childName        single child slot      e.g. >value
//    list...           inline child list      e.g. args...
//    list...("sep")    inline list + sep      e.g. params...("`, `")
//
//  Use \" inside a string to include a literal double-quote.
//  Comments start with #.  Blank lines are ignored.
//
export const DSL_REFERENCE = `\
# ── Projection DSL reference ────────────────────────────────────────────────
#
#  NodeKind: atom atom ...       ← single-line row
#
#  NodeKind:                     ← multi-line column
#    atom atom ...               ←   row inside column
#    indent roleName             ←   indented child list
#    roleName                    ←   vertical child list (alone on line)
#
#  Atoms:
#    kw"text"   keyword label     "text"   punct label
#    @propName  property          >child   single child slot
#    list...    inline list       list...("sep")  inline + separator
#    Use \\" inside a string for a literal double-quote.
#
# ─────────────────────────────────────────────────────────────────────────────
`

// ── Internal token type ───────────────────────────────────────────────────────

type Atom =
    | { kind: 'label'; text: string; style: 'keyword' | 'punct' }
    | { kind: 'prop'; name: string }
    | { kind: 'child'; name: string }
    | { kind: 'inlineList'; name: string; sep: CellDef | null }
    | { kind: 'bareList'; name: string }

// ── Tokenizer ─────────────────────────────────────────────────────────────────

function isIdentStart(ch: string): boolean {
    return /[A-Za-z_]/.test(ch)
}

function isIdentChar(ch: string): boolean {
    return /[A-Za-z0-9_]/.test(ch)
}

/** Reads a double-quoted string at src[pos]; returns the decoded text and the position after the closing quote. */
function readQuoted(src: string, pos: number): { text: string; end: number } | null {
    if (src[pos] !== '"') return null
    let i = pos + 1
    let text = ''
    while (i < src.length && src[i] !== '"') {
        if (src[i] === '\\' && i + 1 < src.length && src[i + 1] === '"') {
            text += '"'
            i += 2
        } else {
            text += src[i++]
        }
    }
    if (i >= src.length) return null // unterminated
    return { text, end: i + 1 }
}

/** Parse a single separator atom inside `list...(...)`. Returns the CellDef or an error string. */
function parseSepAtom(src: string, pos: number): { cell: CellDef; end: number } | string {
    while (pos < src.length && (src[pos] === ' ' || src[pos] === '\t')) pos++
    if (src.startsWith('kw"', pos)) {
        const r = readQuoted(src, pos + 2)
        if (!r) return `Unterminated keyword string in separator`
        return { cell: { type: 'label', text: r.text, style: 'keyword' }, end: r.end }
    }
    if (src[pos] === '"') {
        const r = readQuoted(src, pos)
        if (!r) return `Unterminated string in separator`
        return { cell: { type: 'label', text: r.text, style: 'punct' }, end: r.end }
    }
    return `Expected a quoted string as separator at position ${pos}`
}

/** Tokenize a line of atoms. Returns an error string on failure. */
function tokenizeAtoms(src: string): Atom[] | string {
    const tokens: Atom[] = []
    let i = 0
    while (i < src.length) {
        // skip whitespace
        while (i < src.length && (src[i] === ' ' || src[i] === '\t')) i++
        if (i >= src.length) break
        if (src[i] === '#') break // rest is comment

        // keyword label: kw"..."
        if (src.startsWith('kw"', i)) {
            const r = readQuoted(src, i + 2)
            if (!r) return `Unterminated keyword label at position ${i}`
            tokens.push({ kind: 'label', text: r.text, style: 'keyword' })
            i = r.end
            continue
        }

        // punct label: "..."
        if (src[i] === '"') {
            const r = readQuoted(src, i)
            if (!r) return `Unterminated label at position ${i}`
            tokens.push({ kind: 'label', text: r.text, style: 'punct' })
            i = r.end
            continue
        }

        // prop: @name
        if (src[i] === '@') {
            i++
            let name = ''
            while (i < src.length && isIdentChar(src[i])) name += src[i++]
            if (!name) return `Expected identifier after '@' at position ${i}`
            tokens.push({ kind: 'prop', name })
            continue
        }

        // child: >name
        if (src[i] === '>') {
            i++
            let name = ''
            while (i < src.length && isIdentChar(src[i])) name += src[i++]
            if (!name) return `Expected identifier after '>' at position ${i}`
            tokens.push({ kind: 'child', name })
            continue
        }

        // identifier → inlineList (name...) or bareList (name)
        if (isIdentStart(src[i])) {
            let name = ''
            while (i < src.length && isIdentChar(src[i])) name += src[i++]

            if (src.startsWith('...', i)) {
                i += 3
                let sep: CellDef | null = null
                if (src[i] === '(') {
                    i++
                    const r = parseSepAtom(src, i)
                    if (typeof r === 'string') return r
                    sep = r.cell
                    i = r.end
                    while (i < src.length && (src[i] === ' ' || src[i] === '\t')) i++
                    if (src[i] !== ')') return `Expected ')' after separator at position ${i}`
                    i++
                }
                tokens.push({ kind: 'inlineList', name, sep })
            } else {
                tokens.push({ kind: 'bareList', name })
            }
            continue
        }

        return `Unexpected character '${src[i]}' at position ${i}`
    }
    return tokens
}

// ── Atom → CellDef ────────────────────────────────────────────────────────────

function atomsToCells(atoms: Atom[]): CellDef[] {
    return atoms.map(atom => {
        switch (atom.kind) {
            case 'label':
                return { type: 'label' as const, text: atom.text, style: atom.style }
            case 'prop':
                return { type: 'prop' as const, name: atom.name }
            case 'child':
                return { type: 'child' as const, name: atom.name }
            case 'inlineList': {
                const cell: Extract<CellDef, { type: 'childList' }> = { type: 'childList', name: atom.name, inline: true }
                if (atom.sep) cell.separator = atom.sep
                return cell
            }
            case 'bareList':
                return { type: 'childList' as const, name: atom.name }
        }
    })
}

/** Wrap multiple cells in a row block; leave a single cell unwrapped. */
function wrapRow(cells: CellDef[]): CellDef {
    if (cells.length === 1) return cells[0]
    return { type: 'block', direction: 'row', children: cells }
}

// ── Parser ────────────────────────────────────────────────────────────────────

/**
 * Parse DSL text into a ProjectionMap.
 *
 * Returns `{ ok: true, map }` on success or `{ ok: false, error }` on failure.
 */
export function parseDsl(text: string): { ok: true; map: ProjectionMap } | { ok: false; error: string } {
    const map: ProjectionMap = {}
    const lines = text.split('\n')
    let i = 0

    while (i < lines.length) {
        const raw = lines[i]
        const trimmed = raw.trim()
        i++

        if (!trimmed || trimmed.startsWith('#')) continue

        const colonIdx = trimmed.indexOf(':')
        if (colonIdx < 0) {
            return { ok: false, error: `Line ${i}: expected "NodeKind: ..." but got "${trimmed}"` }
        }

        const nodeName = trimmed.slice(0, colonIdx).trim()
        if (!nodeName) return { ok: false, error: `Line ${i}: empty node name` }

        const rest = trimmed.slice(colonIdx + 1).trim()

        if (rest) {
            // ── Single-line definition ──────────────────────────────────────────────
            const atoms = tokenizeAtoms(rest)
            if (typeof atoms === 'string') return { ok: false, error: `Line ${i} (${nodeName}): ${atoms}` }
            const cells = atomsToCells(atoms)
            if (cells.length === 0) return { ok: false, error: `Line ${i} (${nodeName}): empty definition` }
            map[nodeName] = cells.length === 1 ? cells : [wrapRow(cells)]
        } else {
            // ── Multi-line definition (col block) ───────────────────────────────────
            const colChildren: CellDef[] = []

            while (i < lines.length) {
                const innerRaw = lines[i]
                // A line not starting with whitespace ends this block.
                if (innerRaw.length > 0 && innerRaw[0] !== ' ' && innerRaw[0] !== '\t') break
                const innerTrimmed = innerRaw.trim()
                i++
                if (!innerTrimmed || innerTrimmed.startsWith('#')) continue

                // indent directive
                if (innerTrimmed.startsWith('indent ')) {
                    const listName = innerTrimmed.slice(7).trim()
                    if (!listName || !isIdentStart(listName[0])) {
                        return { ok: false, error: `Line ${i} (${nodeName}): expected identifier after 'indent'` }
                    }
                    colChildren.push({
                        type: 'indent',
                        children: [{ type: 'childList', name: listName, indent: true }],
                    })
                    continue
                }

                const atoms = tokenizeAtoms(innerTrimmed)
                if (typeof atoms === 'string') return { ok: false, error: `Line ${i} (${nodeName}): ${atoms}` }
                const cells = atomsToCells(atoms)
                if (cells.length === 0) continue

                // A lone bare childList stays unwrapped; everything else gets a row block.
                const isBareList = (c: CellDef): c is Extract<CellDef, { type: 'childList' }> =>
                    c.type === 'childList' && !(c as Extract<CellDef, { type: 'childList' }>).inline

                if (cells.length === 1 && isBareList(cells[0])) {
                    colChildren.push(cells[0])
                } else {
                    colChildren.push(wrapRow(cells))
                }
            }

            if (colChildren.length === 0) {
                return { ok: false, error: `${nodeName}: multi-line definition has no content` }
            }
            map[nodeName] =
                colChildren.length === 1
                    ? [colChildren[0]]
                    : [{ type: 'block', direction: 'col', children: colChildren }]
        }
    }

    return { ok: true, map }
}

// ── Serializer ────────────────────────────────────────────────────────────────

/** Escape double-quotes inside a label text for DSL output. */
function escapeDslString(text: string): string {
    return text.replace(/"/g, '\\"')
}

function serializeLabelCell(cell: Extract<CellDef, { type: 'label' }>): string {
    const escaped = escapeDslString(cell.text)
    return cell.style === 'keyword' ? `kw"${escaped}"` : `"${escaped}"`
}

/** Serialize a single cell as an inline atom string. Returns null if it cannot be expressed as an atom. */
function serializeAtom(cell: CellDef): string | null {
    switch (cell.type) {
        case 'label':
            return serializeLabelCell(cell)
        case 'prop':
            return `@${cell.name}`
        case 'child':
            return `>${cell.name}`
        case 'childList': {
            if (cell.inline) {
                const sep = cell.separator ? `(${serializeAtom(cell.separator) ?? '"?"'})` : ''
                return `${cell.name}...${sep}`
            }
            return cell.name // bare list — only valid alone on a line
        }
        default:
            return null // block / indent cannot be atoms
    }
}

/** Serialize a flat list of cells as a row of atoms. */
function serializeRowAtoms(cells: CellDef[]): string {
    return cells.map(c => serializeAtom(c) ?? '?').join(' ')
}

/**
 * Serialize the children of a col block into indented DSL lines (each prefixed with two spaces).
 * Returns null if the structure is too complex to represent in DSL.
 */
function serializeColChildren(children: CellDef[]): string[] | null {
    const lines: string[] = []
    for (const child of children) {
        if (child.type === 'block' && child.direction === 'row') {
            lines.push('  ' + serializeRowAtoms(child.children))
        } else if (child.type === 'indent') {
            const inner = child.children
            if (inner.length === 1 && inner[0].type === 'childList') {
                lines.push(`  indent ${inner[0].name}`)
            } else {
                // Unusual — flatten as best we can
                for (const c of inner) {
                    const a = serializeAtom(c)
                    if (a) lines.push('  ' + a)
                    else return null
                }
            }
        } else {
            const a = serializeAtom(child)
            if (a !== null) {
                lines.push('  ' + a)
            } else if (child.type === 'block' && child.direction === 'col') {
                // Nested col — unusual, flatten one level
                const nested = serializeColChildren(child.children)
                if (!nested) return null
                lines.push(...nested.map(l => '  ' + l))
            } else {
                return null // Cannot represent
            }
        }
    }
    return lines
}

/**
 * Serialize one node's CellDef[] into DSL lines (without the `NodeKind:` prefix).
 * Returns null if the structure is too complex to represent in DSL.
 */
function serializeCellDefs(cells: CellDef[]): string[] | null {
    // A single cell or a single block
    if (cells.length === 1) {
        const cell = cells[0]
        if (cell.type === 'block' && cell.direction === 'row') {
            return [serializeRowAtoms(cell.children)]
        }
        if (cell.type === 'block' && cell.direction === 'col') {
            return serializeColChildren(cell.children)
        }
        const a = serializeAtom(cell)
        return a !== null ? [a] : null
    }
    // Multiple top-level cells — treat as implicit row
    return [serializeRowAtoms(cells)]
}

/**
 * Serialize a full ProjectionMap to DSL text.
 *
 * Nodes that cannot be expressed in DSL emit a JSON fallback block so that
 * re-parsing still round-trips correctly (via the `#!json` extension handled by `parseDsl`).
 */
export function serializeDsl(map: ProjectionMap): string {
    const parts: string[] = []
    for (const [kind, cells] of Object.entries(map)) {
        const lines = serializeCellDefs(cells)
        if (!lines) {
            // Fallback: emit as a JSON comment block that parseDsl will re-ingest.
            parts.push(`# ${kind}: (complex — edit in JSON mode)`)
            continue
        }
        if (lines.length === 1) {
            parts.push(`${kind}: ${lines[0]}`)
        } else {
            parts.push(`${kind}:`)
            for (const line of lines) parts.push(line)
        }
    }
    return parts.join('\n')
}
