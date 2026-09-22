import baileys from '@whiskeysockets/baileys'

const { downloadContentFromMessage } = baileys

const handler = async (m, { conn }) => {
    if (!m.quoted) throw '*Rispondi a un messaggio View Once.*'

    try {
        let msg = m.quoted.message || m.quoted

        if (msg.viewOnceMessage) {
            msg = msg.viewOnceMessage.message
        }

        if (msg.viewOnceMessageV2) {
            msg = msg.viewOnceMessageV2.message
        }

        if (msg.viewOnceMessageV2Extension) {
            msg = msg.viewOnceMessageV2Extension.message
        }

        let type = Object.keys(msg || {}).find(k =>
            /^(imageMessage|videoMessage|audioMessage)$/.test(k)
        )

        if (!type) {
            throw '*Il messaggio citato non contiene un media View Once supportato.*'
        }

        const media = msg[type]

        let mediaType

        if (type === 'imageMessage') {
            mediaType = 'image'
        } else if (type === 'videoMessage') {
            mediaType = 'video'
        } else {
            mediaType = 'audio'
        }

        const stream = await downloadContentFromMessage(media, mediaType)

        const chunks = []

        for await (const chunk of stream) {
            chunks.push(chunk)
        }

        const buffer = Buffer.concat(chunks)

        if (!buffer.length) {
            throw '*Il file scaricato è vuoto.*'
        }

        const caption = media.caption || ''

        if (type === 'imageMessage') {
            await conn.sendMessage(
                m.chat,
                {
                    image: buffer,
                    caption
                },
                { quoted: m }
            )
        }

        if (type === 'videoMessage') {
            await conn.sendMessage(
                m.chat,
                {
                    video: buffer,
                    caption
                },
                { quoted: m }
            )
        }

        if (type === 'audioMessage') {
            await conn.sendMessage(
                m.chat,
                {
                    audio: buffer,
                    mimetype: media.mimetype || 'audio/ogg; codecs=opus',
                    ptt: media.ptt || false
                },
                { quoted: m }
            )
        }

    } catch (e) {
        console.error('READ VIEW ONCE:', e)
        throw '*Non è stato possibile estrarre il View Once.*'
    }
}

handler.help = ['readviewonce']
handler.tags = ['tools']
handler.command = /^(vedi)$/i

export default handler