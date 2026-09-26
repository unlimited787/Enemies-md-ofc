let handler = async (m, { conn, text }) => {
  if (!text?.trim()) {
    return m.reply('e allora?')
  }

  const link = text.trim()

  global.spamLink = link

  return m.reply(`fatto! preparatevi gente!`)
}

handler.command = ['impostaspam']
handler.help = ['impostaspam <link>']
handler.owner = true

export default handler
