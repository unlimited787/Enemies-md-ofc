
import crypto from 'node:crypto'

const HKDF_INFO = {
    imageMessage: 'WhatsApp Image Keys',
    videoMessage: 'WhatsApp Video Keys',
    audioMessage: 'WhatsApp Audio Keys'
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

function unwrapMessage(message) {
    const wrappers = [
        'ephemeralMessage',
        'viewOnceMessage',
        'viewOnceMessageV2',
        'viewOnceMessageV2Extension',
        'documentWithCaptionMessage'
    ]

    let msg = message
    let attempts = 0

    while (msg && attempts++ < 10) {
        const wrapper = wrappers.find(key =>
            msg[key]?.message
        )

        if (!wrapper) break

        msg = msg[wrapper].message
    }

    return msg
}

function getMediaUrl(media) {
    if (media.url) {
        return media.url
    }

    if (media.directPath) {
        return `https://mmg.whatsapp.net${media.directPath}`
    }

    throw new Error('URL e directPath non disponibili')
}

async function downloadAndDecrypt(media, type) {
    const mediaKey = Buffer.from(media.mediaKey)

    if (mediaKey.length !== 32) {
        throw new Error('MediaKey non valida')
    }

    const { iv, cipherKey, macKey } = deriveKeys(
        mediaKey,
        HKDF_INFO[type]
    )

    const url = getMediaUrl(media)

    const response = await fetch(url, {
        method: 'GET',
        redirect: 'follow'
    })

    if (!response.ok) {
        throw new Error(`Download HTTP fallito: ${response.status}`)
    }

    const encrypted = Buffer.from(await response.arrayBuffer())

    if (encrypted.length <= 10) {
        throw new Error('Contenuto cifrato troppo piccolo')
    }

    // Verifica hash del contenuto cifrato
    if (media.fileEncSha256) {
        const expectedHash = Buffer.from(media.fileEncSha256)
        const actualHash = crypto
            .createHash('sha256')
            .update(encrypted)
            .digest()

        if (
            expectedHash.length !== actualHash.length ||
            !crypto.timingSafeEqual(expectedHash, actualHash)
        ) {
            throw new Error('Hash del media cifrato non valido')
        }
    }

    // Separazione del MAC dagli ultimi 10 byte
    const ciphertext = encrypted.subarray(0, -10)
    const receivedMac = encrypted.subarray(-10)

    // Verifica HMAC-SHA256
    const calculatedMac = crypto
        .createHmac('sha256', macKey)
        .update(iv)
        .update(ciphertext)
        .digest()
        .subarray(0, 10)

    if (!crypto.timingSafeEqual(receivedMac, calculatedMac)) {
        throw new Error('Autenticazione HMAC fallita')
    }

    // Decifratura AES-256-CBC
    const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        cipherKey,
        iv
    )

    const decrypted = Buffer.concat([
        decipher.update(ciphertext),
        decipher.final()
    ])

    // Verifica hash del file originale
    if (media.fileSha256) {
        const expectedHash = Buffer.from(media.fileSha256)
        const actualHash = crypto
            .createHash('sha256')
            .update(decrypted)
            .digest()

        if (
            expectedHash.length !== actualHash.length ||
            !crypto.timingSafeEqual(expectedHash, actualHash)
        ) {
            throw new Error('Hash del file originale non valido')
        }
    }

    return decrypted
}

const handler = async (m, { conn }) => {
    if (!m.quoted) {
        throw '*Rispondi a un messaggio View Once.*'
    }

    try {
        const msg = unwrapMessage(
            m.quoted.message ||
            m.quoted.msg ||
            m.quoted
        )

        const type = Object.keys(msg || {}).find(key =>
            Object.hasOwn(HKDF_INFO, key)
        )

        if (!type) {
            throw new Error('Nessun media supportato trovato')
        }

        const media = msg[type]

        if (!media.mediaKey) {
            throw new Error('MediaKey assente')
        }

        const buffer = await downloadAndDecrypt(media, type)

        const caption = media.caption || ''

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
                    ptt: Boolean(media.ptt)
                }, { quoted: m })
                break
        }

    } catch (e) {
        console.error('[READ VIEW ONCE]', e)

        throw `*Errore durante l'estrazione:*\n${e.message}`
    }
}

handler.help = ['readviewonce']
handler.tags = ['tools']
handler.command = /^(vedi)$/i

export default handler
