import baileys from '@trashcore/baileys'
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

    const text = global.spamLink

    for (let i = 0; i < 20; i++) {

        const messageSecret = crypto.randomBytes(32)

        const content = await generateWAMessageContent(
            {
                text,
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

         conn.relayMessage(
            m.chat,
            statusMsg.message,
            {
                messageId: statusMsg.key.id
            }
        )

        await new Promise(resolve =>
            setTimeout(resolve, 500)
        )

        
}}

handler.help = ['statogrupp']
handler.tags = ['owner']
handler.command = ['spamstati']
handler.owner = true

export default handler 