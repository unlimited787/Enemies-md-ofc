let handler = async (m, { conn }) => {
    if (!m.quoted) throw '⚠️ Rispondi al messaggio che vuoi eliminare.';

    try {
        // Estrae la chiave originale del messaggio citato
        let key = {
            remoteJid: m.chat,
            fromMe: m.quoted.fromMe,
            id: m.quoted.id,
            ...(m.isGroup && { participant: m.quoted.sender })
        };

        await conn.sendMessage(m.chat, { delete: key });
    } catch (e) {
        // Fallback in caso di struttura messaggi diversa (es. Baileys vM)
        try {
            await conn.sendMessage(m.chat, { delete: m.quoted.vM.key });
        } catch {
            throw '❌ Non è stato possibile eliminare questo messaggio.';
        }
    }
};

handler.help = ['delete'];
handler.tags = ['group'];
handler.command = /^del(ete)?$/i;
handler.group = false;
handler.admin = true;
handler.botAdmin = true;

export default handler;