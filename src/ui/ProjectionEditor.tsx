import { Component, For, createMemo, createSignal, Show } from 'solid-js'
import type { IrModel } from '../ir/types'
import type { ProjectionMap } from '../projection/types'
import NodeRenderer from './NodeRenderer'
import {
  activePresetName,
  createUserPreset,
  deleteUserPreset,
  exportUserPresets,
  getPresetNames,
  getPresetProjection,
  getProjectionJson,
  getUserPresetNames,
  getUserPresetsSnapshot,
  isBuiltinPreset,
  loadProjectionJson,
  restoreUserPresetsSnapshot,
  switchPreset,
  upsertUserPreset,
} from '../projection/registry'
import { parseDsl, serializeDsl, DSL_REFERENCE } from '../projection/dsl'

interface Props {
  model: IrModel
}

interface ManagerSnapshot {
  active: string
  userPresets: Record<string, ProjectionMap>
}

function parseProjectionMaps(raw: string): Record<string, ProjectionMap> {
  const parsed = JSON.parse(raw)
  if (parsed && typeof parsed === 'object' && 'projections' in parsed && parsed.projections && typeof parsed.projections === 'object') {
    return parsed.projections as Record<string, ProjectionMap>
  }
  return parsed as Record<string, ProjectionMap>
}

function triggerDownload(content: string, filename: string) {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  // Give the browser time to start reading the blob before revoking it.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

let canUseNativeSavePicker = true

const ProjectionEditor: Component<Props> = (props) => {
  const [open, setOpen] = createSignal(false)
  const [editorMode, setEditorMode] = createSignal<'dsl' | 'json'>('dsl')
  const [addOpen, setAddOpen] = createSignal(false)
  const [addMode, setAddMode] = createSignal<'empty' | 'clone'>('clone')
  const [addName, setAddName] = createSignal('')
  const [addSourceName, setAddSourceName] = createSignal('Rust')
  const [addError, setAddError] = createSignal('')
  const [exportOpen, setExportOpen] = createSignal(false)
  const [exportSelected, setExportSelected] = createSignal<string[]>([])
  const [exportError, setExportError] = createSignal('')
  // JSON mode state
  const [text, setText] = createSignal('')
  const [baselineText, setBaselineText] = createSignal('')
  const [error, setError] = createSignal('')
  const [previewMap, setPreviewMap] = createSignal<ProjectionMap | null>(null)
  const [editorUndo, setEditorUndo] = createSignal<string[]>([])
  const [editorRedo, setEditorRedo] = createSignal<string[]>([])
  // DSL mode state
  const [dslText, setDslText] = createSignal('')
  const [dslBaselineText, setDslBaselineText] = createSignal('')
  const [dslError, setDslError] = createSignal('')
  const [dslPreviewMap, setDslPreviewMap] = createSignal<ProjectionMap | null>(null)
  const [dslUndo, setDslUndo] = createSignal<string[]>([])
  const [dslRedo, setDslRedo] = createSignal<string[]>([])
  // Manager undo/redo
  const [managerUndo, setManagerUndo] = createSignal<ManagerSnapshot[]>([])
  const [managerRedo, setManagerRedo] = createSignal<ManagerSnapshot[]>([])
  let importInputRef: HTMLInputElement | undefined

  const canEditActive = createMemo(() => !isBuiltinPreset(activePresetName()))
  const hasUnsavedChanges = createMemo(() =>
    editorMode() === 'dsl'
      ? dslText() !== dslBaselineText()
      : text() !== baselineText()
  )
  const effectivePreviewMap = createMemo(() =>
    editorMode() === 'dsl' ? dslPreviewMap() : previewMap()
  )

  function currentSnapshot(): ManagerSnapshot {
    return {
      active: activePresetName(),
      userPresets: getUserPresetsSnapshot(),
    }
  }

  function pushManagerHistory() {
    setManagerUndo(prev => [...prev, currentSnapshot()])
    setManagerRedo([])
  }

  function undoManager() {
    const stack = managerUndo()
    if (stack.length === 0) return
    const prev = stack[stack.length - 1]
    const now = currentSnapshot()
    setManagerUndo(stack.slice(0, -1))
    setManagerRedo(next => [...next, now])
    restoreUserPresetsSnapshot(prev.userPresets, prev.active)
  }

  function redoManager() {
    const stack = managerRedo()
    if (stack.length === 0) return
    const nextState = stack[stack.length - 1]
    const now = currentSnapshot()
    setManagerRedo(stack.slice(0, -1))
    setManagerUndo(prev => [...prev, now])
    restoreUserPresetsSnapshot(nextState.userPresets, nextState.active)
  }

  function onOpenEditor() {
    const raw = getProjectionJson()
    setText(raw)
    setBaselineText(raw)
    setPreviewMap(null)
    setEditorUndo([])
    setEditorRedo([])
    setError('')
    // Initialise DSL state by serializing the current projection map
    try {
      const map = JSON.parse(raw) as ProjectionMap
      const dsl = DSL_REFERENCE + '\n' + serializeDsl(map)
      setDslText(dsl)
      setDslBaselineText(dsl)
    } catch {
      setDslText(DSL_REFERENCE)
      setDslBaselineText(DSL_REFERENCE)
    }
    setDslPreviewMap(null)
    setDslUndo([])
    setDslRedo([])
    setDslError('')
    setOpen(true)
  }

  function saveTextValue(next: string) {
    const old = text()
    if (old === next) return
    setEditorUndo(prev => [...prev, old])
    setEditorRedo([])
    setText(next)
    try {
      const parsed = JSON.parse(next) as ProjectionMap
      setPreviewMap(parsed)
      setError('')
    } catch (e) {
      setPreviewMap(null)
      setError(String(e))
    }
  }

  function undoEditor() {
    const stack = editorUndo()
    if (stack.length === 0) return
    const prev = stack[stack.length - 1]
    setEditorUndo(stack.slice(0, -1))
    setEditorRedo(next => [...next, text()])
    setText(prev)
    try {
      const parsed = JSON.parse(prev) as ProjectionMap
      setPreviewMap(parsed)
      setError('')
    } catch (e) {
      setPreviewMap(null)
      setError(String(e))
    }
  }

  function redoEditor() {
    const stack = editorRedo()
    if (stack.length === 0) return
    const next = stack[stack.length - 1]
    setEditorRedo(stack.slice(0, -1))
    setEditorUndo(prev => [...prev, text()])
    setText(next)
    try {
      const parsed = JSON.parse(next) as ProjectionMap
      setPreviewMap(parsed)
      setError('')
    } catch (e) {
      setPreviewMap(null)
      setError(String(e))
    }
  }

  function onSave() {
    if (editorMode() === 'dsl') {
      const result = parseDsl(dslText())
      if (!result.ok) { setDslError(result.error); return }
      const loadResult = loadProjectionJson(JSON.stringify(result.map))
      if (!loadResult.ok) { setDslError(loadResult.error); return }
      setDslError('')
      setDslBaselineText(dslText())
      // Sync JSON tab to reflect the saved state
      const saved = getProjectionJson()
      setText(saved)
      setBaselineText(saved)
    } else {
      const result = loadProjectionJson(text())
      if (!result.ok) {
        setError(result.error)
        return
      }
      setError('')
      setBaselineText(text())
      // Sync DSL tab
      try {
        const map = JSON.parse(text()) as ProjectionMap
        const dsl = DSL_REFERENCE + '\n' + serializeDsl(map)
        setDslText(dsl)
        setDslBaselineText(dsl)
      } catch { /* leave DSL tab as-is */ }
    }
  }

  // ── DSL mode helpers ────────────────────────────────────────────────────────

  function saveDslTextValue(next: string) {
    const old = dslText()
    if (old === next) return
    setDslUndo(prev => [...prev, old])
    setDslRedo([])
    setDslText(next)
    const result = parseDsl(next)
    if (result.ok) {
      setDslPreviewMap(result.map)
      setDslError('')
    } else {
      setDslPreviewMap(null)
      setDslError(result.error)
    }
  }

  function undoDsl() {
    const stack = dslUndo()
    if (stack.length === 0) return
    const prev = stack[stack.length - 1]
    setDslUndo(stack.slice(0, -1))
    setDslRedo(r => [...r, dslText()])
    setDslText(prev)
    const result = parseDsl(prev)
    if (result.ok) { setDslPreviewMap(result.map); setDslError('') }
    else { setDslPreviewMap(null); setDslError(result.error) }
  }

  function redoDsl() {
    const stack = dslRedo()
    if (stack.length === 0) return
    const next = stack[stack.length - 1]
    setDslRedo(stack.slice(0, -1))
    setDslUndo(u => [...u, dslText()])
    setDslText(next)
    const result = parseDsl(next)
    if (result.ok) { setDslPreviewMap(result.map); setDslError('') }
    else { setDslPreviewMap(null); setDslError(result.error) }
  }

  function onSwitchMode(newMode: 'dsl' | 'json') {
    if (editorMode() === newMode) return
    if (newMode === 'json') {
      // Sync JSON textarea from DSL if the DSL is currently valid
      const result = parseDsl(dslText())
      if (result.ok) {
        const json = JSON.stringify(result.map, null, 2)
        setText(json)
        setBaselineText(json)
        setPreviewMap(result.map)
        setError('')
      }
    } else {
      // Sync DSL textarea from JSON if JSON is currently valid
      try {
        const map = JSON.parse(text()) as ProjectionMap
        const dsl = DSL_REFERENCE + '\n' + serializeDsl(map)
        setDslText(dsl)
        setDslBaselineText(dsl)
        setDslPreviewMap(map)
        setDslError('')
      } catch { /* leave DSL as-is */ }
    }
    setEditorMode(newMode)
  }

  function onExit() {
    if (hasUnsavedChanges() && !window.confirm('You have unsaved changes. Exit anyway?')) return
    setOpen(false)
    setError('')
    setDslError('')
    setPreviewMap(null)
    setDslPreviewMap(null)
  }

  function onAdd() {
    setAddMode('clone')
    setAddName('')
    setAddSourceName(activePresetName())
    setAddError('')
    setAddOpen(true)
  }

  function onCreateAdd() {
    const name = addName().trim()
    if (!name) {
      setAddError('Name is required.')
      return
    }

    let source: ProjectionMap = {}
    if (addMode() === 'clone') {
      const found = getPresetProjection(addSourceName())
      if (!found) {
        setAddError('Clone source projection not found.')
        return
      }
      source = found
    }

    pushManagerHistory()
    const result = createUserPreset(name, source)
    if (!result.ok) {
      setAddError(result.error)
      return
    }
    setAddOpen(false)
  }

  function onDelete() {
    const name = activePresetName()
    if (isBuiltinPreset(name)) return
    if (!window.confirm(`Delete projection "${name}"? This cannot be undone except via Undo.`)) return
    pushManagerHistory()
    const result = deleteUserPreset(name)
    if (!result.ok) window.alert(result.error)
  }

  function onExport() {
    const names = getUserPresetNames()
    if (names.length === 0) {
      window.alert('There are no custom projections to export.')
      return
    }
    setExportSelected(names)
    setExportError('')
    setExportOpen(true)
  }

  function onToggleExportName(name: string, checked: boolean) {
    if (checked) {
      setExportSelected(prev => (prev.includes(name) ? prev : [...prev, name]))
      return
    }
    setExportSelected(prev => prev.filter(n => n !== name))
  }

  async function onConfirmExport() {
    const selected = exportSelected()
    if (selected.length === 0) {
      setExportError('Select at least one custom projection to export.')
      return
    }
    const available = getUserPresetNames()
    const normalized = selected.filter((name) => available.includes(name))
    const exportMap = exportUserPresets(normalized)
    if (Object.keys(exportMap).length === 0) {
      setExportError('No exportable custom projections were found. Re-open the dialog and try again.')
      return
    }
    const payload = JSON.stringify({ projections: exportMap })
    try {
      triggerDownload(payload, 'projed-projections.json')
      setExportError('')
      setExportOpen(false)
    } catch (e) {
      setExportError(`Could not save file: ${String(e)}`)
    }
  }

  function onImport() {
    importInputRef?.click()
  }

  async function onImportFileChange(e: Event) {
    const input = e.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    try {
      const raw = await file.text()
      const imported = parseProjectionMaps(raw)
      const entries = Object.entries(imported)
      if (entries.length === 0) {
        window.alert('The selected file does not contain any projections.')
        return
      }

      pushManagerHistory()
      for (const [incomingName, map] of entries) {
        let targetName = incomingName
        while (isBuiltinPreset(targetName) || getPresetProjection(targetName)) {
          const action = window.prompt(
            `Projection "${targetName}" already exists. Type "replace", "rename", or "abort".`,
            'replace',
          )?.trim().toLowerCase()
          if (!action || action === 'abort') return
          if (action === 'replace') break
          if (action === 'rename') {
            const renamed = window.prompt('Enter a new projection name:')?.trim()
            if (!renamed) return
            targetName = renamed
            continue
          }
          window.alert('Please type "replace", "rename", or "abort".')
        }
        const result = upsertUserPreset(targetName, map)
        if (!result.ok) {
          window.alert(result.error)
          return
        }
      }
    } catch (err) {
      window.alert(`Import failed: ${String(err)}`)
    }
  }

  return (
    <>
      <select
        class="toolbar-select"
        value={activePresetName()}
        onChange={(e) => switchPreset(e.currentTarget.value)}
      >
        <For each={getPresetNames()}>
          {(name) => <option value={name}>{name}</option>}
        </For>
      </select>
      <button class="toolbar-btn" onClick={onAdd}>Add</button>
      <button class="toolbar-btn" onClick={onDelete} disabled={!canEditActive()}>Delete</button>
      <button class="toolbar-btn" onClick={onImport}>Import</button>
      <button class="toolbar-btn" onClick={onExport}>Export</button>
      <button class="toolbar-btn" onClick={undoManager} disabled={managerUndo().length === 0}>Undo</button>
      <button class="toolbar-btn" onClick={redoManager} disabled={managerRedo().length === 0}>Redo</button>
      <button class="toolbar-btn" onClick={onOpenEditor} disabled={!canEditActive()}>Edit</button>
      <input
        ref={importInputRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={onImportFileChange}
      />

      <Show when={addOpen()}>
        <div class="modal-backdrop" onClick={() => setAddOpen(false)}>
          <div class="modal" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <span>Create Projection</span>
              <button onClick={() => setAddOpen(false)}>✕</button>
            </div>
            <div class="projection-add-body">
              <label class="projection-add-field">
                <span>Mode</span>
                <select class="toolbar-select" value={addMode()} onChange={(e) => setAddMode(e.currentTarget.value as 'empty' | 'clone')}>
                  <option value="clone">Clone existing</option>
                  <option value="empty">Empty</option>
                </select>
              </label>

              <label class="projection-add-field">
                <span>Name</span>
                <input
                  class="prop-input"
                  value={addName()}
                  onInput={(e) => setAddName(e.currentTarget.value)}
                  placeholder="My Projection"
                />
              </label>

              <Show when={addMode() === 'clone'}>
                <label class="projection-add-field">
                  <span>Clone source</span>
                  <select class="toolbar-select" value={addSourceName()} onChange={(e) => setAddSourceName(e.currentTarget.value)}>
                    <For each={getPresetNames()}>
                      {(name) => <option value={name}>{name}</option>}
                    </For>
                  </select>
                </label>
              </Show>

              <Show when={addError()}>
                <div class="modal-error">{addError()}</div>
              </Show>
            </div>
            <div class="modal-footer">
              <button onClick={onCreateAdd}>Create</button>
              <button onClick={() => setAddOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </Show>

      <Show when={exportOpen()}>
        <div class="modal-backdrop" onClick={() => setExportOpen(false)}>
          <div class="modal" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <span>Export Projections</span>
              <button onClick={() => setExportOpen(false)}>✕</button>
            </div>
            <div class="projection-add-body">
              <div class="projection-add-field">
                <span>Select custom projections to export</span>
                <div class="projection-export-list">
                  <For each={getUserPresetNames()}>
                    {(name) => (
                      <label class="projection-export-item">
                        <input
                          type="checkbox"
                          checked={exportSelected().includes(name)}
                          onChange={(e) => onToggleExportName(name, e.currentTarget.checked)}
                        />
                        <span>{name}</span>
                      </label>
                    )}
                  </For>
                </div>
              </div>
              <Show when={exportError()}>
                <div class="modal-error">{exportError()}</div>
              </Show>
            </div>
            <div class="modal-footer">
              <button onClick={onConfirmExport}>Export</button>
              <button onClick={() => setExportOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </Show>

      <Show when={open()}>
        <div class="modal-backdrop projection-editor-backdrop" onClick={onExit}>
          <div class="projection-editor-fullscreen" onClick={(e) => e.stopPropagation()}>
            <div class="projection-editor-header">
              <div>Projection Editor: {activePresetName()}</div>
              <div class="projection-editor-actions">
                <button
                  class="toolbar-btn"
                  onClick={() => editorMode() === 'dsl' ? undoDsl() : undoEditor()}
                  disabled={editorMode() === 'dsl' ? dslUndo().length === 0 : editorUndo().length === 0}
                >Undo</button>
                <button
                  class="toolbar-btn"
                  onClick={() => editorMode() === 'dsl' ? redoDsl() : redoEditor()}
                  disabled={editorMode() === 'dsl' ? dslRedo().length === 0 : editorRedo().length === 0}
                >Redo</button>
                <button class="toolbar-btn" onClick={onSave}>Save</button>
                <button class="toolbar-btn" onClick={onExit}>Exit</button>
              </div>
            </div>

            {/* Mode tabs */}
            <div class="projection-editor-tabs">
              <button
                class="projection-tab"
                classList={{ active: editorMode() === 'dsl' }}
                onClick={() => onSwitchMode('dsl')}
              >DSL</button>
              <button
                class="projection-tab"
                classList={{ active: editorMode() === 'json' }}
                onClick={() => onSwitchMode('json')}
              >JSON</button>
            </div>

            <div class="projection-editor-body">
              <div class="projection-editor-pane">
                <Show when={editorMode() === 'dsl'} fallback={
                  <>
                    <textarea
                      class="projection-textarea projection-editor-textarea"
                      value={text()}
                      onInput={(e) => saveTextValue(e.currentTarget.value)}
                      spellcheck={false}
                    />
                    <Show when={error()}>
                      <div class="modal-error">{error()}</div>
                    </Show>
                  </>
                }>
                  <textarea
                    class="projection-textarea projection-editor-textarea dsl-textarea"
                    value={dslText()}
                    onInput={(e) => saveDslTextValue(e.currentTarget.value)}
                    spellcheck={false}
                    placeholder="# Write projection rules here..."
                  />
                  <Show when={dslError()}>
                    <div class="modal-error">{dslError()}</div>
                  </Show>
                </Show>
              </div>

              <div class="projection-editor-pane projection-preview">
                <div class="projection-preview-header">Live Preview</div>
                <main class="editor-surface projection-preview-surface">
                  <NodeRenderer
                    nodeId={props.model.rootId}
                    model={props.model}
                    onCommand={() => { }}
                    projectionMap={effectivePreviewMap() ?? getPresetProjection(activePresetName()) ?? {}}
                  />
                </main>
              </div>
            </div>
          </div>
        </div>
      </Show>
    </>
  )
}

export default ProjectionEditor
