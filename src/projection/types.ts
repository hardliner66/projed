export type CellDef =
  | { type: 'label'; text: string; style?: 'keyword' | 'punct' | 'comment' }
  | { type: 'prop'; name: string; multiline?: boolean }
  | { type: 'child'; name: string }
  | { type: 'childList'; name: string; separator?: CellDef; indent?: boolean; inline?: boolean }
  | { type: 'block'; direction?: 'row' | 'col'; children: CellDef[] }
  | { type: 'indent'; children: CellDef[] }
  | { type: 'newline' }

export type ProjectionMap = Record<string, CellDef[]>
