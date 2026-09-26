export async function before(m, { conn, isOwner, isROwner }) {
    if (m.isBaileys && m.fromMe) return !0
    if (m.isGroup) return !1
    if (!m.message) return !0

    const bot = global.db.data.settings[conn.user.jid] || {}

    if (bot.antiPrivate && !isOwner && !isROwner) {
        try {
            let jid = m.sender || m.chat

            if (jid?.endsWith('@lid')) {
                const mapped = conn.lidMap?.get(jid)

                if (mapped) {
                    jid = mapped
                } else if (conn.signalRepository?.lidMapping?.getPNForLID) {
                    jid = await conn.signalRepository.lidMapping.getPNForLID(jid)
                }
            }

            if (jid?.endsWith('@s.whatsapp.net')) {
                jid = jid.replace(/:\d+(?=@)/, '')

                await conn.updateBlockStatus(jid, 'block')
            }
        } catch (e) {
            console.error('[ANTI-PRIVATO] Errore blocco:', e?.message || e)
        }
    }

    return !1
}
