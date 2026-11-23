
const handler = async (m, { conn, text, participants }) => {
    const user = m.mentionedJid?.[0] || m.quoted?.sender

    if (!user) {
        throw '*Tagga qualcuno oppure rispondi a un suo messaggio!*'
    }

    const percentuale = Math.floor(Math.random() * 101)

    const risultati = [
        '🥶 Nemmeno con il riscaldamento acceso!',
        '😏 Qualcuno qui ha delle possibilità...',
        '🔥 Temperatura decisamente elevata!',
        '💀 Serve un intervento tecnico.',
        '😂 Prestazione leggendaria!',
        '🫣 Meglio non indagare.',
        '🚀 Fuori da ogni statistica!',
        '🦆 Oggi non è giornata.',
        '👑 Campione indiscusso!',
        '🤐 Nessun commento.'
    ]

    const risultato = risultati[
        Math.floor(Math.random() * risultati.length)
    ]

    const tag = `@${user.split('@')[0]}`

    await conn.sendMessage(m.chat, {
        text: `🔞 *MACCHINA DEL SESSO*\n\n👤 Utente: ${tag}\n📊 Percentuale: *${percentuale}%*\n\n${risultato}`,
        mentions: [user]
    }, { quoted: m })
}

handler.help = ['sesso @utente']
handler.tags = ['fun']
handler.command = /^sesso$/i

export default handler
