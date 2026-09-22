let handler = async (m, { conn, command, text }) => {
    let who = m.mentionedJid[0]
        ? m.mentionedJid[0]
        : m.quoted
            ? m.quoted.sender
            : text
                ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
                : null

    if (!who) return m.reply('Tagga una persona, rispondi a un messaggio oppure scrivi un numero!')

    let love = `*@${m.sender.split('@')[0]} ha abbracciato @${who.split('@')[0]} 🤗*`

    m.reply(love, null, {
        mentions: [m.sender, who]
    })
}

handler.help = ['abbraccio']
handler.tags = ['fun']
handler.command = /^(abbraccio)$/i

export default handler