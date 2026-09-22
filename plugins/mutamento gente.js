let handler = m => m

handler.before = async function (m, { participants, conn, isBotAdmin, isAdmin, args }) {
let users = participants.map(u => conn.decodeJid(u.id))
let chat = global.db.data.chats[m.chat]
let utente = global.db.data.users[m.sender]
let cance = m.key.participant
let bang = m.key.id
if (m) {
if (utente.muto == true) {
conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: cance }})
}}
}

export default handler