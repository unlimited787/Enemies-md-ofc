export async function before(m, { conn, isOwner, isROwner }) {
    if (m.isBaileys && m.fromMe) return !0
    if (m.isGroup) return !1
    if (!m.message) return !0

    const bot = global.db.data.settings[conn.user.jid] || {}

    if (bot.antiPrivate && !isOwner && !isROwner) {
        try {
            const jid = m.chat

            console.log('[ANTI-PRIVATO] Tentativo blocco:', jid)

            await conn.updateBlockStatus(jid, 'block')

            console.log('[ANTI-PRIVATO] Bloccato:', jid)
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
