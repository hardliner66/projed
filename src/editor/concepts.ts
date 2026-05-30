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
  UnaryExpr: {
    kind: 'UnaryExpr',
    label: 'unary',
    aliases: ['negate', 'not', 'prefix'],
    defaultProps: { op: '-' },
    defaultChildren: { expr: [] },
  },
  MemberExpr: {
    kind: 'MemberExpr',
    label: 'member',
    aliases: ['property access', 'field access', 'dot'],
    defaultProps: { member: 'field' },
    defaultChildren: { object: [] },
  },
  ArrayLiteralExpr: {
    kind: 'ArrayLiteralExpr',
    label: 'array',
    aliases: ['list', 'vector', 'collection'],
    defaultProps: {},
    defaultChildren: { elements: [] },
  },
  IndexExpr: {
    kind: 'IndexExpr',
    label: 'index',
    aliases: ['subscript', 'at', 'bracket', 'get'],
    defaultProps: {},
    defaultChildren: { object: [], index: [] },
  },
}

export const ROLE_ALLOWED_KINDS: Record<string, string[]> = {
  declarations: ['StructDecl', 'FnDecl', 'LetDecl'],
  fields: ['FieldDecl'],
  params: ['Parameter'],
  body: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ForStmt', 'BreakStmt', 'ContinueStmt', 'ReturnStmt'],
  condition: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'IndexExpr', 'ArrayLiteralExpr'],
  expr: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'IndexExpr', 'ArrayLiteralExpr'],
  value: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'IndexExpr', 'ArrayLiteralExpr'],
  left: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'IndexExpr', 'ArrayLiteralExpr'],
  right: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'IndexExpr', 'ArrayLiteralExpr'],
  callee: ['IdentifierExpr', 'CallExpr', 'MemberExpr'],
  args: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'IndexExpr', 'ArrayLiteralExpr'],
  target: ['IdentifierExpr', 'MemberExpr', 'IndexExpr'],
  iterable: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'IndexExpr', 'ArrayLiteralExpr'],
  elements: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'IndexExpr', 'ArrayLiteralExpr'],
  thenBody: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ForStmt', 'BreakStmt', 'ContinueStmt', 'ReturnStmt'],
  elseBody: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ForStmt', 'BreakStmt', 'ContinueStmt', 'ReturnStmt'],
  object: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'UnaryExpr', 'MemberExpr', 'IndexExpr', 'ArrayLiteralExpr'],
  index: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'UnaryExpr', 'MemberExpr', 'IndexExpr'],
}

// Child slots per concept kind — used for 'i' (insert child) navigation
export const CONCEPT_CHILD_SLOTS: Record<string, Record<string, string[]>> = {
  File: { declarations: ['StructDecl', 'FnDecl', 'LetDecl'] },
  StructDecl: { fields: ['FieldDecl'] },
  FnDecl: { params: ['Parameter'], body: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ForStmt', 'BreakStmt', 'ContinueStmt', 'ReturnStmt'] },
  LetDecl: { value: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'ArrayLiteralExpr'] },
  LetStmt: { value: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'ArrayLiteralExpr'] },
  ReturnStmt: { value: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'ArrayLiteralExpr'] },
  ExprStmt: { expr: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'ArrayLiteralExpr'] },
  IfStmt: {
    condition: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'ArrayLiteralExpr'],
    thenBody: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ForStmt', 'BreakStmt', 'ContinueStmt', 'ReturnStmt'],
    elseBody: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ForStmt', 'BreakStmt', 'ContinueStmt', 'ReturnStmt'],
  },
  WhileStmt: {
    condition: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'ArrayLiteralExpr'],
    body: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ForStmt', 'BreakStmt', 'ContinueStmt', 'ReturnStmt'],
  },
  ForStmt: {
    iterable: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'ArrayLiteralExpr'],
    body: ['LetStmt', 'ExprStmt', 'IfStmt', 'WhileStmt', 'ForStmt', 'BreakStmt', 'ContinueStmt', 'ReturnStmt'],
  },
  BinaryExpr: { left: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'ArrayLiteralExpr'], right: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'ArrayLiteralExpr'] },
  CallExpr: { callee: ['IdentifierExpr', 'CallExpr', 'MemberExpr'], args: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'ArrayLiteralExpr'] },
  AssignExpr: { target: ['IdentifierExpr', 'MemberExpr'], value: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'ArrayLiteralExpr'] },
  UnaryExpr: { expr: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'ArrayLiteralExpr'] },
  MemberExpr: { object: ['IdentifierExpr', 'MemberExpr', 'CallExpr', 'ArrayLiteralExpr'] },
  ArrayLiteralExpr: { elements: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'AssignExpr', 'UnaryExpr', 'MemberExpr', 'ArrayLiteralExpr'] },
  IndexExpr: {
    object: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'UnaryExpr', 'MemberExpr', 'IndexExpr', 'ArrayLiteralExpr'],
    index: ['IdentifierExpr', 'LiteralExpr', 'BinaryExpr', 'CallExpr', 'UnaryExpr', 'MemberExpr', 'IndexExpr'],
  },
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
