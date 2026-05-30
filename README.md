# Projed

Projed is a projectional, structure-first code editor built with SolidJS.

Instead of editing plain text, you edit an in-memory IR (AST-like model). The UI is generated from projection rules, which means syntax is a view over structure, not the source of truth.

## Highlights

- Structural editing with typed nodes, properties, children, and references.
- Projection-driven rendering (multiple syntax presets, runtime switchable).
- Projection DSL for readable projection authoring (JSON mode also available).
- Sidebar inspector with full node property editing and analysis details.
- Incremental semantic/type analysis after edits.
- Built-in runtime interpreter for executing the sample language.
- Local autosave/manual save and undo/redo support.

## Quick Start

### Requirements

- Node.js 20+
- pnpm 11+

### Install

```bash
pnpm install
```

### Run in dev mode

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

### Preview production build

```bash
pnpm preview
```

## How It Works

1. User edits nodes/cells in the UI.
2. UI emits structural edit commands.
3. IR model applies command and recomputes analysis.
4. Node renderer projects model nodes into visual cells.
5. Interpreter can execute the current IR program.

The IR is always canonical. Projections can change without reparsing source text.

## Main Folders

- `src/ir`: types, model, analysis, interpreter.
- `src/projection`: projection types, presets, registry, DSL.
- `src/editor`: concepts, constraints, navigation, editor state.
- `src/ui`: app shell, renderer, sidebar, projection editor, insert menu.
- `docs`: architecture and design docs.

## Key Concepts

### IR model

Each node has:
- `id`
- `kind`
- `props`
- `children`
- `refs`
- `analysis`

### Projection cells

Supported cell types:
- `label`
- `prop`
- `child`
- `childList`
- `block`
- `indent`
- `newline`

### Edit commands

Commands drive all mutations:
- `SET_PROP`
- `INSERT_CHILD`
- `DELETE_NODE`
- `MOVE_CHILD`
- `REPLACE_NODE`

## Keyboard Controls (default)

- Navigate: `hjkl`, arrow keys, `0`, `$`
- Edit property: `e`, `Enter`, `F2`
- Insert: `i`, `a`, `I`, `o`, `O`
- Delete: `Backspace`, `Delete`
- Clipboard: `Ctrl/Cmd + C`, `X`, `V`
- Undo/redo: `Ctrl/Cmd + Z`, `Y`

## Persistence

Program snapshots are stored in browser localStorage:
- autosave key: `projed.program.autosave.v1`
- manual save key: `projed.program.saved.v1`

## Documentation

- Architecture: `docs/ARCHITECTURE.md`
- Editor design: `docs/EDITOR-DESIGN.md`
- Projection DSL: `docs/PROJECTION-DSL.md`
- Historical design notes: `DESIGN.md`

## Extending Projed

To add a new language feature:

1. Add concept definitions and role constraints in `src/editor/concepts.ts`.
2. Add projection rules in `src/projection/registry.ts`.
3. Extend analysis/type behavior in `src/ir/model.ts`.
4. Extend interpreter execution rules in `src/ir/interpreter.ts`.

## Status

This is an experimental project focused on projectional editing architecture and language/tooling exploration.