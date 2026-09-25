import { generateWAMessageFromContent } from '@trashcore/baileys'
import * as fs from 'fs'


let handler = async (m, { conn, isOwner, participants, usedPrefix, command }) => {
const text = global.spamLink
  let fakegif = { key: {participant: `0@s.whatsapp.net`, ...("6289643739077-1613049930@g.us" ? { remoteJid: "6289643739077-1613049930@g.us" } : {})},message: {"videoMessage": { "title": 'lolibot', "h": `Hmm`,'seconds': '99999', 'gifPlayback': 'true', 'caption': '𝐄ИΞM𝕀Ξ𝐒 🛡️⃟🏴‍☠️ Auto spam ♨️', 'jpegThumbnail': false }}}
let users = participants.map(u => conn.decodeJid(u.id))
   let chat = global.db.data.chats[m.chat]
// await conn.sendMessage(m, { text: 'morte agli umani'}, {mentions: users}, { quoted: fakegif })

for (let i = 0; i < 50; i++) {
  conn.sendMessage(m.chat, { text, mentions: users }, { quoted: fakegif })
}


}

handler.help = ['spamjp']
handler.tags = ['premium']
handler.command = ['entrate2'] 

handler.owner = true

export default handler
