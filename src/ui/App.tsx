import { Component } from 'solid-js'
import { createIrModel } from '../ir/model'
import NodeRenderer from './NodeRenderer'
import Sidebar from './Sidebar'
import ProjectionEditor from './ProjectionEditor'

const initialAst = {
  id: 'file-1',
  kind: 'File',
  props: {},
  children: {
    declarations: [
      {
        id: 'struct-person',
        kind: 'StructDecl',
        props: { name: 'Person' },
        children: {
          fields: [
            { id: 'field-name', kind: 'FieldDecl', props: { name: 'name', type: 'String' }, children: {} },
            { id: 'field-age',  kind: 'FieldDecl', props: { name: 'age',  type: 'Int'    }, children: {} },
          ],
        },
      },
      {
        id: 'fn-greet',
        kind: 'FnDecl',
        props: { name: 'greet' },
        children: {
          params: [
            { id: 'param-who', kind: 'Parameter', props: { name: 'who', type: 'String' }, children: {} },
          ],
          body: [],
        },
      },
    ],
  },
}

const App: Component = () => {
  const { model, applyCommand } = createIrModel(initialAst)

  return (
    <div class="app">
      <header class="toolbar">
        <span class="app-title">Projed</span>
        <ProjectionEditor />
      </header>
      <div class="workspace">
        <main class="editor-surface" onClick={() => {}}>
          <NodeRenderer nodeId={model.rootId} model={model} onCommand={applyCommand} />
        </main>
        <Sidebar model={model} onCommand={applyCommand} />
      </div>
    </div>
  )
}

export default App
