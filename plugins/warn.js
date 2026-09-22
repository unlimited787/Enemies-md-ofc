let war = 2

let handler = async (m, { conn, text, args, groupMetadata, usedPrefix, command }) => {      
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
    if (!who) throw `⚠️ Tagga un utente o rispondi a un suo messaggio per ammonirlo.`

    // Inizializza l'utente nel database se non esiste ancora
    if (!global.db.data.users[who]) {
        global.db.data.users[who] = { warn: 0 }
    }

    let user = global.db.data.users[who]
    let warn = user.warn || 0

    if (warn < war) {
        user.warn += 1
        m.reply(`⚠️ *AVVERTIMENTO*\nUtente: @${who.split('@')[0]}\nAvvertimenti: *${user.warn}/3*`, null, { mentions: [who] })
    } else if (warn >= war) {
        user.warn = 0
        m.reply(`⛔ *UTENTE RIMOSSO*\nL'utente @${who.split('@')[0]} ha raggiunto 3 avvertimenti ed è stato rimosso.`, null, { mentions: [who] })
        
        await time(1000)
        await conn.groupParticipantsUpdate(m.chat, [who], 'remove')
    }
}

handler.help = ['warn @user']
handler.tags = ['group']
handler.command = /^(ammonisci|avvertimento|warn|warning)$/i
handler.group = true
handler.admin = true
handler.botAdmin = true

export default handler

const time = async (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}