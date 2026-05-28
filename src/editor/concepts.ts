export interface ConceptDef {
  kind: string
  label: string
  aliases: string[]
  defaultProps: Record<string, string>
  defaultChildren: Record<string, any[]>
}

let _seq = Math.floor(Date.now() / 1000) % 100000
export function genId(prefix: string): string {
  return `${prefix}-${(++_seq).toString(36)}`
}

export const CONCEPTS: Record<string, ConceptDef> = {
  StructDecl: {
    kind: 'StructDecl',
    label: 'struct',
    aliases: ['structure', 'record', 'type', 'class'],
    defaultProps: { name: 'NewStruct' },
    defaultChildren: { fields: [] },
  },
  FieldDecl: {
    kind: 'FieldDecl',
    label: 'field',
    aliases: ['property', 'member', 'attribute', 'attr'],
    defaultProps: { name: 'field', type: 'String' },
    defaultChildren: {},
  },
  FnDecl: {
    kind: 'FnDecl',
    label: 'fn',
    aliases: ['function', 'method', 'def', 'procedure'],
    defaultProps: { name: 'newFn' },
    defaultChildren: { params: [], body: [] },
  },
  Parameter: {
    kind: 'Parameter',
    label: 'param',
    aliases: ['parameter', 'argument', 'arg'],
    defaultProps: { name: 'param', type: 'String' },
    defaultChildren: {},
  },
}

export const ROLE_ALLOWED_KINDS: Record<string, string[]> = {
  declarations: ['StructDecl', 'FnDecl'],
  fields: ['FieldDecl'],
  params: ['Parameter'],
  body: [],
}

// Child slots per concept kind — used for 'i' (insert child) navigation
export const CONCEPT_CHILD_SLOTS: Record<string, Record<string, string[]>> = {
  File:       { declarations: ['StructDecl', 'FnDecl'] },
  StructDecl: { fields: ['FieldDecl'] },
  FnDecl:     { params: ['Parameter'] },
}

export function makeNode(kind: string): any {
  const def = CONCEPTS[kind]
  if (!def) throw new Error(`Unknown concept: ${kind}`)
  return {
    id: genId(kind.toLowerCase()),
    kind,
    props: { ...def.defaultProps },
    children: Object.fromEntries(
      Object.entries(def.defaultChildren).map(([k, v]) => [k, [...v]])
    ),
    refs: {},
  }
}
