import { createSignal } from 'solid-js'
import type { ProjectionMap } from './types'

const defaultProjections: ProjectionMap = {
  File: [
    { type: 'childList', name: 'declarations', indent: false },
  ],
  StructDecl: [
    { type: 'block', direction: 'col', children: [
      { type: 'block', direction: 'row', children: [
        { type: 'label', text: 'struct ', style: 'keyword' },
        { type: 'prop', name: 'name' },
        { type: 'label', text: ' {', style: 'punct' },
      ]},
      { type: 'indent', children: [
        { type: 'childList', name: 'fields', indent: true },
      ]},
      { type: 'label', text: '}', style: 'punct' },
    ]},
  ],
  FieldDecl: [
    { type: 'block', direction: 'row', children: [
      { type: 'prop', name: 'name' },
      { type: 'label', text: ': ', style: 'punct' },
      { type: 'prop', name: 'type' },
      { type: 'label', text: ';', style: 'punct' },
    ]},
  ],
  FnDecl: [
    { type: 'block', direction: 'col', children: [
      { type: 'block', direction: 'row', children: [
        { type: 'label', text: 'fn ', style: 'keyword' },
        { type: 'prop', name: 'name' },
        { type: 'label', text: '(', style: 'punct' },
        { type: 'childList', name: 'params' },
        { type: 'label', text: ')', style: 'punct' },
        { type: 'label', text: ' {', style: 'punct' },
      ]},
      { type: 'indent', children: [
        { type: 'childList', name: 'body', indent: true },
      ]},
      { type: 'label', text: '}', style: 'punct' },
    ]},
  ],
  Parameter: [
    { type: 'block', direction: 'row', children: [
      { type: 'prop', name: 'name' },
      { type: 'label', text: ': ', style: 'punct' },
      { type: 'prop', name: 'type' },
    ]},
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
