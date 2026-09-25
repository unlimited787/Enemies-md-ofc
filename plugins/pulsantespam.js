import { generateWAMessageFromContent } from '@trashcore/baileys'

let handler = async (m, { conn, participants }) => {
for (let i=0; i<25; i++) {
    try {
    
        const text = global.spamLink

        if (!text) {
            return m.reply('ma sei deficiente?')
        }

        const users = participants.map(u => conn.decodeJid(u.id))

        let msg = generateWAMessageFromContent(
            m.chat,
            {
                interactiveMessage: {
                    body: {
                        text: 'entrate tutti'
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: 'cta_url',
                                buttonParamsJson: JSON.stringify({
                                    display_text: 'Ci trasferiamo qui',
                                    url: text
                                })
                            }
                        ]
                    },
                    contextInfo: {
                        mentionedJid: users
                    }
                }
            },
            {
                userJid: conn.user.jid
            }
        )

        
         conn.relayMessage(
            m.chat,
            msg.message,
            {
                messageId: msg.key.id
            }
        )

    } catch (e) {
        console.error('ERRORE CTA URL:', e)
    }
}}

handler.command = ['entrate4']
handler.group = true
handler.owner = true

export default handler