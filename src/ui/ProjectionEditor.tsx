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
  URL.revokeObjectURL(url)
}

const ProjectionEditor: Component<Props> = (props) => {
  const [open, setOpen] = createSignal(false)
  const [text, setText] = createSignal('')
  const [baselineText, setBaselineText] = createSignal('')
  const [error, setError] = createSignal('')
  const [previewMap, setPreviewMap] = createSignal<ProjectionMap | null>(null)
  const [editorUndo, setEditorUndo] = createSignal<string[]>([])
  const [editorRedo, setEditorRedo] = createSignal<string[]>([])
  const [managerUndo, setManagerUndo] = createSignal<ManagerSnapshot[]>([])
  const [managerRedo, setManagerRedo] = createSignal<ManagerSnapshot[]>([])
  let importInputRef: HTMLInputElement | undefined

  const canEditActive = createMemo(() => !isBuiltinPreset(activePresetName()))
  const hasUnsavedChanges = createMemo(() => text() !== baselineText())

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
    const result = loadProjectionJson(text())
    if (!result.ok) {
      setError(result.error)
      return
    }
    setError('')
    setBaselineText(text())
  }

  function onExit() {
    if (hasUnsavedChanges() && !window.confirm('You have unsaved changes. Exit anyway?')) return
    setOpen(false)
    setError('')
    setPreviewMap(null)
  }

  function onAdd() {
    const modeRaw = window.prompt('Type "empty" to create an empty projection, or "clone" to copy an existing one.', 'clone')
    if (!modeRaw) return
    const mode = modeRaw.trim().toLowerCase()
    if (mode !== 'empty' && mode !== 'clone') {
      window.alert('Please type exactly "empty" or "clone".')
      return
    }
    const name = window.prompt('Enter a name for the new projection:')?.trim()
    if (!name) return

    let source: ProjectionMap = {}
    if (mode === 'clone') {
      const sourceName = window.prompt(`Clone from which projection?\nAvailable: ${getPresetNames().join(', ')}`, activePresetName())?.trim()
      if (!sourceName) return
      const found = getPresetProjection(sourceName)
      if (!found) {
        window.alert('Projection not found.')
        return
      }
      source = found
    }

    pushManagerHistory()
    const result = createUserPreset(name, source)
    if (!result.ok) {
      window.alert(result.error)
      return
    }
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
    const answer = window.prompt(
      `Export which custom projections?\nType "all" or a comma-separated list.\nAvailable: ${names.join(', ')}`,
      'all',
    )
    if (!answer) return
    const requested = answer.trim().toLowerCase() === 'all'
      ? names
      : answer.split(',').map((n) => n.trim()).filter(Boolean)
    const exportMap = exportUserPresets(requested)
    const selected = Object.keys(exportMap)
    if (selected.length === 0) {
      window.alert('No matching custom projections selected.')
      return
    }
    triggerDownload(JSON.stringify({ projections: exportMap }, null, 2), 'projed-projections.json')
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

      <Show when={open()}>
        <div class="modal-backdrop projection-editor-backdrop" onClick={onExit}>
          <div class="projection-editor-fullscreen" onClick={(e) => e.stopPropagation()}>
            <div class="projection-editor-header">
              <div>Projection Editor: {activePresetName()}</div>
              <div class="projection-editor-actions">
                <button class="toolbar-btn" onClick={undoEditor} disabled={editorUndo().length === 0}>Undo</button>
                <button class="toolbar-btn" onClick={redoEditor} disabled={editorRedo().length === 0}>Redo</button>
                <button class="toolbar-btn" onClick={onSave}>Save</button>
                <button class="toolbar-btn" onClick={onExit}>Exit</button>
              </div>
            </div>

            <div class="projection-editor-body">
              <div class="projection-editor-pane">
                <textarea
                  class="projection-textarea projection-editor-textarea"
                  value={text()}
                  onInput={(e) => saveTextValue(e.currentTarget.value)}
                  spellcheck={false}
                />
                <Show when={error()}>
                  <div class="modal-error">{error()}</div>
                </Show>
              </div>

              <div class="projection-editor-pane projection-preview">
                <div class="projection-preview-header">Live Preview</div>
                <main class="editor-surface projection-preview-surface">
                  <NodeRenderer
                    nodeId={props.model.rootId}
                    model={props.model}
                    onCommand={() => {}}
                    projectionMap={previewMap() ?? getPresetProjection(activePresetName()) ?? {}}
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
