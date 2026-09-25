import { generateWAMessageFromContent } from '@trashcore/baileys'
import * as fs from 'fs'

let handler = async (m, { conn, text, participants }) => {
    try {
        let users = participants.map(u => conn.decodeJid(u.id))
        let htextos = text || '.hidetag'

        if (m.quoted) {
            let quoted = await m.getQuotedObj()
            let qType = quoted.mtype

            if (quoted.message && quoted.message[qType]) {
                let content = quoted.message[qType]

                if (content.contextInfo) {
                    content.contextInfo = {
                        ...content.contextInfo,
                        mentionedJid: users
                    }
                } else {
                    content.contextInfo = {
                        mentionedJid: users
                    }
                }

                let msg = generateWAMessageFromContent(
                    m.chat,
                    {
                        [qType]: content
                    },
                    {
                        userJid: conn.user.jid
                    }
                )

                await conn.relayMessage(
                    m.chat,
                    msg.message,
                    {
                        messageId: msg.key.id
                    }
                )

                return
            }
        }

        let msg = generateWAMessageFromContent(
            m.chat,
            {
                extendedTextMessage: {
                    text: htextos,
                    contextInfo: {
                        mentionedJid: users
                    }
                }
            },
            {
                userJid: conn.user.jid
            }
        )

        await conn.relayMessage(
            m.chat,
            msg.message,
            {
                messageId: msg.key.id
            }
        )

    } catch {

        let users = participants.map(u => conn.decodeJid(u.id))
        let quoted = m.quoted ? m.quoted : m
        let mime = (quoted.msg || quoted).mimetype || ''
        let isMedia = /image|video|sticker|audio/.test(mime)
        let more = String.fromCharCode(8206)
        let masss = more.repeat(850)
        let htextos = `${text ? text : '.hidetag'}`

        if (isMedia && quoted.mtype === 'imageMessage' && htextos) {
            let mediax = await quoted.download?.()

            await conn.sendMessage(
                m.chat,
                {
                    image: mediax,
                    mentions: users,
                    caption: htextos
                },
                { quoted: m }
            )

        } else if (isMedia && quoted.mtype === 'videoMessage' && htextos) {
            let mediax = await quoted.download?.()

            await conn.sendMessage(
                m.chat,
                {
                    video: mediax,
                    mentions: users,
                    mimetype: 'video/mp4',
                    caption: htextos
                },
                { quoted: m }
            )

        } else if (isMedia && quoted.mtype === 'audioMessage' && htextos) {
            let mediax = await quoted.download?.()

            await conn.sendMessage(
                m.chat,
                {
                    audio: mediax,
                    mentions: users,
                    mimetype: 'audio/mp4',
                    fileName: 'Hidetag.mp3'
                },
                { quoted: m }
            )

        } else if (isMedia && quoted.mtype === 'stickerMessage' && htextos) {
            let mediax = await quoted.download?.()

            await conn.sendMessage(
                m.chat,
                {
                    sticker: mediax,
                    mentions: users
                },
                { quoted: m }
            )

        } else {
            await conn.relayMessage(
                m.chat,
                {
                    extendedTextMessage: {
                        text: `${masss}\n${htextos}\n`,
                        contextInfo: {
                            mentionedJid: users
                        }
                    }
                },
                {}
            )
        }
    }
}

handler.command = /^(hidetag|notificar|notify)$/i
handler.group = true
handler.admin = true

export default handler