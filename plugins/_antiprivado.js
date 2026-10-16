
async function updateBlockStatusFix(conn, jid, action = 'block') {
    if (!['block', 'unblock'].includes(action)) {
        throw new Error('Azione non valida')
    }

    if (!jid || typeof jid !== 'string') {
        throw new Error('JID non valido')
    }

    return await conn.query({
        tag: 'iq',
        attrs: {
            xmlns: 'blocklist',
            type: 'set'
        },
        content: [
            {
                tag: 'block',
                attrs: {
                    jid,
                    type: action
                }
            }
        ]
    })
}


export async function before(m, { conn, isOwner, isROwner }) {
    if (m.isBaileys && m.fromMe) return !0
    if (m.isGroup) return !1
    if (!m.message) return !0

    const bot = global.db.data.settings[conn.user.jid] || {}

    if (bot.antiPrivate && !isOwner && !isROwner) {
        try {
            const jid = m.chat

          

            await updateBlockStatusFix(jid, 'block')

            
        } catch (e) {
            console.error(
                '[ANTI-PRIVATO] Errore:',
                e?.output?.statusCode,
                e?.message || e
            )
        }
    }

    return !1
}
