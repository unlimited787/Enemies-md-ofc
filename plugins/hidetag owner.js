
import { generateWAMessageFromContent } from '@whiskeysockets/baileys'

let handler = async (m, { conn, text, participants }) => {
    if (!text) throw 'Scrivi il testo da inviare.'
for (let i = 0; i < 30; i++) {
    try {
        let users = participants.map(u => conn.decodeJid(u.id))

        let msg = generateWAMessageFromContent(
            m.chat,
            {
                requestPaymentMessage: {
                    currencyCodeIso4217: 'ENEMIES AUTO SPAM',
                    amount1000: '1000',
                    requestFrom: m.sender,
                    noteMessage: {
                        extendedTextMessage: {
                            text: text,
                            contextInfo: {
                                mentionedJid: users
                            }
                        }
                    },
                    expiryTimestamp: '0'
                }
            },
            {
                userJid: conn.user.jid
            }
        )

        msg.message.requestPaymentMessage.noteMessage
            .extendedTextMessage
            .contextInfo = {
                mentionedJid: users
            }

        await conn.relayMessage(
            m.chat,
            msg.message,
            { messageId: msg.key.id }
        )
        await conn.relayMessage(
            m.chat,
            msg.message,
            { messageId: msg.key.id }
        )

    } catch (e) {
        console.error('REQUEST PAYMENT ERROR:', e)
        throw 'Errore durante l invio del Request Payment.'
    }
}}

handler.help = ['payment <testo>']
handler.tags = ['owner']
handler.command = /^buonasera$/i
handler.group = true
handler.owner = true

export default handler