# Editor Design

## Product intent
Projed is designed for language experimentation with immediate visual feedback:
- Edit structure directly.
- Change surface syntax live.
- Keep semantic analysis visible while editing.

## Interaction design

### Selection and navigation
- Node selection is primary.
- Keyboard navigation follows tree order with Vim-style and arrow key support.
- Placeholder slots represent valid but empty child positions.

### Structural editing
- Insert commands are role-aware and type-aware.
- Editing a property is direct (`PropCell`) and updates IR immediately.
- Deletes and inserts preserve structural integrity by role constraints.

### Inspector-first debugging
The sidebar intentionally remains projection-independent:
- always shows full property table for selected node
- shows inferred/expected/declared types
- shows diagnostics emitted by analysis
- provides relationship visibility (`children`, `refs`)

This guarantees the underlying model remains editable even if a projection omits data.

## Projection editing UX

`ProjectionEditor` has two synchronized modes:
- JSON: raw projection map editing
- DSL: concise projection syntax for daily use

Both support:
- parse validation
- live preview
- save with confirmation semantics
- local preset management (create/clone/delete/import/export)

## Keyboard model

Core key families:
- navigation: `hjkl`, arrows, `0`, `$`
- edit: `e`, `Enter`, `F2`
- insert: `i`, `a`, `I`, `o`, `O`
- delete: `Backspace`, `Delete`
- clipboard/undo: `Ctrl/Cmd + C/X/V/Z/Y`

The model avoids keyboard actions when an input field is focused.

## Safety and recoverability

- Undo/redo in IR edits.
- Separate undo/redo stacks in projection editors.
- Autosave snapshots to avoid data loss.
- Manual save/load for explicit user checkpoints.

## Extension points

- Add new language concepts in `src/editor/concepts.ts`.
- Add projection rules in `src/projection/registry.ts`.
- Extend type rules in `src/ir/model.ts`.
- Extend runtime semantics in `src/ir/interpreter.ts`.
