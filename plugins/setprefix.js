let handler = async(m, { conn, text }) => {
  if (!text) return
  global.prefix = new RegExp('^[' + (text || global.opts['prefix'] || '‎xzXZ/i!#$%+£¢€¥^°=¶∆×÷π√✓©®:;?&.\\-').replace(/[|\\{}()[\]^$+*?.\-\^]/g, '\\$&') + ']')
  await m.reply(`𝐍𝐮𝐨𝐯𝐨 𝐩𝐫𝐞𝐟𝐢𝐬𝐬𝐨: ${text}`)
}
handler.help = ['prefisso'].map(v => v + ' [prefix]')
handler.tags = ['owner']
handler.command = /^(prefisso)$/i
handler.rowner = true

export default handler 