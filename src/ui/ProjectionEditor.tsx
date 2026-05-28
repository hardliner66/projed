import { Component, createSignal, Show } from 'solid-js'
import { getProjectionJson, loadProjectionJson } from '../projection/registry'

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

  return (
    <>
      <button class="toolbar-btn" onClick={onOpen}>Edit Projections</button>
      <Show when={open()}>
        <div class="modal-backdrop" onClick={() => setOpen(false)}>
          <div class="modal" onClick={(e) => e.stopPropagation()}>
            <div class="modal-header">
              <span>Projection Map (JSON)</span>
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
              <button onClick={() => setOpen(false)}>Cancel</button>
            </div>
          </div>
        </div>
      </Show>
    </>
  )
}

export default ProjectionEditor
