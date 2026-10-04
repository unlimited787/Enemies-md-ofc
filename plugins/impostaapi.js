let handler = async (m, { conn, text }) => {
  if (!text?.trim()) {
    return m.reply('e allora?')
  }

  const api = text.trim()

  global.api = api

  return m.reply(`fatto! prova ora .andre`)
}

handler.command = ['impostaapi']
handler.help = ['impostaapi <link>']
handler.owner = true

export default handler