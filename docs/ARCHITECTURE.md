# Architecture

## Goal
Projed is a structural editor: programs are edited as an AST-like IR, then projected into a UI view. The IR is the source of truth, not text.

## High-level flow

1. User interacts with UI cells.
2. UI emits structural edit commands.
3. IR model applies commands and recomputes analysis.
4. Projection rules map IR nodes into rendered cells.
5. Interpreter executes IR directly.

## Core modules

### `src/ir`
- `types.ts`: node, model, analysis and edit command types.
- `model.ts`: mutable model with undo/redo, command application, and semantic/type analysis.
- `interpreter.ts`: evaluates IR runtime semantics for the demo language.

### `src/projection`
- `types.ts`: projection cell definitions.
- `registry.ts`: built-in presets and active projection management.
- `dsl.ts`: parser/serializer for projection DSL.

### `src/editor`
- `concepts.ts`: concept catalog, default node shapes, role constraints.
- `navigation.ts`: parent lookup and traversal ordering.
- `state.ts`: UI selection/editing signals.

### `src/ui`
- `App.tsx`: orchestration, keyboard commands, storage, run/save/load.
- `NodeRenderer.tsx`: projection-driven recursive renderer.
- `Sidebar.tsx`: selected node inspector and direct property editing.
- `ProjectionEditor.tsx`: projection preset manager + JSON/DSL editor.
- `InsertMenu.tsx`: constrained insertion chooser.

## Data model

Each node has:
- `id`: stable identity.
- `kind`: concept type.
- `props`: scalar properties.
- `children`: role to ordered child-node IDs.
- `refs`: role to referenced node IDs.
- `analysis`: inferred and expected type/diagnostic metadata.

The model stores a flat node table (`nodes`) and a `rootId`.

## Editing model

All edits are command-based:
- `SET_PROP`
- `INSERT_CHILD`
- `DELETE_NODE`
- `MOVE_CHILD`
- `REPLACE_NODE`

This keeps edits explicit and undoable.

## Projection model

A projection maps node kinds to cell trees. Cells include:
- label
- prop
- child
- childList
- block
- indent
- newline

Rendering is recursive and compositional: a node resolves its projection, then each cell expands into text, editable fields, or child node renderers.

## Constraints and insertion

Valid insertions are constrained by:
- role-to-kind allowlists (`ROLE_ALLOWED_KINDS`)
- expected-type analysis (`getExpectedChildType`)

`InsertMenu` filters candidates with both constraints.

## Persistence

- Autosave key: `projed.program.autosave.v1`
- Manual save key: `projed.program.saved.v1`

Both are stored in browser `localStorage`.

## Runtime execution

Interpreter behavior:
- collects global function declarations
- evaluates declarations/statements/expressions
- supports control flow (`if`, `while`, `for`, `break`, `continue`, `return`)
- provides built-ins (`print`, `range`)

Output is collected and shown in the output panel.
