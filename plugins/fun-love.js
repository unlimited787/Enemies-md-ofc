let handler = async (m, { conn, command, text }) => {
    // Ricava il JID dalla menzione, dal messaggio citato o dal testo inserito
    let who = m.mentionedJid[0] 
        ? m.mentionedJid[0] 
        : m.quoted 
            ? m.quoted.sender 
            : text 
                ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' 
                : null

    if (!who) return m.reply('Inserisci il nome, scrivi il numero o tagga una persona!')

    let love = `𝐂𝐀𝐋𝐂𝐎𝐋𝐀𝐓𝐎𝐑𝐄 𝐃𝐈 𝐀𝐌𝐎𝐑𝐄 ❤️
Affinità tra @${who.split('@')[0]} e te: ${Math.floor(Math.random() * 101)}%`.trim()

    m.reply(love, null, { mentions: [who] })
}

handler.help = ['love']
handler.tags = ['fun']
handler.command = /^(love|amore)$/i

export default handler