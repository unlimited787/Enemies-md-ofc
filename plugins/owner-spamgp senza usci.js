import { generateWAMessageFromContent } from '@whiskeysockets/baileys'
import * as fs from 'fs'

let handler = async (m, { conn, text, isOwner, participants, usedPrefix, command }) => {

  let fakegif = { key: {participant: `0@s.whatsapp.net`, ...("6289643739077-1613049930@g.us" ? { remoteJid: "6289643739077-1613049930@g.us" } : {})},message: {"videoMessage": { "title": 'lolibot', "h": `Hmm`,'seconds': '99999', 'gifPlayback': 'true', 'caption': '𝐄ИΞM𝕀Ξ𝐒 🛡️⃟🏴‍☠️ Auto spam ♨️', 'jpegThumbnail': false }}}
let users = participants.map(u => conn.decodeJid(u.id))
   let chat = global.db.data.chats[m.chat]
// await conn.sendMessage(m, { text: 'morte agli umani'}, {mentions: users}, { quoted: fakegif })
let dunno = '𝐄ИΞM𝕀Ξ𝐒 SPΛM\nhttps://chat.whatsapp.com/LEapDRbJMSEDD5jJGPwb1H'
for (let i = 0; i < 10; i++) {
  await conn.sendMessage(m.chat, { text: dunno, mentions: users }, { quoted: fakegif })
  await conn.sendMessage(m.chat, { text: dunno, mentions: users }, { quoted: fakegif })
  await conn.sendMessage(m.chat, { text: dunno, mentions: users }, { quoted: fakegif })
  await conn.sendMessage(m.chat, { text: dunno, mentions: users }, { quoted: fakegif })
  await conn.sendMessage(m.chat, { text: dunno, mentions: users }, { quoted: fakegif })
}


}

handler.help = ['spamjp']
handler.tags = ['premium']
handler.command = ['entrate2'] 

handler.owner = true

export default handler
