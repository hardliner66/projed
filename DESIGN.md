# Projectional Editor Architecture and Design Document

## Overview

This project is a fully structural, projectional editor inspired by systems such as JetBrains MPS, Lisp images, Smalltalk environments, and projectional editing systems.

The editor does **not** store source code as text.

Instead:

* Programs are stored as a structured internal representation (IR / AST)
* The displayed syntax is generated dynamically from projection mappings
* Users can define or modify the displayed syntax at runtime
* Multiple syntaxes can exist simultaneously for the same internal structure
* Editing directly manipulates the structure, not text parsing

The system should support:

* Dynamic syntax definitions
* User-defined projections
* Structural editing
* Live updates
* Runtime-loaded mappings
* Custom UI elements
* Multiple views of the same data
* Rich metadata and debugging support

The editor should eventually support language creation, experimentation, live coding, and potentially visual or hybrid textual/graphical languages.

---

# Core Philosophy

The system separates:

```text
Internal Representation (IR)
        ↓
Projection Rules
        ↓
UI Elements / Cells
        ↓
User Interaction
        ↓
Structural Edit Commands
        ↓
Internal Representation
```

The projection layer is responsible only for visualization and interaction.

The IR remains canonical.

The editor should never depend on reparsing text to reconstruct program structure.

---

# Main Goals

## 1. Fully Structural Editing

Programs are stored as structured nodes.

Example:

```json
{
  "kind": "StructDecl",
  "props": {
    "name": "Person"
  },
  "children": {
    "fields": [...]
  }
}
```

No raw source text is required.

---

## 2. User-Definable Syntax

Users must be able to redefine how structures are displayed.

Example:

### C-like projection

```text
struct Person {
    name: String;
}
```

### Alternative syntax

```text
type Person =
    name :: String
```

### Lisp-like syntax

```text
(struct Person
    (field name String))
```

All three represent the same IR.

---

## 3. Dynamic Projection Loading

Projection mappings must be:

* Loadable at runtime
* Replaceable at runtime
* Editable without recompilation
* Potentially scriptable

The UI should immediately update when mappings change.

---

## 4. Multiple Projections

The same node may have multiple projections simultaneously.

Examples:

* Source-like view
* Tree view
* Form/property editor
* Graphical visualization
* Debugging visualization
* Compact/minified view

---

## 5. Sidebar Inspector

The currently selected node must always be inspectable.

Even if properties are not projected into the main editor surface, they must remain accessible.

The sidebar should show:

* Node ID
* Node kind
* Properties
* Child relationships
* References
* Metadata
* Validation errors
* Type information
* Debug information

This guarantees the structure is always editable even if projections are incomplete.

---

# Internal Representation (IR)

The IR is the canonical source of truth.

Suggested structure:

```rust
Node {
    id: NodeId,
    kind: ConceptId,
    properties: Map<PropertyId, Value>,
    children: Map<RoleId, Vec<NodeId>>,
    references: Map<RoleId, NodeRef>,
}
```

---

# Concepts

Each node belongs to a concept/type.

Examples:

* File
* StructDecl
* FunctionDecl
* Parameter
* Expression
* IfExpr
* BinaryExpr
* CallExpr

Concepts define:

* Allowed properties
* Allowed children
* Allowed references
* Validation rules

---

# Projection System

The projection system maps nodes into UI cells.

Example:

```json
[
  { "type": "label", "text": "struct " },
  { "type": "prop", "name": "name" },
  { "type": "label", "text": " {" },
  { "type": "childList", "name": "fields" },
  { "type": "label", "text": "}" }
]
```

---

# Projection Cell Types

Initial cell types:

## Label Cell

Static text.

```json
{
  "type": "label",
  "text": "struct"
}
```

---

## Property Cell

Editable property binding.

```json
{
  "type": "prop",
  "name": "name"
}
```

---

## Child Cell

Displays a single child node.

```json
{
  "type": "child",
  "name": "body"
}
```

---

## Child List Cell

Displays multiple child nodes.

```json
{
  "type": "childList",
  "name": "fields"
}
```

May include separators.

---

## Block Cell

Container/layout cell.

```json
{
  "type": "block",
  "children": [...]
}
```

---

## Future Cell Types

Potential future cells:

* Table
* Grid
* Foldable section
* Syntax-highlighted text
* Inline widget
* Graph node
* Canvas view
* Icon
* Image
* Rich text
* Tree
* Tabs
* Visual graph edges

---

# Editing Model

Editing manipulates the IR directly.

There is no parser-based reconstruction.

Examples:

* Insert node
* Delete node
* Replace node
* Wrap node
* Move node
* Reorder children
* Set property
* Create reference

---

# Cursor Model

The cursor should not be text-based internally.

Suggested model:

```rust
Cursor {
    node: NodeId,
    cell_path: Vec<CellIndex>,
    offset: usize,
}
```

The cursor references structural positions.

---

# Structural Selections

Selections should support:

* Property ranges
* Entire nodes
* Child lists
* Multiple nodes
* Structural copy/paste

---

# Projection Fallbacks

If a node has no projection mapping:

* A generic fallback renderer should appear
* The node should still remain editable

Example fallback:

```text
<StructDecl name="Person">
```

This prevents broken mappings from making data inaccessible.

---

# Validation

Validation operates on the IR.

Validation should support:

* Missing required properties
* Invalid references
* Invalid child counts
* Type mismatches
* Language-specific constraints

Validation results should appear:

* Inline
* In the sidebar
* In diagnostics panels

---

# Undo / Redo

Undo/redo must operate structurally.

Commands should be transaction-based.

Example:

```text
InsertFieldCommand
RenameNodeCommand
DeleteNodeCommand
```

---

# Persistence

Programs should be stored structurally.

Possible formats:

* JSON
* RON
* Binary
* SQLite
* Custom format

Source text should be exportable but not canonical.

---

# Runtime Architecture

Suggested architecture:

```text
Frontend UI
    ↓
Projection Engine
    ↓
Editor State
    ↓
IR / Model
```

---

# Technology Stack

## Recommended Frontend

SolidJS is currently preferred.

Reasons:

* Fine-grained reactivity
* Efficient DOM updates
* Good fit for structural editors
* Lightweight
* JSX flexibility

---

## Recommended Core

Rust is preferred for:

* IR model
* Validation
* Serialization
* Structural commands
* Undo/redo
* Future WASM integration

---

# Initial Prototype Scope

The first prototype should support:

## Node Types

* File
* StructDecl
* FieldDecl
* FnDecl

---

## Features

* Editable projections
* Dynamic projection reloading
* Sidebar inspector
* Property editing
* Child rendering
* Selection
* Fallback projections

---

## Non-Goals Initially

Avoid initially implementing:

* Parsing
* Type systems
* Collaboration
* Incremental compilation
* Complex layout engine
* Canvas rendering
* Rich text editing
* Plugin sandboxing

---

# Long-Term Vision

Long-term, the editor may evolve into:

* A language workbench
* A projectional IDE
* A live programming environment
* A visual/textual hybrid editor
* A Smalltalk-like image system
* A moddable development platform
* A runtime-editable programming environment

---

# Important Design Principles

## 1. IR Is Canonical

Never treat rendered text as the source of truth.

---

## 2. Projections Are Replaceable

UI syntax is only a view.

---

## 3. Editing Is Structural

All edits manipulate nodes.

---

## 4. Everything Must Remain Accessible

Fallback rendering and sidebar inspection are mandatory.

---

## 5. Runtime Modifiability

Mappings should update live without recompilation.

---

# Example Projection Mapping

```json
{
  "StructDecl": [
    { "type": "label", "text": "struct " },
    { "type": "prop", "name": "name" },
    { "type": "label", "text": " {" },
    {
      "type": "childList",
      "name": "fields"
    },
    { "type": "label", "text": "}" }
  ]
}
```

---

# Example AST

```json
{
  "kind": "StructDecl",
  "props": {
    "name": "Person"
  },
  "children": {
    "fields": [
      {
        "kind": "FieldDecl",
        "props": {
          "name": "name",
          "type": "String"
        }
      }
    ]
  }
}
```

---

# Future Extensions

Potential future additions:

* Projection scripting
* Custom widgets
* Visual graphs
* Embedded editors
* Live evaluation
* Actor-based runtime
* Time-travel debugging
* Multiplayer collaboration
* Structural diffs
* Semantic transformations
* User-defined languages
* Projection inheritance
* Theme system
* Animation
* Incremental layout engine

---

# Summary

This project is a structural, runtime-configurable projectional editor where:

* The IR is canonical
* Syntax is user-defined
* Rendering is projection-based
* Editing is structural
* Multiple projections are possible
* All structure remains inspectable
* Mappings are dynamically reloadable

The goal is to create a flexible foundation for programmable editing systems and experimental language environments.
