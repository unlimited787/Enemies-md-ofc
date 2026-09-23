let handler = async (m, { conn, text, isOwner }) => {
    if (!isOwner) return;

    const linkRegex = /(?:https?:\/\/)?chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i;
    const match = String(text || '').match(linkRegex);

    if (!match) return;

    const code = match[1];

    const sleep = ms =>
        new Promise(resolve => setTimeout(resolve, ms));

    const cleanError = error => {
        if (!error) return 'Errore sconosciuto';

        return String(
            error?.message ||
            error?.output?.payload?.message ||
            error?.output?.statusCode ||
            error
        );
    };

    try {
        let groupJid = null;

        /*
         * 1. Tentativo normale.
         * Funziona con i normali gruppi tramite invite link.
         */
        try {
            if (typeof conn.groupAcceptInvite === 'function') {
                groupJid = await conn.groupAcceptInvite(code);
            }
        } catch (e) {
            console.log('[JOIN NORMAL]', cleanError(e));
        }

        if (groupJid) {
            return;
        }

        /*
         * 2. Recuperiamo le informazioni dell'invito.
         */
        let info = null;

        try {
            if (typeof conn.groupGetInviteInfo === 'function') {
                info = await conn.groupGetInviteInfo(code);
            }
        } catch (e) {
            console.log('[JOIN INFO]', cleanError(e));
        }

        const jid =
            info?.id ||
            info?.jid ||
            info?.groupJid ||
            info?.subject?.jid ||
            null;

        if (!jid || !String(jid).endsWith('@g.us')) {
            throw new Error(
                'WhatsApp non ha restituito il JID del gruppo tramite il link.'
            );
        }

        /*
         * 3. Tentativo interno.
         *
         * Il nodo viene inviato direttamente nello namespace
         * w:g2, bypassando gli helper pubblici del fork.
         */
        if (typeof conn.query === 'function') {
            const attempts = [
                {
                    tag: 'membership_approval_request',
                    attrs: {
                        jid
                    }
                },
                {
                    tag: 'membership_approval_request',
                    attrs: {
                        group: jid
                    }
                },
                {
                    tag: 'membership_approval_request',
                    attrs: {}
                }
            ];

            let lastError = null;

            for (const content of attempts) {
                try {
                    await conn.query({
                        tag: 'iq',
                        attrs: {
                            to: jid,
                            type: 'set',
                            xmlns: 'w:g2'
                        },
                        content: [content]
                    });

                    return;
                } catch (e) {
                    lastError = e;
                }

                await sleep(300);
            }

            if (lastError) {
                console.log(
                    '[JOIN REQUEST]',
                    cleanError(lastError)
                );
            }
        }

        /*
         * 4. Alcuni fork espongono direttamente il socket interno.
         */
        const socket =
            conn.ws ||
            conn.socket ||
            conn.sock ||
            null;

        if (socket && typeof socket.query === 'function') {
            try {
                await socket.query({
                    tag: 'iq',
                    attrs: {
                        to: jid,
                        type: 'set',
                        xmlns: 'w:g2'
                    },
                    content: [
                        {
                            tag: 'membership_approval_request',
                            attrs: {}
                        }
                    ]
                });

                return;
            } catch (e) {
                console.log(
                    '[JOIN SOCKET]',
                    cleanError(e)
                );
            }
        }

        /*
         * 5. Ultimo tentativo:
         * se il fork implementa un metodo non documentato.
         */
        const internalMethods = [
            'groupRequestJoin',
            'groupJoinRequest',
            'groupRequestJoinByInvite',
            'groupJoinByInvite',
            'groupJoin',
            'requestGroupJoin'
        ];

        for (const method of internalMethods) {
            if (typeof conn[method] !== 'function') continue;

            try {
                await conn[method](code);
                return;
            } catch (e) {
                console.log(
                    `[JOIN ${method}]`,
                    cleanError(e)
                );
            }
        }

        throw new Error(
            'Il fork Baileys non espone un metodo compatibile per creare la richiesta di ingresso.'
        );

    } catch (e) {
        console.error('[JOIN ERROR]', e);

        try {
            const owner =
                String(global.owner?.[1] || '')
                    .replace(/\D/g, '');

        } catch {}

        return;
    }
};

handler.help = ['join <chat.whatsapp.com>'];
handler.tags = ['owner'];
handler.command = ['join'];
handler.owner = true;

export default handler;
