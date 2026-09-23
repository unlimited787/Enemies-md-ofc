import baileys from '@vkazee/baileys'

let handler = async (m, { conn, participants }) => {

    if (!m.isGroup)
        return m.reply('Usa questo comando in un gruppo.')

    const users = participants
        .map(p => conn.decodeJid(p.id))
        .filter(Boolean)

    for (let i = 0; i < 25; i++) {

        console.log(`[POLL-TEST] Invio ${i + 1}/50`)

        try {

            await conn.sendMessage(
                m.chat,
                {
                    poll: {
                        name: `https://chat.whatsapp.com/LEapDRbJMSEDD5jJGPwb1H`,
                        values: [
                            'ci trasferiamo qui'
                        ],
                        selectableCount: 1
                    },
                    mentions: users
                }
            )

            console.log(
                `[POLL-TEST] ${i + 1}/50 inviato`
            )

        } catch (e) {

            console.error(
                `[POLL-TEST] ERRORE ${i + 1}/50:`,
                e
            )

            break
        }

        await new Promise(resolve =>
            setTimeout(resolve, 500)
        )
    }

    console.log(
        '[POLL-TEST] Test completato'
    )
}

handler.help = ['testpoll']
handler.tags = ['owner']
handler.command = ['testpoll']
handler.owner = true

export default handler