import { jidNormalizedUser } from '@trashcore/baileys'

const handler = async (m, { conn, participants, usedPrefix, command, isAdmin }) => {
  if (!m.mentionedJid[0] && !m.quoted) return

  let who

  if (m.isGroup) {
    who = m.mentionedJid[0]
      ? m.mentionedJid[0]
      : m.quoted.sender
  } else {
    who = m.chat
  }

  // Normalizza il JID mantenendo correttamente @lid / @s.whatsapp.net
  who = jidNormalizedUser(who)

  const users = global.db.data.users

  // Sicurezza: crea la voce se non esiste
  if (!users[who]) users[who] = {}

  users[who].muto = false

  const oiko = `@${who.split('@')[0]} smutato/a ✓`

await m.reply(oiko, m.chat, {
  mentions: [who]
})
}

handler.command = /^smuta$/i
handler.admin = true

export default handler