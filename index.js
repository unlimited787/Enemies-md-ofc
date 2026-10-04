import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { setupMaster, fork } from 'cluster'
import { watchFile, unwatchFile } from 'fs'
import { createInterface } from 'readline'
import cfonts from 'cfonts'

const __dirname = dirname(fileURLToPath(import.meta.url))

const rl = createInterface(process.stdin, process.stdout)

let isRunning = false

async function start(file) {

  if (isRunning) return

  isRunning = true

  console.clear()

  cfonts.say('ENEMIES\nBOT 2.0', {
    font: 'tiny',
    align: 'center',
    colors: ['blue', 'cyan']
  })

  console.log('Ci siamo quasi\n')

  const args = [
    join(__dirname, file),
    ...process.argv.slice(2)
  ]

  setupMaster({
    exec: args[0],
    args: args.slice(1)
  })

  const processInstance = fork()

  processInstance.on('message', data => {

    console.log('[→]', data)

    switch (data) {

      case 'reset':

        processInstance.kill()

        isRunning = false

        start(file)

        break

      case 'uptime':

        processInstance.send(
          process.uptime()
        )

        break
    }
  })

  processInstance.on('exit', (_, code) => {

    isRunning = false

    if (code !== 0) {

      watchFile(args[0], () => {

        unwatchFile(args[0])

        start(file)
      })
    }
  })

  const isTest =
    process.argv
      .slice(2)
      .some(arg =>
        arg === '--test' ||
        arg === '-test'
      )

  if (!isTest) {

    rl.on('line', line => {

      processInstance.send(
        line.trim()
      )
    })
  }
}

start('main.js')
