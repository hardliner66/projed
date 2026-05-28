import { Component, createEffect, createSignal } from 'solid-js'
import type { IrNode } from '../../ir/types'
import type { EditCommand } from '../../ir/types'
import { setSelectedNodeId } from '../../editor/state'

interface Props {
  node: IrNode
  propName: string
  onCommand: (cmd: EditCommand) => void
  multiline?: boolean
}

const PropCell: Component<Props> = (props) => {
  const value = () => String(props.node.props[props.propName] ?? '')
  const [editing, setEditing] = createSignal(false)
  let inputRef!: HTMLInputElement | HTMLTextAreaElement

  function commit(val: string) {
    setEditing(false)
    if (val !== String(props.node.props[props.propName] ?? '')) {
      props.onCommand({ type: 'SET_PROP', nodeId: props.node.id, prop: props.propName, value: val })
    }
  }

  return (
    <span
      class="cell-prop"
      onClick={(e) => { e.stopPropagation(); setSelectedNodeId(props.node.id); setEditing(true) }}
    >
      {editing() ? (
        props.multiline ? (
          <textarea
            ref={inputRef as HTMLTextAreaElement}
            value={value()}
            onBlur={(e) => commit(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') setEditing(false) }}
            autofocus
            rows={3}
          />
        ) : (
          <input
            ref={inputRef as HTMLInputElement}
            type="text"
            value={value()}
            onBlur={(e) => commit(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit(e.currentTarget.value)
              if (e.key === 'Escape') setEditing(false)
            }}
            autofocus
            size={Math.max(value().length + 2, 4)}
          />
        )
      ) : (
        <span class="prop-value">{value() || <em class="placeholder">{props.propName}</em>}</span>
      )}
    </span>
  )
}

export default PropCell
