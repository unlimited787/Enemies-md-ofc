import { jidNormalizedUser } from '@vkazee/baileys'

const handler = async (m, { conn, participants }) => {

  if (!m.mentionedJid?.[0] && !m.quoted) return

  let who

  if (m.isGroup) {

    if (m.quoted) {
      // REPLY → già funzionante
      who = m.quoted.sender

    } else {
      // MENTION → cerchiamo il participant reale
      const mentioned = jidNormalizedUser(m.mentionedJid[0])

      const participant = participants?.find(p => {
        const id = jidNormalizedUser(p.id)
        return id === mentioned
      })

      who = participant?.id || m.mentionedJid[0]
    }

  } else {
    who = m.chat
  }

  if (!who) return

  const users = global.db.data.users

  if (!users[who]) {
    users[who] = {}
  }

  users[who].muto = true

  console.log('[MUTA]')
  console.log('mentioned:', m.mentionedJid?.[0])
  console.log('quoted:', m.quoted?.sender)
  console.log('WHO:', who)
  console.log('MUTO:', users[who].muto)

  const oiko = `@${who.split('@')[0]} mutato/a ✓`

  await m.reply(oiko, null, {
    mentions: [who]
  })
}

handler.command = /^muta$/i
handler.admin = true

export default handler