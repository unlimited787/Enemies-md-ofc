import { WAMessageStubType } from '@trashcore/baileys'
import { watchFile } from 'fs'

export default async function (m, conn = { user: {} }) {
return
}
let file = global.__filename(import.meta.url)
watchFile(file, () => {
console.log(chalk.redBright("Update 'lib/print.js'"))})