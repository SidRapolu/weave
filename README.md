# Weave

A structured document editor built with Electron, React, TypeScript, and SQLite. Weave introduces **ply layers** — range-anchored annotation panels that attach metadata to arbitrary text selections and surface them across parallel organizational views alongside the editor.

## The Core Idea

Most document tools treat annotations as floating comments. Weave anchors them to precise character ranges in the document using DOM range computation against `contentEditable`, storing `range_start` and `range_end` offsets in SQLite. This means every ply cell is permanently tethered to the specific text it was created from, surviving edits and document reloads.

Thread categories let you define your own organizational axes — character arcs, timeline events, compliance flags, thematic notes, anything. Opening a thread as a ply panel splits the editor view and shows all cells assigned to that thread, letting you read and edit annotations in context without leaving the document.

## Features

- **Project management** — create and organize writing projects with color-coded cards
- **Document editor** — full `contentEditable` editor with auto-save to SQLite every 800ms
- **Thread categories** — user-defined annotation categories with custom colors
- **Ply panels** — open any thread as a side panel (up to 2 simultaneously); ephemeral UI state over persistent data
- **Range-anchored cells** — select text → tooltip appears → create a ply cell anchored to that range
- **Margin indicators** — clickable thread indicators in the editor margin show which threads have cells in the current document; click to toggle the panel
- **Per-cell metadata** — title, body notes, tags, thread assignment
- **Local-first** — all data lives in SQLite on disk via Electron's userData path, no network required
