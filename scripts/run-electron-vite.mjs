import { spawn } from "child_process"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, "..")
const cliPath = path.join(rootDir, "node_modules", "electron-vite", "bin", "electron-vite.js")

// Ensure Electron does not inherit ELECTRON_RUN_AS_NODE=1 from Electron-based IDEs/terminals
const env = { ...process.env }
delete env.ELECTRON_RUN_AS_NODE

const child = spawn(process.execPath, [cliPath, ...process.argv.slice(2)], {
  cwd: rootDir,
  env,
  stdio: "inherit",
})

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal)
  } else {
    process.exit(code ?? 0)
  }
})
