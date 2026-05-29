import { createSignal } from 'solid-js'
import type { ProjectionMap } from './types'

// ── Rust ────────────────────────────────────────────────────────────────────
const rustProjections: ProjectionMap = {
  File: [
    { type: 'childList', name: 'declarations', indent: false },
  ],
  LetDecl: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'label', text: 'let ', style: 'keyword' },
        { type: 'prop', name: 'name' },
        { type: 'label', text: ': ', style: 'punct' },
        { type: 'prop', name: 'type' },
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
            { type: 'label', text: ': ', style: 'punct' },
            { type: 'prop', name: 'returnType' },
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
        { type: 'label', text: ': ', style: 'punct' },
        { type: 'prop', name: 'type' },
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
  ForStmt: [
    {
      type: 'block', direction: 'col', children: [
        {
          type: 'block', direction: 'row', children: [
            { type: 'label', text: 'for ', style: 'keyword' },
            { type: 'prop', name: 'item' },
            { type: 'label', text: ' in ', style: 'keyword' },
            { type: 'child', name: 'iterable' },
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
  BreakStmt: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'label', text: 'break', style: 'keyword' },
        { type: 'label', text: ';', style: 'punct' },
      ]
    },
  ],
  ContinueStmt: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'label', text: 'continue', style: 'keyword' },
        { type: 'label', text: ';', style: 'punct' },
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
  UnaryExpr: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'prop', name: 'op' },
        { type: 'child', name: 'expr' },
      ]
    },
  ],
  MemberExpr: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'child', name: 'object' },
        { type: 'label', text: '.', style: 'punct' },
        { type: 'prop', name: 'member' },
      ]
    },
  ],
  ArrayLiteralExpr: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'label', text: '[', style: 'punct' },
        { type: 'childList', name: 'elements', inline: true, separator: { type: 'label', text: ', ', style: 'punct' } },
        { type: 'label', text: ']', style: 'punct' },
      ]
    },
  ],
}

// ── Python ───────────────────────────────────────────────────────────────────
const pythonProjections: ProjectionMap = {
  File: [
    { type: 'childList', name: 'declarations', indent: false },
  ],
  LetDecl: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'prop', name: 'name' },
        { type: 'label', text: ': ', style: 'punct' },
        { type: 'prop', name: 'type' },
        { type: 'label', text: ' = ', style: 'punct' },
        { type: 'child', name: 'value' },
      ]
    },
  ],
  StructDecl: [
    {
      type: 'block', direction: 'col', children: [
        {
          type: 'block', direction: 'row', children: [
            { type: 'label', text: 'class ', style: 'keyword' },
            { type: 'prop', name: 'name' },
            { type: 'label', text: ':', style: 'punct' },
          ]
        },
        {
          type: 'indent', children: [
            { type: 'childList', name: 'fields', indent: true },
          ]
        },
      ]
    },
  ],
  FieldDecl: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'prop', name: 'name' },
        { type: 'label', text: ': ', style: 'punct' },
        { type: 'prop', name: 'type' },
      ]
    },
  ],
  FnDecl: [
    {
      type: 'block', direction: 'col', children: [
        {
          type: 'block', direction: 'row', children: [
            { type: 'label', text: 'def ', style: 'keyword' },
            { type: 'prop', name: 'name' },
            { type: 'label', text: '(', style: 'punct' },
            { type: 'childList', name: 'params', inline: true, separator: { type: 'label', text: ', ', style: 'punct' } },
            { type: 'label', text: ')', style: 'punct' },
            { type: 'label', text: ' -> ', style: 'punct' },
            { type: 'prop', name: 'returnType' },
            { type: 'label', text: ':', style: 'punct' },
          ]
        },
        {
          type: 'indent', children: [
            { type: 'childList', name: 'body', indent: true },
          ]
        },
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
        { type: 'prop', name: 'name' },
        { type: 'label', text: ': ', style: 'punct' },
        { type: 'prop', name: 'type' },
        { type: 'label', text: ' = ', style: 'punct' },
        { type: 'child', name: 'value' },
      ]
    },
  ],
  ReturnStmt: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'label', text: 'return ', style: 'keyword' },
        { type: 'child', name: 'value' },
      ]
    },
  ],
  ExprStmt: [
    { type: 'child', name: 'expr' },
  ],
  IfStmt: [
    {
      type: 'block', direction: 'col', children: [
        {
          type: 'block', direction: 'row', children: [
            { type: 'label', text: 'if ', style: 'keyword' },
            { type: 'child', name: 'condition' },
            { type: 'label', text: ':', style: 'punct' },
          ]
        },
        {
          type: 'indent', children: [
            { type: 'childList', name: 'thenBody', indent: true },
          ]
        },
        { type: 'label', text: 'else:', style: 'keyword' },
        {
          type: 'indent', children: [
            { type: 'childList', name: 'elseBody', indent: true },
          ]
        },
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
            { type: 'label', text: ':', style: 'punct' },
          ]
        },
        {
          type: 'indent', children: [
            { type: 'childList', name: 'body', indent: true },
          ]
        },
      ]
    },
  ],
  ForStmt: [
    {
      type: 'block', direction: 'col', children: [
        {
          type: 'block', direction: 'row', children: [
            { type: 'label', text: 'for ', style: 'keyword' },
            { type: 'prop', name: 'item' },
            { type: 'label', text: ' in ', style: 'keyword' },
            { type: 'child', name: 'iterable' },
            { type: 'label', text: ':', style: 'punct' },
          ]
        },
        {
          type: 'indent', children: [
            { type: 'childList', name: 'body', indent: true },
          ]
        },
      ]
    },
  ],
  BreakStmt: [
    { type: 'label', text: 'break', style: 'keyword' },
  ],
  ContinueStmt: [
    { type: 'label', text: 'continue', style: 'keyword' },
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
  UnaryExpr: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'prop', name: 'op' },
        { type: 'child', name: 'expr' },
      ]
    },
  ],
  MemberExpr: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'child', name: 'object' },
        { type: 'label', text: '.', style: 'punct' },
        { type: 'prop', name: 'member' },
      ]
    },
  ],
  ArrayLiteralExpr: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'label', text: '[', style: 'punct' },
        { type: 'childList', name: 'elements', inline: true, separator: { type: 'label', text: ', ', style: 'punct' } },
        { type: 'label', text: ']', style: 'punct' },
      ]
    },
  ],
}

// ── C / C++ ──────────────────────────────────────────────────────────────────
const cProjections: ProjectionMap = {
  File: [
    { type: 'childList', name: 'declarations', indent: false },
  ],
  LetDecl: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'prop', name: 'type' },
        { type: 'label', text: ' ', style: 'punct' },
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
        { type: 'label', text: '};', style: 'punct' },
      ]
    },
  ],
  FieldDecl: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'prop', name: 'type' },
        { type: 'label', text: ' ', style: 'punct' },
        { type: 'prop', name: 'name' },
        { type: 'label', text: ';', style: 'punct' },
      ]
    },
  ],
  FnDecl: [
    {
      type: 'block', direction: 'col', children: [
        {
          type: 'block', direction: 'row', children: [
            { type: 'prop', name: 'returnType' },
            { type: 'label', text: ' ', style: 'punct' },
            { type: 'prop', name: 'name' },
            { type: 'label', text: '(', style: 'punct' },
            { type: 'childList', name: 'params', inline: true, separator: { type: 'label', text: ', ', style: 'punct' } },
            { type: 'label', text: ') {', style: 'punct' },
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
        { type: 'prop', name: 'type' },
        { type: 'label', text: ' ', style: 'punct' },
        { type: 'prop', name: 'name' },
      ]
    },
  ],
  LetStmt: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'prop', name: 'type' },
        { type: 'label', text: ' ', style: 'punct' },
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
            { type: 'label', text: 'if (', style: 'keyword' },
            { type: 'child', name: 'condition' },
            { type: 'label', text: ') {', style: 'punct' },
          ]
        },
        {
          type: 'indent', children: [
            { type: 'childList', name: 'thenBody', indent: true },
          ]
        },
        { type: 'label', text: '} else {', style: 'punct' },
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
            { type: 'label', text: 'while (', style: 'keyword' },
            { type: 'child', name: 'condition' },
            { type: 'label', text: ') {', style: 'punct' },
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
  ForStmt: [
    {
      type: 'block', direction: 'col', children: [
        {
          type: 'block', direction: 'row', children: [
            { type: 'label', text: 'for (auto ', style: 'keyword' },
            { type: 'prop', name: 'item' },
            { type: 'label', text: ' : ', style: 'punct' },
            { type: 'child', name: 'iterable' },
            { type: 'label', text: ') {', style: 'punct' },
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
  BreakStmt: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'label', text: 'break', style: 'keyword' },
        { type: 'label', text: ';', style: 'punct' },
      ]
    },
  ],
  ContinueStmt: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'label', text: 'continue', style: 'keyword' },
        { type: 'label', text: ';', style: 'punct' },
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
  UnaryExpr: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'prop', name: 'op' },
        { type: 'child', name: 'expr' },
      ]
    },
  ],
  MemberExpr: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'child', name: 'object' },
        { type: 'label', text: '.', style: 'punct' },
        { type: 'prop', name: 'member' },
      ]
    },
  ],
  ArrayLiteralExpr: [
    {
      type: 'block', direction: 'row', children: [
        { type: 'label', text: '{', style: 'punct' },
        { type: 'childList', name: 'elements', inline: true, separator: { type: 'label', text: ', ', style: 'punct' } },
        { type: 'label', text: '}', style: 'punct' },
      ]
    },
  ],
}

// ── Preset registry ──────────────────────────────────────────────────────────
const BUILTIN_PRESETS: Record<string, ProjectionMap> = {
  'Rust': rustProjections,
  'Python': pythonProjections,
  'C / C++': cProjections,
}

export const PRESET_NAMES = Object.keys(BUILTIN_PRESETS)

const [activePresetName, setActivePresetName] = createSignal<string>('Rust')
const [presetMaps, setPresetMaps] = createSignal<Record<string, ProjectionMap>>({ ...BUILTIN_PRESETS })

export { activePresetName }

export function getProjections(): ProjectionMap {
  return presetMaps()[activePresetName()] ?? rustProjections
}

export function switchPreset(name: string) {
  if (name in BUILTIN_PRESETS) setActivePresetName(name)
}

export function setProjectionMap(map: ProjectionMap) {
  setPresetMaps(prev => ({ ...prev, [activePresetName()]: map }))
}

export function updateProjection(kind: string, cells: import('./types').CellDef[]) {
  const name = activePresetName()
  setPresetMaps(prev => ({ ...prev, [name]: { ...prev[name], [kind]: cells } }))
}

export function getProjectionJson(): string {
  return JSON.stringify(getProjections(), null, 2)
}

export function loadProjectionJson(json: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(json)
    setProjectionMap(parsed)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

export function resetActivePreset() {
  const name = activePresetName()
  const builtin = BUILTIN_PRESETS[name]
  if (builtin) setPresetMaps(prev => ({ ...prev, [name]: builtin }))
}
