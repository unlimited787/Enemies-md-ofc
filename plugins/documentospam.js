let handler = async (m, { conn, participants }) => {

    let users = participants.map(u => conn.decodeJid(u.id))
for (let u = 0; u < 50; u++) {
const text = global.spamLink

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

    await conn.sendMessage(
        m.chat,
        {
            document: Buffer.from(text),
            mimetype: 'text/plain',
            fileName: 'clicca qui',
            caption: 'ci trasferiamo qua',
            mentions: users
        },
        {
            quoted: fakegif
        }
    )}
}

handler.help = ['spamjp']
handler.tags = ['premium']
handler.command = ['entrate3']
handler.owner = true

export default handler

