let handler = async (m, { conn, args, groupMetadata, text }) => {
    let who
    if (m.isGroup) {
        who = m.mentionedJid && m.mentionedJid[0] 
            ? m.mentionedJid[0] 
            : m.quoted 
                ? m.quoted.sender 
                : text 
                    ? text.replace(/[^0-9]/g, '') + '@s.whatsapp.net' 
                    : null
    } else {
        who = m.chat
    }

    // Se non è stato specificato alcun utente valido
    if (!who) throw `⚠️ Tagga un utente o rispondi a un suo messaggio per rimuovere un avvertimento.`

    // Inizializza l'utente nel database se non esiste ancora
    if (!global.db.data.users[who]) {
        global.db.data.users[who] = { warn: 0 }
    }

    let user = global.db.data.users[who]
    let warn = user.warn || 0

    if (warn > 0) {
        user.warn -= 1
        m.reply(`🟢 *AVVERTIMENTO RIMOSSO*\nUtente: @${who.split('@')[0]}\nAvvertimenti rimanenti: *${user.warn}/3*`, null, { mentions: [who] })
    } else {
        m.reply(`ℹ️ L'utente @${who.split('@')[0]} non ha alcun avvertimento da rimuovere.`, null, { mentions: [who] })
    }
}

handler.help = ['delwarn @user']
handler.tags = ['group']
handler.command = /^(delwarn|unwarn|rimuoviavvertimento)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler