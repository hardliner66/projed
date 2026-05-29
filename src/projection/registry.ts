import { createSignal } from 'solid-js'
import type { ProjectionMap } from './types'

const defaultProjections: ProjectionMap = {
  File: [
    { type: 'childList', name: 'declarations', indent: false },
  ],
  LetDecl: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'label', text: 'let ', style: 'keyword' },
        { type: 'prop', name: 'name' },
        { type: 'label', text: ' = ', style: 'punct' },
        { type: 'child', name: 'value' },
        { type: 'label', text: ';', style: 'punct' },
      ]
    },
  ],
  StructDecl: [
    {
      type: 'block', direction: 'col', children: [
        {
          type: 'block', direction: 'row', children: [
            { type: 'label', text: 'struct ', style: 'keyword' },
            { type: 'prop', name: 'name' },
            { type: 'label', text: ' {', style: 'punct' },
          ]
        },
        {
          type: 'indent', children: [
            { type: 'childList', name: 'fields', indent: true },
          ]
        },
        { type: 'label', text: '}', style: 'punct' },
      ]
    },
  ],
  FieldDecl: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'prop', name: 'name' },
        { type: 'label', text: ': ', style: 'punct' },
        { type: 'prop', name: 'type' },
        { type: 'label', text: ';', style: 'punct' },
      ]
    },
  ],
  FnDecl: [
    {
      type: 'block', direction: 'col', children: [
        {
          type: 'block', direction: 'row', children: [
            { type: 'label', text: 'fn ', style: 'keyword' },
            { type: 'prop', name: 'name' },
            { type: 'label', text: '(', style: 'punct' },
            { type: 'childList', name: 'params', inline: true, separator: { type: 'label', text: ', ', style: 'punct' } },
            { type: 'label', text: ')', style: 'punct' },
            { type: 'label', text: ' {', style: 'punct' },
          ]
        },
        {
          type: 'indent', children: [
            { type: 'childList', name: 'body', indent: true },
          ]
        },
        { type: 'label', text: '}', style: 'punct' },
      ]
    },
  ],
  Parameter: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'prop', name: 'name' },
        { type: 'label', text: ': ', style: 'punct' },
        { type: 'prop', name: 'type' },
      ]
    },
  ],
  LetStmt: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'label', text: 'let ', style: 'keyword' },
        { type: 'prop', name: 'name' },
        { type: 'label', text: ' = ', style: 'punct' },
        { type: 'child', name: 'value' },
        { type: 'label', text: ';', style: 'punct' },
      ]
    },
  ],
  ReturnStmt: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'label', text: 'return ', style: 'keyword' },
        { type: 'child', name: 'value' },
        { type: 'label', text: ';', style: 'punct' },
      ]
    },
  ],
  ExprStmt: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'child', name: 'expr' },
        { type: 'label', text: ';', style: 'punct' },
      ]
    },
  ],
  IfStmt: [
    {
      type: 'block', direction: 'col', children: [
        {
          type: 'block', direction: 'row', children: [
            { type: 'label', text: 'if ', style: 'keyword' },
            { type: 'child', name: 'condition' },
            { type: 'label', text: ' {', style: 'punct' },
          ]
        },
        {
          type: 'indent', children: [
            { type: 'childList', name: 'thenBody', indent: true },
          ]
        },
        { type: 'label', text: '}', style: 'punct' },
        {
          type: 'block', direction: 'row', children: [
            { type: 'label', text: 'else {', style: 'keyword' },
          ]
        },
        {
          type: 'indent', children: [
            { type: 'childList', name: 'elseBody', indent: true },
          ]
        },
        { type: 'label', text: '}', style: 'punct' },
      ]
    },
  ],
  WhileStmt: [
    {
      type: 'block', direction: 'col', children: [
        {
          type: 'block', direction: 'row', children: [
            { type: 'label', text: 'while ', style: 'keyword' },
            { type: 'child', name: 'condition' },
            { type: 'label', text: ' {', style: 'punct' },
          ]
        },
        {
          type: 'indent', children: [
            { type: 'childList', name: 'body', indent: true },
          ]
        },
        { type: 'label', text: '}', style: 'punct' },
      ]
    },
  ],
  IdentifierExpr: [
    { type: 'prop', name: 'name' },
  ],
  LiteralExpr: [
    { type: 'prop', name: 'value' },
  ],
  BinaryExpr: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'label', text: '(', style: 'punct' },
        { type: 'child', name: 'left' },
        { type: 'label', text: ' ', style: 'punct' },
        { type: 'prop', name: 'op' },
        { type: 'label', text: ' ', style: 'punct' },
        { type: 'child', name: 'right' },
        { type: 'label', text: ')', style: 'punct' },
      ]
    },
  ],
  CallExpr: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'child', name: 'callee' },
        { type: 'label', text: '(', style: 'punct' },
        { type: 'childList', name: 'args', inline: true, separator: { type: 'label', text: ', ', style: 'punct' } },
        { type: 'label', text: ')', style: 'punct' },
      ]
    },
  ],
  AssignExpr: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'child', name: 'target' },
        { type: 'label', text: ' = ', style: 'punct' },
        { type: 'child', name: 'value' },
      ]
    },
  ],
}

const [projections, setProjections] = createSignal<ProjectionMap>(defaultProjections)

export function getProjections() { return projections() }
export function setProjectionMap(map: ProjectionMap) { setProjections(map) }
export function updateProjection(kind: string, cells: import('./types').CellDef[]) {
  setProjections(prev => ({ ...prev, [kind]: cells }))
}
export function getProjectionJson(): string {
  return JSON.stringify(projections(), null, 2)
}
export function loadProjectionJson(json: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(json)
    setProjections(parsed)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}
