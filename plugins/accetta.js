let handler = async (m, { conn }) => {
  const requests = await conn.groupRequestParticipantsList(m.chat)

  if (!requests.length) {
    return m.reply('Non ci sono richieste di ingresso in attesa.')
  }

  for (const request of requests) {
    await conn.groupRequestParticipantsUpdate(m.chat, [request.jid], 'approve')
  }

  m.reply(`✅ Accettate ${requests.length} richieste di ingresso.`)
}

handler.command = ['accetta']
handler.group = true
handler.admin = true

export default handler
