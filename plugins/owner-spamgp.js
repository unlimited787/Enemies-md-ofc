let linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})( [0-9]{1,3})?/i

let handler = async (m, { conn, text, isOwner, usedPrefix, command }) => {

  let fakegif = { key: {participant: `0@s.whatsapp.net`, ...("6289643739077-1613049930@g.us" ? { remoteJid: "6289643739077-1613049930@g.us" } : {})},message: {"videoMessage": { "title": 'lolibot', "h": `Hmm`,'seconds': '99999', 'gifPlayback': 'true', 'caption': '𝐄ИΞM𝕀Ξ𝐒 🛡️⃟🏴‍☠️ Auto spam ♨️', 'jpegThumbnail': false }}}

  if (!text) return
  let [_, code, expired] = text.match(linkRegex) || []
  if (!code) return
  let res = await conn.groupAcceptInvite(code)
  m.reply(`. . .`)
await conn.sendMessage(res, { text: 'https://chat.whatsapp.com/BIjbJ8iwUykIEvPjAz7ei2', mentions: (await conn.groupMetadata(`${res}`)).participants.map(v => v.id) }, { quoted: fakegif })
  conn.groupLeave(res)
}

handler.help = ['spamjp']
handler.tags = ['premium']
handler.command = ['spamgp'] 

handler.owner = true

export default handler
