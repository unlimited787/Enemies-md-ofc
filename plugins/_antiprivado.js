export async function before(m, { conn, isAdmin, isBotAdmin, isOwner, isROwner }) {
    if (m.isBaileys && m.fromMe) return !0
    if (m.isGroup) return !1
    if (!m.message) return !0

    const chat = global.db.data.chats[m.chat]
    const bot = global.db.data.settings[this.user.jid] || {}

    if (bot.antiPrivate && !isOwner && !isROwner) {
        let jid = m.chat

        try {
            if (jid?.endsWith('@lid')) {
                const mapped = conn.lidMap?.get(jid)

                if (mapped) {
                    jid = mapped
                } else if (conn.signalRepository?.lidMapping?.getPNForLID) {
                    jid = await conn.signalRepository.lidMapping.getPNForLID(jid)
                }
            }

            if (jid && !jid.endsWith('@s.whatsapp.net')) {
                jid = jid.replace(/:\d+(?=@)/, '')
            }

            if (jid?.endsWith('@s.whatsapp.net')) {
                await conn.updateBlockStatus(jid, 'block')
            }
        } catch (e) {
            console.error('[ANTI-PRIVATO] Impossibile bloccare:', jid, e?.message || e)
        }
    }

    return !1
}