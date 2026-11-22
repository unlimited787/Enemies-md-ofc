import { generateWAMessageFromContent } from '@trashcore/baileys'

const MEDIA_TYPES = new Set([
    'imageMessage',
    'videoMessage',
    'audioMessage',
    'documentMessage',
    'stickerMessage'
])

function isMedia(message) {
    return Boolean(message && MEDIA_TYPES.has(message.mtype))
}

function mediaMime(message) {
    return message?.mimetype || message?.msg?.mimetype || ''
}

function quotedText(message) {
    return String(
        message?.text ||
        message?.msg?.text ||
        message?.msg?.conversation ||
        message?.msg?.caption ||
        message?.message?.conversation ||
        message?.message?.extendedTextMessage?.text ||
        message?.message?.imageMessage?.caption ||
        message?.message?.videoMessage?.caption ||
        ''
    ).trim()
}

async function downloadMedia(conn, source) {
    if (typeof source?.download === 'function') return source.download()
    if (source?.msg && source?.mtype && typeof conn.downloadM === 'function') {
        return conn.downloadM(source.msg, source.mtype.replace(/Message$/i, ''))
    }
    return null
}

async function sendMediaWithMentions(conn, chat, source, users, caption, quoted) {
    const data = await downloadMedia(conn, source)
    if (!data) return false

    const type = source.mtype
    const mime = mediaMime(source)
    const base = { mentions: users }
    const options = { quoted }

    if (type === 'imageMessage') {
        await conn.sendMessage(chat, { image: data, caption, ...base }, options)
    } else if (type === 'videoMessage') {
        await conn.sendMessage(chat, { video: data, caption, mimetype: mime || 'video/mp4', ...base }, options)
    } else if (type === 'audioMessage') {
        await conn.sendMessage(chat, { audio: data, mimetype: mime || 'audio/mp4', ptt: Boolean(source.ptt), fileName: source.fileName || 'audio.mp3', ...base }, options)
    } else if (type === 'documentMessage') {
        await conn.sendMessage(chat, { document: data, mimetype: mime || 'application/octet-stream', fileName: source.fileName || 'document', caption, ...base }, options)
    } else if (type === 'stickerMessage') {
        await conn.sendMessage(chat, { sticker: data, ...base }, options)
    } else {
        return false
    }

    return true
}

async function relayText(conn, m, users, text) {
    const msg = generateWAMessageFromContent(
        m.chat,
        {
            extendedTextMessage: {
                text: text || '.hidetag',
                contextInfo: { mentionedJid: users }
            }
        },
        { userJid: conn.user.jid }
    )

    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id })
}

const handler = async (m, { conn, text, participants }) => {
    const users = (participants || [])
        .map(user => conn.decodeJid(user.id))
        .filter(Boolean)
    const caption = typeof text === 'string' ? text.trim() : ''

    // Supporta sia ".tag testo" rispondendo a un media sia ".tag" scritto
    // direttamente nella caption di una foto/video/audio/documento/sticker.
    let source = null
    if (m.quoted) {
        try {
            source = await m.getQuotedObj() || m.quoted
        } catch {
            source = m.quoted
        }
    } else if (isMedia(m)) {
        source = m
    }

    if (isMedia(source)) {
        // Se il comando non ha testo, conserva l'eventuale caption del media quotato.
        const mediaCaption = caption || quotedText(source)
        const sent = await sendMediaWithMentions(conn, m.chat, source, users, mediaCaption, m)
        if (sent) return
    }

    // Per un quoted testuale il contenuto quotato è il testo da inoltrare con
    // le menzioni; non bisogna ricadere nel generico ".hidetag".
    const textToSend = caption || quotedText(source)
    await relayText(conn, m, users, textToSend)
}

handler.command = /^(hidetag|notificar|tag)$/i
handler.group = true
handler.admin = true

export default handler
