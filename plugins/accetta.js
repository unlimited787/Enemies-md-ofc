
let handler = async (m, { conn }) => {
  const requests = await conn.groupRequestParticipantsList(m.chat)

  if (!requests.length) return m.reply('Non ci sono richieste di ingresso in attesa.')

  const jids = requests.map(request => request.jid)
  await conn.groupRequestParticipantsUpdate(m.chat, jids, 'approve')

  m.reply(`✅ Elaborate ${jids.length} richieste di ingresso.`)
}

handler.command = ['accetta']
handler.group = true
handler.admin = true

export default handler
