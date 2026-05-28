import type { Component } from 'solid-js'

interface Props {
  text: string
  style?: 'keyword' | 'punct' | 'comment'
}

const LabelCell: Component<Props> = (props) => {
  return (
    <span class={`cell-label ${props.style ?? ''}`}>{props.text}</span>
  )
}

export default LabelCell
