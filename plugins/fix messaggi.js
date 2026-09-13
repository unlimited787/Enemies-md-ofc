
import {
    readdirSync,
    statSync,
    unlinkSync,
    existsSync,
    readFileSync,
    watch,
    rmSync,
    promises as fs
} from 'fs';

import path, { join } from 'path';

const handler = async (m, { conn }) => {

    if (global.conn.user.jid !== conn.user.jid) return;

    await conn.sendMessage(
        m.chat,
        { text: '🔧 Avvio fix messaggi...' },
        { quoted: m }
    );

    try {

        const sessionPath = './EnemiesSessione/';

        if (!existsSync(sessionPath)) {
            await conn.sendMessage(
                m.chat,
                { text: '❌ Cartella sessione non trovata.' },
                { quoted: m }
            );
            return;
        }

        /*
         * NON cancelliamo:
         * - creds.json
         * - pre-key-*
         * - session-*
         * - app-state-sync-key-*
         *
         * Eliminiamo solamente la memoria delle sender-key
         * del gruppo, che può causare "Waiting for this message".
         */

        const files = await fs.readdir(sessionPath);

        let deleted = 0;

        for (const file of files) {

            if (
                file.startsWith('sender-key-memory-') ||
                file.startsWith('sender-key-')
            ) {
                try {
                    await fs.unlink(path.join(sessionPath, file));
                    deleted++;
                } catch {}
            }
        }

        /*
         * Svuota anche eventuali cache interne di gruppo,
         * se presenti.
         */

        try {
            global.groupCache?.flushAll?.();
        } catch {}

        try {
            global.jidCache?.flushAll?.();
        } catch {}

        try {
            global.lidCache?.flushAll?.();
        } catch {}

        await conn.sendMessage(
            m.chat,
            {
                text:
                    `✅ Fix completato.\n\n` +
                    `🔑 Chiavi sender-key eliminate: ${deleted}\n` +
                    `♻️ Cache gruppo/JID/LID ripulite.\n\n` +
                    `Ora prova a inviare/ricevere nuovamente il messaggio.`
            },
            { quoted: m }
        );

    } catch (err) {

        console.error('[FIX MESSAGGI]', err);

        await conn.sendMessage(
            m.chat,
            {
                text: '❌ Errore durante il fix dei messaggi.'
            },
            { quoted: m }
        );
    }
};

handler.command = /^(fix)$/i;
handler.owner = true;

export default handler;

