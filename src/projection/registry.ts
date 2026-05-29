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

const STORAGE_KEY = 'projed.user-projections.v1'

function cloneProjectionMap(map: ProjectionMap): ProjectionMap {
  return JSON.parse(JSON.stringify(map)) as ProjectionMap
}

function clonePresetRecord(record: Record<string, ProjectionMap>): Record<string, ProjectionMap> {
  return Object.fromEntries(Object.entries(record).map(([name, map]) => [name, cloneProjectionMap(map)]))
}

function readStoredUserPresets(): Record<string, ProjectionMap> {
  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed as Record<string, ProjectionMap>
  } catch {
    return {}
  }
}

function persistUserPresets(value: Record<string, ProjectionMap>) {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Ignore storage failures (private mode / quota exceeded)
  }
}

const [activePresetName, setActivePresetName] = createSignal<string>('Rust')
const [userPresets, setUserPresets] = createSignal<Record<string, ProjectionMap>>(readStoredUserPresets())

export { activePresetName }

export function isBuiltinPreset(name: string): boolean {
  return name in BUILTIN_PRESETS
}

export function getPresetNames(): string[] {
  return [...Object.keys(BUILTIN_PRESETS), ...Object.keys(userPresets())]
}

export function getUserPresetNames(): string[] {
  return Object.keys(userPresets())
}

export function getPresetProjection(name: string): ProjectionMap | undefined {
  if (isBuiltinPreset(name)) return BUILTIN_PRESETS[name]
  const custom = userPresets()[name]
  return custom ? cloneProjectionMap(custom) : undefined
}

export function getProjections(): ProjectionMap {
  const active = activePresetName()
  const builtIn = BUILTIN_PRESETS[active]
  if (builtIn) return builtIn
  const custom = userPresets()[active]
  return custom ?? rustProjections
}

export function switchPreset(name: string): boolean {
  if (isBuiltinPreset(name) || userPresets()[name]) {
    setActivePresetName(name)
    return true
  }
  return false
}

export function createUserPreset(name: string, map?: ProjectionMap): { ok: true } | { ok: false; error: string } {
  if (!name.trim()) return { ok: false, error: 'Name is required.' }
  if (isBuiltinPreset(name)) return { ok: false, error: 'Built-in names are reserved.' }
  if (userPresets()[name]) return { ok: false, error: 'A projection with this name already exists.' }
  const nextMap = cloneProjectionMap(map ?? {})
  setUserPresets(prev => {
    const next = { ...prev, [name]: nextMap }
    persistUserPresets(next)
    return next
  })
  setActivePresetName(name)
  return { ok: true }
}

export function deleteUserPreset(name: string): { ok: true } | { ok: false; error: string } {
  if (isBuiltinPreset(name)) return { ok: false, error: 'Built-in projections cannot be deleted.' }
  if (!userPresets()[name]) return { ok: false, error: 'Projection not found.' }
  setUserPresets(prev => {
    const next = { ...prev }
    delete next[name]
    persistUserPresets(next)
    return next
  })
  if (activePresetName() === name) setActivePresetName('Rust')
  return { ok: true }
}

export function upsertUserPreset(name: string, map: ProjectionMap): { ok: true } | { ok: false; error: string } {
  if (!name.trim()) return { ok: false, error: 'Name is required.' }
  if (isBuiltinPreset(name)) return { ok: false, error: 'Built-in names are reserved.' }
  const nextMap = cloneProjectionMap(map)
  setUserPresets(prev => {
    const next = { ...prev, [name]: nextMap }
    persistUserPresets(next)
    return next
  })
  return { ok: true }
}

export function setProjectionMap(map: ProjectionMap): { ok: true } | { ok: false; error: string } {
  const name = activePresetName()
  if (isBuiltinPreset(name)) return { ok: false, error: 'Built-in projections are write-protected.' }
  return upsertUserPreset(name, map)
}

export function updateProjection(kind: string, cells: import('./types').CellDef[]) {
  const name = activePresetName()
  if (isBuiltinPreset(name)) return
  setUserPresets(prev => {
    const current = prev[name] ?? {}
    const next = { ...prev, [name]: { ...current, [kind]: cells } }
    persistUserPresets(next)
    return next
  })
}

export function getProjectionJson(): string {
  return JSON.stringify(getProjections(), null, 2)
}

export function loadProjectionJson(json: string): { ok: true } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(json) as ProjectionMap
    return setProjectionMap(parsed)
  } catch (e) {
    return { ok: false, error: String(e) }
  }
}

export function exportUserPresets(names: string[]): Record<string, ProjectionMap> {
  const all = userPresets()
  const selected = names.length === 0 ? Object.keys(all) : names
  const result: Record<string, ProjectionMap> = {}
  for (const name of selected) {
    if (all[name]) result[name] = cloneProjectionMap(all[name])
  }
  return result
}

export function getUserPresetsSnapshot(): Record<string, ProjectionMap> {
  return clonePresetRecord(userPresets())
}

export function restoreUserPresetsSnapshot(snapshot: Record<string, ProjectionMap>, nextActive: string) {
  const cloned = clonePresetRecord(snapshot)
  setUserPresets(() => {
    persistUserPresets(cloned)
    return cloned
  })
  if (isBuiltinPreset(nextActive) || cloned[nextActive]) setActivePresetName(nextActive)
  else setActivePresetName('Rust')
}

export function resetActivePreset() {
  const name = activePresetName()
  if (isBuiltinPreset(name)) return
  setUserPresets(prev => {
    const next = { ...prev, [name]: {} }
    persistUserPresets(next)
    return next
  })
}
