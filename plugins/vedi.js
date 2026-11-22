
import crypto from 'node:crypto'

const MEDIA_TYPES = {
    imageMessage: 'WhatsApp Image Keys',
    videoMessage: 'WhatsApp Video Keys',
    audioMessage: 'WhatsApp Audio Keys'
}

function findMedia(root) {
    const visited = new Set()

    function walk(value, depth = 0) {
        if (!value || typeof value !== 'object' || depth > 15 || visited.has(value)) {
            return null
        }

        visited.add(value)

        for (const [key, child] of Object.entries(value)) {
            if (MEDIA_TYPES[key] && child && typeof child === 'object') {
                return { type: key, media: child }
            }
        }

        for (const child of Object.values(value)) {
            const result = walk(child, depth + 1)
            if (result) return result
        }

        return null
    }

    return walk(root)
}

function deriveKeys(mediaKey, info) {
    const expanded = Buffer.from(
        crypto.hkdfSync(
            'sha256',
            mediaKey,
            Buffer.alloc(0),
            Buffer.from(info),
            112
        )
    )

    return {
        iv: expanded.subarray(0, 16),
        cipherKey: expanded.subarray(16, 48),
        macKey: expanded.subarray(48, 80)
    }
}

async function decryptMedia(media, type) {
    if (!media.mediaKey) {
        throw new Error('MediaKey non presente nel media individuato')
    }

    const mediaKey = Buffer.from(media.mediaKey)

    if (mediaKey.length !== 32) {
        throw new Error('MediaKey non valida')
    }

    const { iv, cipherKey, macKey } = deriveKeys(
        mediaKey,
        MEDIA_TYPES[type]
    )

    const url = media.url ||
        (media.directPath
            ? `https://mmg.whatsapp.net${media.directPath}`
            : null)

    if (!url) throw new Error('URL del media non disponibile')

    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`Errore HTTP ${response.status}`)
    }

    const encrypted = Buffer.from(await response.arrayBuffer())

    if (encrypted.length <= 10) {
        throw new Error('Media cifrato non valido')
    }

    const ciphertext = encrypted.subarray(0, -10)
    const receivedMac = encrypted.subarray(-10)

    const calculatedMac = crypto
        .createHmac('sha256', macKey)
        .update(iv)
        .update(ciphertext)
        .digest()
        .subarray(0, 10)

    if (!crypto.timingSafeEqual(receivedMac, calculatedMac)) {
        throw new Error('Verifica HMAC fallita')
    }

    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        cipherKey,
        iv
    )

    const buffer = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
    ])

    if (media.fileSha256) {
        const hash = crypto.createHash('sha256').update(buffer).digest()
        const expected = Buffer.from(media.fileSha256)

        if (
            expected.length !== hash.length ||
            !crypto.timingSafeEqual(hash, expected)
        ) {
            throw new Error('Verifica SHA256 fallita')
        }
    }

    return buffer
}

const handler = async (m, { conn }) => {
    if (!m.quoted) {
        throw '*Rispondi a un messaggio View Once.*'
    }

    try {
        const source = m.quoted.message || m.quoted.msg || m.quoted

        const found = findMedia(source)

        if (!found) {
            throw new Error('Nessuna immagine, video o audio trovato')
        }

        const { type, media } = found

        const buffer = await decryptMedia(media, type)

        const caption = media.caption || ''

        if (type === 'imageMessage') {
            await conn.sendMessage(m.chat, {
                image: buffer,
                caption
            }, { quoted: m })
        } else if (type === 'videoMessage') {
            await conn.sendMessage(m.chat, {
                video: buffer,
                caption
            }, { quoted: m })
        } else {
            await conn.sendMessage(m.chat, {
                audio: buffer,
                mimetype: media.mimetype || 'audio/ogg; codecs=opus',
                ptt: Boolean(media.ptt)
            }, { quoted: m })
        }

    } catch (error) {
        console.error('[READ VIEW ONCE]', error)
        throw `*Estrazione View Once fallita:*\n${error.message}`
    }
}

handler.help = ['readviewonce']
handler.tags = ['tools']
handler.command = /^(vedi)$/i

export default handler
