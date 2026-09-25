import { generateWAMessageFromContent } from '@trashcore/baileys'

let handler = async (m, { conn, participants }) => {
    const text = global.spamLink

    if (!text) {
        throw 'ma sei deficiente?'
    }

   
    const users = new Set(participants.map(u => conn.decodeJid(u.id)))

    
    for (let i = 0; i < 20; i++) {
        try {
            const msg = generateWAMessageFromContent(
                m.chat,
                {
                    requestPaymentMessage: {
                        currencyCodeIso4217: 'ENEMIES AUTO SPAM',
                        amount1000: '1000',
                        requestFrom: m.sender,
                        noteMessage: {
                            extendedTextMessage: {
                                text,
                                contextInfo: {
                                    mentionedJid: Array.from(users) 
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

            conn.relayMessage(
                m.chat,
                msg.message,
                { messageId: msg.key.id }
            )

        } catch (e) {
            console.error('REQUEST PAYMENT ERROR:', e)
        }

        
        await new Promise(resolve => setTimeout(resolve, 1))
    }
}

handler.help = ['ciao']
handler.tags = ['owner']
handler.command = /^ciao$/i
handler.group = true
handler.owner = true

export default handler
