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
  LetDecl: {
    kind: 'LetDecl',
    label: 'let',
    aliases: ['const', 'var', 'binding', 'value'],
    defaultProps: { name: 'value', type: 'Any' },
    defaultChildren: { value: [] },
  },
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
    defaultProps: { name: 'newFn', returnType: 'Unit' },
    defaultChildren: { params: [], body: [] },
  },
  Parameter: {
    kind: 'Parameter',
    label: 'param',
    aliases: ['parameter', 'argument', 'arg'],
    defaultProps: { name: 'param', type: 'String' },
    defaultChildren: {},
  },
  LetStmt: {
    kind: 'LetStmt',
    label: 'let',
    aliases: ['const', 'var', 'binding'],
    defaultProps: { name: 'value', type: 'Any' },
    defaultChildren: { value: [] },
  },
  ReturnStmt: {
    kind: 'ReturnStmt',
    label: 'return',
    aliases: ['ret', 'yield'],
    defaultProps: {},
    defaultChildren: { value: [] },
  },
  ExprStmt: {
    kind: 'ExprStmt',
    label: 'expr',
    aliases: ['statement', 'call', 'invoke'],
    defaultProps: {},
    defaultChildren: { expr: [] },
  },
  IfStmt: {
    kind: 'IfStmt',
    label: 'if',
    aliases: ['conditional', 'branch'],
    defaultProps: {},
    defaultChildren: { condition: [], thenBody: [], elseBody: [] },
  },
  WhileStmt: {
    kind: 'WhileStmt',
    label: 'while',
    aliases: ['loop', 'repeat'],
    defaultProps: {},
    defaultChildren: { condition: [], body: [] },
  },
  ForStmt: {
    kind: 'ForStmt',
    label: 'for',
    aliases: ['foreach', 'each', 'loop'],
    defaultProps: { item: 'item' },
    defaultChildren: { iterable: [], body: [] },
  },
  BreakStmt: {
    kind: 'BreakStmt',
    label: 'break',
    aliases: ['stop', 'exit'],
    defaultProps: {},
    defaultChildren: {},
  },
  ContinueStmt: {
    kind: 'ContinueStmt',
    label: 'continue',
    aliases: ['next', 'skip'],
    defaultProps: {},
    defaultChildren: {},
  },
  IdentifierExpr: {
    kind: 'IdentifierExpr',
    label: 'id',
    aliases: ['identifier', 'name', 'symbol', 'variable'],
    defaultProps: { name: 'x' },
    defaultChildren: {},
  },
  LiteralExpr: {
    kind: 'LiteralExpr',
    label: 'literal',
    aliases: ['constant', 'value', 'number', 'string', 'bool'],
    defaultProps: { value: '0' },
    defaultChildren: {},
  },
  BinaryExpr: {
    kind: 'BinaryExpr',
    label: 'binary',
    aliases: ['operation', 'op', 'infix'],
    defaultProps: { op: '+' },
    defaultChildren: { left: [], right: [] },
  },
  CallExpr: {
    kind: 'CallExpr',
    label: 'call',
    aliases: ['invoke', 'application', 'send'],
    defaultProps: {},
    defaultChildren: { callee: [], args: [] },
  },
  AssignExpr: {
    kind: 'AssignExpr',
    label: 'assign',
    aliases: ['set', 'update', 'mutation'],
    defaultProps: {},
    defaultChildren: { target: [], value: [] },
  },
}

export const ROLE_ALLOWED_KINDS: Record<string, string[]> = {
  declarations: ['StructDecl', 'FnDecl', 'LetDecl'],
  fields: ['FieldDecl'],
  params: ['Parameter'],
  body: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ForStmt', 'BreakStmt', 'ContinueStmt', 'ReturnStmt'],
  condition: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'],
  expr: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'],
  value: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'],
  left: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'],
  right: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'],
  callee: ['IdentifierExpr', 'CallExpr'],
  args: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'],
  target: ['IdentifierExpr'],
  iterable: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'],
  thenBody: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ReturnStmt'],
  elseBody: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ReturnStmt'],
}

// Child slots per concept kind — used for 'i' (insert child) navigation
export const CONCEPT_CHILD_SLOTS: Record<string, Record<string, string[]>> = {
  File: { declarations: ['StructDecl', 'FnDecl', 'LetDecl'] },
  StructDecl: { fields: ['FieldDecl'] },
  FnDecl: { params: ['Parameter'], body: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ForStmt', 'BreakStmt', 'ContinueStmt', 'ReturnStmt'] },
  LetDecl: { value: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'] },
  LetStmt: { value: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'] },
  ReturnStmt: { value: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'] },
  ExprStmt: { expr: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'] },
  IfStmt: {
    condition: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'],
    thenBody: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ForStmt', 'BreakStmt', 'ContinueStmt', 'ReturnStmt'],
    elseBody: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ForStmt', 'BreakStmt', 'ContinueStmt', 'ReturnStmt'],
  },
  WhileStmt: {
    condition: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'],
    body: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ForStmt', 'BreakStmt', 'ContinueStmt', 'ReturnStmt'],
  },
  ForStmt: {
    iterable: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'],
    body: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ForStmt', 'BreakStmt', 'ContinueStmt', 'ReturnStmt'],
  },
  BinaryExpr: { left: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'], right: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'] },
  CallExpr: { callee: ['IdentifierExpr', 'CallExpr'], args: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'] },
  AssignExpr: { target: ['IdentifierExpr'], value: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr'] },
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
