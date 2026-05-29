import { Component } from 'solid-js'
import type { IrNode, EditCommand } from '../../ir/types'
import { setSelectedNodeId, editingNodeProp, setEditingNodeProp } from '../../editor/state'

interface Props {
  node: IrNode
  propName: string
  onCommand: (cmd: EditCommand) => void
  multiline?: boolean
}

const PropCell: Component<Props> = (props) => {
  const value = () => String(props.node.props[props.propName] ?? '')
  const isEditing = () => editingNodeProp()?.nodeId === props.node.id && editingNodeProp()?.propName === props.propName

  function commit(val: string) {
    setEditingNodeProp(null)
    if (val !== String(props.node.props[props.propName] ?? '')) {
      props.onCommand({ type: 'SET_PROP', nodeId: props.node.id, prop: props.propName, value: val })
    }
  }

  function cancelEdit() {
    setEditingNodeProp(null)
  }

  return (
    <span
      class="cell-prop"
      onClick={(e) => { e.stopPropagation(); setSelectedNodeId(props.node.id); setEditingNodeProp({ nodeId: props.node.id, propName: props.propName }) }}
    >
      {isEditing() ? (
        props.multiline ? (
          <textarea
            value={value()}
            onBlur={(e) => commit(e.currentTarget.value)}
            onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); cancelEdit() } }}
            autofocus
            rows={3}
          />
        ) : (
          <input
            type="text"
            value={value()}
            onBlur={(e) => commit(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.stopPropagation(); commit(e.currentTarget.value) }
              if (e.key === 'Escape') { e.stopPropagation(); cancelEdit() }
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
