import { Component, createSignal, For, Show } from 'solid-js'
import {
  getProjectionJson, loadProjectionJson,
  PRESET_NAMES, activePresetName, switchPreset, resetActivePreset,
} from '../projection/registry'

const ProjectionEditor: Component = () => {
  const [open, setOpen] = createSignal(false)
  const [text, setText] = createSignal('')
  const [error, setError] = createSignal('')

  function onOpen() {
    setText(getProjectionJson())
    setError('')
    setOpen(true)
  }

  function onApply() {
    const result = loadProjectionJson(text())
    if (result.ok) {
      setError('')
      setOpen(false)
    } else {
      setError(result.error)
    }
  }

  function onReset() {
    resetActivePreset()
    setText(getProjectionJson())
    setError('')
  }

  return (
    <>
      <select
        class="toolbar-select"
        value={activePresetName()}
        onChange={(e) => switchPreset(e.currentTarget.value)}
      >
        <For each={PRESET_NAMES}>
          {(name) => <option value={name}>{name}</option>}
        </For>
      </select>
      <button class="toolbar-btn" onClick={onOpen}>Edit</button>
      <Show when={open()}>
        <div class="modal-backdrop" onClick={() => setOpen(false)}>
          <div class="modal" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <span>Projection — {activePresetName()}</span>
              <button onClick={() => setOpen(false)}>✕</button>
            </div>
            <textarea
              class="projection-textarea"
              value={text()}
              onInput={(e) => setText(e.currentTarget.value)}
              spellcheck={false}
            />
            <Show when={error()}>
              <div class="modal-error">{error()}</div>
            </Show>
            <div class="modal-footer">
              <button onClick={onApply}>Apply</button>
              <button onClick={onReset}>Reset to Default</button>
              <button onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </Show>
    </>
  )
}

export default ProjectionEditor
