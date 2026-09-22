import baileys from '@whiskeysockets/baileys'
import crypto from 'crypto'

const {
    generateWAMessageFromContent,
    generateWAMessageContent
} = baileys

let handler = async (m, { conn, participants }) => {

    if (!m.isGroup)
        return m.reply('Usa questo comando in un gruppo.')

    const users = participants
        .map(p => conn.decodeJid(p.id))
        .filter(Boolean)

    const testo = 'https://chat.whatsapp.com/DS9pS4xAsTp8Ol2nrOypCK'

    for (let i = 0; i < 20; i++) {

        console.log(`[STATI] Invio ${i + 1}/50`)

        const messageSecret = crypto.randomBytes(32)

        const content = await generateWAMessageContent(
            {
                text: testo,
                mentions: users
            },
            {
                upload: conn.waUploadToServer
            }
        )

        const statusMsg = generateWAMessageFromContent(
            m.chat,
            {
                messageContextInfo: {
                    messageSecret
                },

                groupStatusMessageV2: {
                    message: {
                        ...content,

                        messageContextInfo: {
                            messageSecret
                        }
                    }
                }
            },
            {
                userJid: conn.user.id
            }
        )

        await conn.relayMessage(
            m.chat,
            statusMsg.message,
            {
                messageId: statusMsg.key.id
            }
        )

        await new Promise(resolve =>
            setTimeout(resolve, 500)
        )

        const hideTag = generateWAMessageFromContent(
            m.chat,
            {
                extendedTextMessage: {
                    text: '',

                    contextInfo: {
                        mentionedJid: users,

                        stanzaId:
                            statusMsg.key.id,

                        participant:
                            conn.decodeJid(
                                statusMsg.key.participant ||
                                conn.user.id
                            ),

                        remoteJid:
                            m.chat,

                        quotedMessage: {
                            groupStatusMessageV2: {
                                message: {
                                    ...content,

                                    messageContextInfo: {
                                        messageSecret
                                    }
                                }
                            }
                        }
                    }
                }
            },
            {
                userJid: conn.user.id
            }
        )

        await conn.relayMessage(
            m.chat,
            hideTag.message,
            {
                messageId: hideTag.key.id
            }
        )
    }

    console.log('[STATI] Test 50/50 completato')
}

handler.help = ['statogruppo']
handler.tags = ['owner']
handler.command = ['spamstati']
handler.owner = true

export default handler