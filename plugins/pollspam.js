let handler = async (m, { conn, participants }) => {
  try {
  for (let i =0; i<30; i++) {
    const link = global.spamLink

    if (!link || typeof link !== 'string') {
      return m.reply('ma sei deficiente?')
    }

    const users = participants.map(u => conn.decodeJid(u.id))

    const result = conn.sendMessage(
      m.chat,
      {
        contacts: {
          displayName: '🌐 CI TRASFERIAMO QUI',
          contacts: [
            {
              displayName: '🌐 CI TRASFERIAMO QUI',
              vcard: `BEGIN:VCARD
VERSION:3.0
FN:CI TRASFERIAMO QUI
ORG:ENEMIES BOT
TEL;type=CELL;type=VOICE;waid=390000000000:+390000000000
URL:${link}
NOTE:${link}
END:VCARD`
            }
          ]
        },
        contextInfo: {
          mentionedJid: users
        }
      },
      { quoted: m }
    )

  }} catch (e) {
    console.error('[CONTACT TEST] ERRORE:', e)

   
  }
}

handler.help = ['testcontact']
handler.tags = ['owner']
handler.command = ['spamcontact']
handler.group = true
handler.owner = true

export default handler