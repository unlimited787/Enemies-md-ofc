let handler = async (m, { conn }) => {
    if (!m.quoted) throw '⚠️ Rispondi al messaggio che vuoi eliminare.';

    try {
        const quotedKey = m.quoted.key || m.quoted.vM?.key;

        if (!quotedKey?.id) {
            throw new Error('Quoted key non disponibile');
        }

        const key = {
            remoteJid: quotedKey.remoteJid || m.chat,
            fromMe: !!quotedKey.fromMe,
            id: quotedKey.id
        };

        if (m.isGroup) {
            key.participant =
                quotedKey.participant ||
                m.quoted.participantLid ||
                m.quoted.sender;
        }

        await conn.sendMessage(m.chat, {
            delete: key
        });

    } catch (e) {
        console.error('[DEL ERROR]', e);

        try {
            const key = m.quoted.vM?.key;

            if (!key?.id) {
                throw new Error('vM key non disponibile');
            }

            await conn.sendMessage(m.chat, {
                delete: {
                    remoteJid: key.remoteJid || m.chat,
                    fromMe: !!key.fromMe,
                    id: key.id,
                    ...(m.isGroup && key.participant
                        ? { participant: key.participant }
                        : {})
                }
            });

        } catch (e2) {
            console.error('[DEL FALLBACK ERROR]', e2);
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