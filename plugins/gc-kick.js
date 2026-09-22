let handler = async (m, { conn, participants, usedPrefix, command }) => {
if (!global.db.data.settings[conn.user.jid].restrict) return
let kicktext = `chi? tagga qualcuno`
if (!m.mentionedJid[0] && !m.quoted) return 
let user = m.mentionedJid[0] ? m.mentionedJid[0] : m.quoted.sender
await conn.groupParticipantsUpdate(m.chat, [user], 'remove')}
handler.command = /^(kick|ban|addio|vaffanculosergiozavarise)$/i
handler.admin = true
handler.group = true
handler.botAdmin = true
export default handler
