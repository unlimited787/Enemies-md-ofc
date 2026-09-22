import fs from 'fs'
import path from 'path'

let handler = async (m, { conn, participants }) => {

    if (!m.isGroup)
        return m.reply('Usa questo comando in un gruppo.')

    const imagePath = path.join(process.cwd(), 'link.png')

    if (!fs.existsSync(imagePath))
        return m.reply('❌ Non trovo link.png nella cartella del bot.')

    const users = participants
        .map(p => conn.decodeJid(p.id))
        .filter(Boolean)

    const image = fs.readFileSync(imagePath)

    for (let i = 0; i < 50; i++) {

        console.log(`[IMG-TEST] Invio ${i + 1}/50`)

        try {

            await conn.sendMessage(
                m.chat,
                {
                    image,
                    caption: 'entrate tutti',
                    mentions: users
                }
            )

            console.log(
                `[IMG-TEST] ${i + 1}/50 inviato`
            )

        } catch (e) {

            console.error(
                `[IMG-TEST] ERRORE ${i + 1}/50:`,
                e
            )

            break
        }

        await new Promise(resolve =>
            setTimeout(resolve, 500)
        )
    }

    console.log('[IMG-TEST] Test 50/50 completato')
}

handler.help = ['testimage']
handler.tags = ['owner']
handler.command = ['spamimage']
handler.owner = true

export default handler