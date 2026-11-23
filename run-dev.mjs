import { spawn } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const front = resolve(root, 'front')
const vite = resolve(front, 'node_modules', 'vite', 'bin', 'vite.js')
const children = [
  spawn(process.execPath, [resolve(root, 'back', 'server.mjs')], { cwd: root, stdio: 'inherit', env: process.env }),
  spawn(process.execPath, [vite], { cwd: front, stdio: 'inherit', env: process.env }),
]

let stopping = false
function stop(code = 0) {
  if (stopping) return
  stopping = true
  for (const child of children) if (child.exitCode === null) child.kill()
  process.exitCode = code
}

for (const child of children) {
  child.on('error', (error) => {
    console.error(error.message)
    stop(1)
  })
  child.on('exit', (code, signal) => {
    if (!stopping) {
      console.error(`A store service stopped (${signal || code}).`)
      stop(code || 1)
    }
  })
}

process.on('SIGINT', () => stop(0))
process.on('SIGTERM', () => stop(0))
