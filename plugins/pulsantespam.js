import { generateWAMessageFromContent } from '@whiskeysockets/baileys'


let handler = async (m, { conn }) => {
    try {
        let msg = generateWAMessageFromContent(
            m.chat,
            {
                interactiveMessage: {
                    body: {
                        text: ''
                    },
                    nativeFlowMessage: {
                        buttons: [
                            {
                                name: 'cta_url',
                                buttonParamsJson: JSON.stringify({
                                    display_text: 'Ci trasferiamo qui',
                                    url: 'https://chat.whatsapp.com/LEapDRbJMSEDD5jJGPwb1H'
                                })
                            }
                        ]
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

    } catch (e) {
        console.error('ERRORE CTA URL:', e)
        await conn.sendMessage(m.chat, {
            text: `Errore CTA URL:\n${e?.stack || e}`
        })
    }
}

handler.command = ['entrate4']
handler.group = true
handler.owner = true

export default handler