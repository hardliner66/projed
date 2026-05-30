# Projection DSL

## Why DSL exists
The DSL provides a compact, readable format for projection definitions so users do not need to author verbose JSON by hand.

## Basic shape

A definition maps a node kind to one or more cells.

Single-line form:

`Kind: atom atom atom`

Multi-line form:

`Kind:`
`  atom atom`
`  indent roleName`
`  roleName`

## Atoms

- `kw"text"` keyword-styled label
- `"text"` punctuation/default-styled label
- `@propName` editable property binding
- `>childName` single child slot
- `list...` inline child list
- `list...("sep")` inline child list with separator

## Escaping

Use `\"` inside quoted strings.

## Comments and blanks

- `#` starts a comment.
- Blank lines are ignored.

## Conversion behavior

- DSL parses to `ProjectionMap`.
- `serializeDsl()` emits DSL from `ProjectionMap` when representable.
- Complex unsupported structures are skipped with comments in serialized output.

## Example

`FnDecl:`
`  kw"fn " @name "(" params...(", ") ")" ": " @returnType " {"`
`  indent body`
`  "}"`
