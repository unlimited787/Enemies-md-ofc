let handler = async (m, { conn, participants }) => {

    let users = participants.map(u => conn.decodeJid(u.id))

    let fakegif = {
        key: {
            participant: '0@s.whatsapp.net',
            remoteJid: '6289643739077-1613049930@g.us'
        },
        message: {
            videoMessage: {
                title: 'lolibot',
                h: 'Hmm',
                seconds: '99999',
                gifPlayback: true,
                caption: '𝐄ИΞM𝕀Ξ𝐒 🛡️⃟🏴‍☠️ Auto spam ♨️',
                jpegThumbnail: false
            }
        }
    }

    let dunno = '𝐄ИΞM𝕀Ξ𝐒 SPΛM\nhttps://chat.whatsapp.com/LEapDRbJMSEDD5jJGPwb1H'

    await conn.sendMessage(
        m.chat,
        {
            document: Buffer.from(dunno),
            mimetype: 'text/plain',
            fileName: 'Enemies.txt',
            caption: dunno,
            mentions: users
        },
        {
            quoted: fakegif
        }
    )
}

handler.help = ['spamjp']
handler.tags = ['premium']
handler.command = ['entrate3']
handler.owner = true

export default handler

