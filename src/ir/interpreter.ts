import type { IrModel, IrNode } from './types'

type RuntimeScalar = string | number | boolean | null
interface RuntimeArray extends Array<RuntimeValue> { }
interface RuntimeObject { [key: string]: RuntimeValue }
type RuntimeValue = RuntimeScalar | RuntimeArray | RuntimeObject

type Control =
    | { kind: 'none' }
    | { kind: 'return'; value: RuntimeValue }
    | { kind: 'break' }
    | { kind: 'continue' }

class Env {
    private readonly values = new Map<string, RuntimeValue>()

    constructor(private readonly parent: Env | null = null) { }

    get(name: string): RuntimeValue {
        if (this.values.has(name)) return this.values.get(name) as RuntimeValue
        if (this.parent) return this.parent.get(name)
        return null
    }

    define(name: string, value: RuntimeValue) {
        this.values.set(name, value)
    }

    assign(name: string, value: RuntimeValue): boolean {
        if (this.values.has(name)) {
            this.values.set(name, value)
            return true
        }
        if (this.parent) return this.parent.assign(name, value)
        return false
    }
}

function firstChild(node: IrNode, role: string): string | undefined {
    return node.children[role]?.[0]
}

function parseStringLiteral(raw: string): string {
    const inner = raw.slice(1, -1)
    let result = ''
    let i = 0
    while (i < inner.length) {
        if (inner[i] === '\\' && i + 1 < inner.length) {
            i++
            switch (inner[i]) {
                case 'n':  result += '\n'; break
                case 't':  result += '\t'; break
                case 'r':  result += '\r'; break
                case '0':  result += '\0'; break
                case '\\': result += '\\'; break
                case "'":  result += "'"; break
                case '"':  result += '"'; break
                default:   result += '\\' + inner[i]
            }
        } else {
            result += inner[i]
        }
        i++
    }
    return result
}

function parseLiteral(raw: string): RuntimeValue {
    const value = raw.trim()
    if (value === 'true') return true
    if (value === 'false') return false
    if (value === 'null') return null
    if (/^[-+]?\d+(\.\d+)?$/.test(value)) return Number(value)
    if ((value.startsWith('"') && value.endsWith('"') || value.startsWith("'") && value.endsWith("'")) && value.length >= 2) {
        return parseStringLiteral(value)
    }
    return value
}

function stringifyValue(v: RuntimeValue): string {
    if (typeof v === 'string') return v
    return JSON.stringify(v)
}

export function runIrProgram(model: IrModel): string {
    const outputs: string[] = []
    const functions = new Map<string, string>()
    const root = model.nodes[model.rootId]
    if (!root) return ''

    const globalEnv = new Env(null)

    for (const declId of root.children.declarations ?? []) {
        const node = model.nodes[declId]
        if (!node) continue
        if (node.kind === 'FnDecl') {
            const name = String(node.props.name ?? '').trim()
            if (name) functions.set(name, declId)
        }
    }

    const evalExpr = (nodeId: string | undefined, env: Env): RuntimeValue => {
        if (!nodeId) return null
        const node = model.nodes[nodeId]
        if (!node) return null

        switch (node.kind) {
            case 'LiteralExpr':
                return parseLiteral(String(node.props.value ?? ''))
            case 'IdentifierExpr':
                return env.get(String(node.props.name ?? ''))
            case 'ArrayLiteralExpr':
                return (node.children.elements ?? []).map((id) => evalExpr(id, env))
            case 'UnaryExpr': {
                const op = String(node.props.op ?? '-')
                const expr = evalExpr(firstChild(node, 'expr'), env)
                if (op === '!') return !Boolean(expr)
                if (op === '-') return -Number(expr ?? 0)
                return expr
            }
            case 'BinaryExpr': {
                const left = evalExpr(firstChild(node, 'left'), env)
                const right = evalExpr(firstChild(node, 'right'), env)
                const op = String(node.props.op ?? '+')
                switch (op) {
                    case '+': return typeof left === 'string' || typeof right === 'string' ? `${left ?? ''}${right ?? ''}` : Number(left ?? 0) + Number(right ?? 0)
                    case '-': return Number(left ?? 0) - Number(right ?? 0)
                    case '*': return Number(left ?? 0) * Number(right ?? 0)
                    case '/': return Number(left ?? 0) / Number(right ?? 1)
                    case '%': return Number(left ?? 0) % Number(right ?? 1)
                    case '==': return left === right
                    case '!=': return left !== right
                    case '<': return Number(left ?? 0) < Number(right ?? 0)
                    case '<=': return Number(left ?? 0) <= Number(right ?? 0)
                    case '>': return Number(left ?? 0) > Number(right ?? 0)
                    case '>=': return Number(left ?? 0) >= Number(right ?? 0)
                    case '&&': return Boolean(left) && Boolean(right)
                    case '||': return Boolean(left) || Boolean(right)
                    default: return null
                }
            }
            case 'MemberExpr': {
                const object = evalExpr(firstChild(node, 'object'), env)
                const member = String(node.props.member ?? '')
                if (member === 'length' && (Array.isArray(object) || typeof object === 'string')) return object.length
                if (object && typeof object === 'object' && !Array.isArray(object)) return (object as Record<string, RuntimeValue>)[member] ?? null
                return null
            }
            case 'IndexExpr': {
                const object = evalExpr(firstChild(node, 'object'), env)
                const idx = evalExpr(firstChild(node, 'index'), env)
                if (Array.isArray(object)) {
                    const i = Number(idx ?? 0)
                    return i >= 0 && i < object.length ? object[i] : null
                }
                if (object && typeof object === 'object' && !Array.isArray(object)) {
                    return (object as Record<string, RuntimeValue>)[String(idx ?? '')] ?? null
                }
                return null
            }
            case 'AssignExpr': {
                const targetId = firstChild(node, 'target')
                const value = evalExpr(firstChild(node, 'value'), env)
                const target = targetId ? model.nodes[targetId] : undefined
                if (target?.kind === 'IdentifierExpr') {
                    const name = String(target.props.name ?? '')
                    if (!env.assign(name, value)) env.define(name, value)
                }
                if (target?.kind === 'IndexExpr') {
                    const obj = evalExpr(firstChild(target, 'object'), env)
                    const idx = evalExpr(firstChild(target, 'index'), env)
                    if (Array.isArray(obj)) {
                        const i = Number(idx ?? 0)
                        if (i >= 0 && i < obj.length) obj[i] = value
                    } else if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
                        ;(obj as Record<string, RuntimeValue>)[String(idx ?? '')] = value
                    }
                }
                if (target?.kind === 'MemberExpr') {
                    const obj = evalExpr(firstChild(target, 'object'), env)
                    const member = String(target.props.member ?? '')
                    if (obj !== null && typeof obj === 'object' && !Array.isArray(obj)) {
                        ;(obj as Record<string, RuntimeValue>)[member] = value
                    }
                }
                return value
            }
            case 'CallExpr': {
                const calleeId = firstChild(node, 'callee')
                const argValues = (node.children.args ?? []).map((argId) => evalExpr(argId, env))
                const calleeNode = calleeId ? model.nodes[calleeId] : undefined
                const calleeName = calleeNode?.kind === 'IdentifierExpr' ? String(calleeNode.props.name ?? '') : ''

                if (calleeName === 'print') {
                    outputs.push(argValues.map(stringifyValue).join(' '))
                    return null
                }

                if (calleeName === 'range') {
                    const start = Number(argValues[0] ?? 0)
                    const end = Number(argValues[1] ?? start)
                    const out: RuntimeValue[] = []
                    for (let i = start; i < end; i += 1) out.push(i)
                    return out
                }

                if (calleeName === 'len') {
                    const v = argValues[0]
                    if (Array.isArray(v) || typeof v === 'string') return v.length
                    return null
                }

                if (calleeName === 'push') {
                    const arr = argValues[0]
                    if (Array.isArray(arr)) { arr.push(argValues[1] ?? null); return arr }
                    return null
                }

                if (calleeName === 'pop') {
                    const arr = argValues[0]
                    if (Array.isArray(arr) && arr.length > 0) return arr.pop() ?? null
                    return null
                }

                if (calleeName === 'slice') {
                    const arr = argValues[0]
                    const start = Number(argValues[1] ?? 0)
                    const end = argValues[2] !== undefined ? Number(argValues[2]) : undefined
                    if (Array.isArray(arr)) return arr.slice(start, end)
                    if (typeof arr === 'string') return arr.slice(start, end)
                    return null
                }

                if (calleeName === 'append') {
                    const arr = argValues[0]
                    if (Array.isArray(arr)) return [...arr, argValues[1] ?? null]
                    return null
                }

                if (calleeName === 'str') {
                    return stringifyValue(argValues[0] ?? null)
                }

                if (calleeName === 'num') {
                    const v = argValues[0]
                    if (typeof v === 'number') return v
                    if (typeof v === 'string') { const n = Number(v); return isNaN(n) ? null : n }
                    if (typeof v === 'boolean') return v ? 1 : 0
                    return null
                }

                if (calleeName === 'floor') return Math.floor(Number(argValues[0] ?? 0))
                if (calleeName === 'ceil') return Math.ceil(Number(argValues[0] ?? 0))
                if (calleeName === 'abs') return Math.abs(Number(argValues[0] ?? 0))
                if (calleeName === 'sqrt') return Math.sqrt(Number(argValues[0] ?? 0))
                if (calleeName === 'min') return Math.min(Number(argValues[0] ?? 0), Number(argValues[1] ?? 0))
                if (calleeName === 'max') return Math.max(Number(argValues[0] ?? 0), Number(argValues[1] ?? 0))

                if (calleeName === 'keys') {
                    const obj = argValues[0]
                    if (obj && typeof obj === 'object' && !Array.isArray(obj)) return Object.keys(obj as Record<string, RuntimeValue>)
                    return []
                }

                if (calleeName === 'split') {
                    const s = String(argValues[0] ?? '')
                    const sep = String(argValues[1] ?? '')
                    return s.split(sep)
                }

                if (calleeName === 'join') {
                    const arr = argValues[0]
                    const sep = String(argValues[1] ?? '')
                    if (Array.isArray(arr)) return arr.map(stringifyValue).join(sep)
                    return String(arr ?? '')
                }

                if (calleeName === 'type') {
                    const v = argValues[0]
                    if (v === null) return 'null'
                    if (Array.isArray(v)) return 'Array'
                    return typeof v
                }

                if (calleeName === 'has') {
                    const obj = argValues[0]
                    const key = String(argValues[1] ?? '')
                    if (Array.isArray(obj)) return obj.some(el => el === argValues[1])
                    if (obj && typeof obj === 'object') return key in (obj as Record<string, RuntimeValue>)
                    return false
                }

                if (calleeName && functions.has(calleeName)) {
                    return callFunction(functions.get(calleeName) as string, argValues)
                }

                return null
            }
            default:
                return null
        }
    }

    const runStmt = (stmtId: string, env: Env): Control => {
        const node = model.nodes[stmtId]
        if (!node) return { kind: 'none' }

        switch (node.kind) {
            case 'LetStmt': {
                const name = String(node.props.name ?? '')
                const value = evalExpr(firstChild(node, 'value'), env)
                if (name) env.define(name, value)
                return { kind: 'none' }
            }
            case 'ExprStmt':
                evalExpr(firstChild(node, 'expr'), env)
                return { kind: 'none' }
            case 'ReturnStmt':
                return { kind: 'return', value: evalExpr(firstChild(node, 'value'), env) }
            case 'IfStmt': {
                const cond = Boolean(evalExpr(firstChild(node, 'condition'), env))
                const branch = cond ? (node.children.thenBody ?? []) : (node.children.elseBody ?? [])
                const branchEnv = new Env(env)
                for (const child of branch) {
                    const c = runStmt(child, branchEnv)
                    if (c.kind !== 'none') return c
                }
                return { kind: 'none' }
            }
            case 'WhileStmt': {
                const loopEnv = new Env(env)
                let guard = 0
                while (Boolean(evalExpr(firstChild(node, 'condition'), loopEnv))) {
                    guard += 1
                    if (guard > 5000) {
                        outputs.push('[runtime] loop limit reached')
                        return { kind: 'none' }
                    }
                    for (const child of node.children.body ?? []) {
                        const c = runStmt(child, loopEnv)
                        if (c.kind === 'continue') break
                        if (c.kind === 'break') return { kind: 'none' }
                        if (c.kind === 'return') return c
                    }
                }
                return { kind: 'none' }
            }
            case 'ForStmt': {
                const itemName = String(node.props.item ?? 'item')
                const iterable = evalExpr(firstChild(node, 'iterable'), env)
                const values = Array.isArray(iterable) ? iterable : []
                for (const item of values) {
                    const loopEnv = new Env(env)
                    loopEnv.define(itemName, item)
                    for (const child of node.children.body ?? []) {
                        const c = runStmt(child, loopEnv)
                        if (c.kind === 'continue') break
                        if (c.kind === 'break') return { kind: 'none' }
                        if (c.kind === 'return') return c
                    }
                }
                return { kind: 'none' }
            }
            case 'BreakStmt':
                return { kind: 'break' }
            case 'ContinueStmt':
                return { kind: 'continue' }
            default:
                return { kind: 'none' }
        }
    }

    const callFunction = (fnId: string, args: RuntimeValue[]): RuntimeValue => {
        const fn = model.nodes[fnId]
        if (!fn || fn.kind !== 'FnDecl') return null
        const fnEnv = new Env(globalEnv)
        const params = fn.children.params ?? []
        params.forEach((paramId, index) => {
            const param = model.nodes[paramId]
            const name = param?.kind === 'Parameter' ? String(param.props.name ?? '') : ''
            if (name) fnEnv.define(name, args[index] ?? null)
        })

        for (const stmtId of fn.children.body ?? []) {
            const control = runStmt(stmtId, fnEnv)
            if (control.kind === 'return') return control.value
            if (control.kind === 'break' || control.kind === 'continue') break
        }
        return null
    }

    for (const declId of root.children.declarations ?? []) {
        const decl = model.nodes[declId]
        if (!decl) continue
        if (decl.kind === 'LetDecl') {
            const name = String(decl.props.name ?? '')
            const value = evalExpr(firstChild(decl, 'value'), globalEnv)
            if (name) globalEnv.define(name, value)
        }
    }

    if (functions.has('main')) callFunction(functions.get('main') as string, [])
    else outputs.push('[runtime] no entrypoint found (expected main)')

    return outputs.join('\n')
}
