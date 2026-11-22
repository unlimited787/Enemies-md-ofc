
import * as baileys from '@trashcore/baileys'

const downloadContentFromMessage =
    baileys.downloadContentFromMessage ||
    baileys.default?.downloadContentFromMessage

const handler = async (m, { conn }) => {
    if (!m.quoted) throw '*Rispondi a un messaggio View Once.*'

    if (typeof downloadContentFromMessage !== 'function') {
        throw '*downloadContentFromMessage non è disponibile nella versione di Baileys installata.*'
    }

    try {
        let msg = m.quoted.message || m.quoted.msg || m.quoted

        // Rimuove i wrapper dei messaggi
        const wrappers = [
            'viewOnceMessage',
            'viewOnceMessageV2',
            'viewOnceMessageV2Extension',
            'ephemeralMessage',
            'documentWithCaptionMessage'
        ]

        let attempts = 0

        while (msg && attempts++ < 10) {
            const wrapper = wrappers.find(key => msg[key]?.message)

            if (!wrapper) break

            msg = msg[wrapper].message
        }

        // Individua il media
        const type = Object.keys(msg || {}).find(key =>
            ['imageMessage', 'videoMessage', 'audioMessage'].includes(key)
        )

        if (!type) {
            throw new Error('Nessun media compatibile trovato nel messaggio citato.')
        }

        const media = msg[type]

        const mediaType = {
            imageMessage: 'image',
            videoMessage: 'video',
            audioMessage: 'audio'
        }[type]

        // Scarica il contenuto
        const stream = await downloadContentFromMessage(media, mediaType)

        const chunks = []

        for await (const chunk of stream) {
            chunks.push(chunk)
        }

        const buffer = Buffer.concat(chunks)

        if (!buffer.length) {
            throw new Error('Il buffer scaricato è vuoto.')
        }

        const caption = media.caption || ''

        // Invia nuovamente il contenuto
        switch (type) {
            case 'imageMessage':
                await conn.sendMessage(m.chat, {
                    image: buffer,
                    caption
                }, { quoted: m })
                break

            case 'videoMessage':
                await conn.sendMessage(m.chat, {
                    video: buffer,
                    caption
                }, { quoted: m })
                break

            case 'audioMessage':
                await conn.sendMessage(m.chat, {
                    audio: buffer,
                    mimetype: media.mimetype || 'audio/ogg; codecs=opus',
                    ptt: media.ptt || false
                }, { quoted: m })
                break
        }

    } catch (e) {
        console.error('[READ VIEW ONCE ERROR]', e)
        throw '*Non è stato possibile estrarre il View Once. Controlla i log per maggiori dettagli.*'
    }
}

handler.help = ['readviewonce']
handler.tags = ['tools']
handler.command = /^(vedi)$/i

export default handler
