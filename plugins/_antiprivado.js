
function normalizeJid(jid) {
    if (typeof jid !== 'string' || !jid.includes('@')) {
        throw new Error('JID non valido')
    }

    const at = jid.lastIndexOf('@')
    return `${jid.slice(0, at).split(':')[0]}${jid.slice(at)}`
}

async function updateBlockStatusFix(conn, jid, action = 'block') {
    if (!['block', 'unblock'].includes(action)) {
        throw new Error('no')
    }

    if (typeof conn.sendNode !== 'function') {
        throw new Error(
            '.'
        )
    }

    const target = normalizeJid(jid)
    const isLid = /@(lid|hosted\.lid)$/.test(target)
    const mapping = conn.signalRepository?.lidMapping

    let lid
    let pnJid

    if (isLid) {
        lid = target

        if (action === 'block') {
            const pn = await mapping?.getPNForLID?.(target)

            if (!pn) {
                throw new Error(
                    `Impossibile risolvere il numero associato al LID ${target}`
                )
            }

            pnJid = normalizeJid(pn)
        }
    } else if (/@(s\.whatsapp\.net|hosted)$/.test(target)) {
        let mapped = await mapping?.getLIDForPN?.(target)

        if (!mapped && typeof conn.onWhatsApp === 'function') {
            const results = await conn.onWhatsApp(target)
            const contact = Array.isArray(results)
                ? results.find(item => item?.exists && item?.lid)
                : null

            mapped = contact?.lid
        }

        if (!mapped) {
            throw new Error(
                `Mapping LID non trovato per ${target}. Impossibile completare il blocco aggiornato.`
            )
        }

        lid = normalizeJid(mapped)

        if (action === 'block') {
            pnJid = target
        }
    } else {
        throw new Error(`Tipo di JID non supportato: ${target}`)
    }

    const attrs = {
        action,
        jid: lid
    }

    if (action === 'block') {
        attrs.pn_jid = pnJid
    }

    await conn.sendNode({
        tag: 'iq',
        attrs: {
            id: typeof conn.generateMessageTag === 'function'
                ? conn.generateMessageTag()
                : `block_${Date.now()}`,
            xmlns: 'blocklist',
            to: 's.whatsapp.net',
            type: 'set'
        },
        content: [
            {
                tag: 'item',
                attrs
            }
        ]
    })

    if (typeof conn.fetchBlocklist !== 'function') {
        throw new Error(
            'Richiesta inviata, ma fetchBlocklist non è disponibile per verificarne il risultato.'
        )
    }

    await new Promise(resolve => setTimeout(resolve, 500))

    const list = (await conn.fetchBlocklist()).map(normalizeJid)
    const candidates = [target, lid, pnJid].filter(Boolean)
    const found = candidates.some(value => list.includes(value))

    if (action === 'block' && !found) {
        throw new Error(
            'WhatsApp non conferma il blocco nella lista dei bloccati.'
        )
    }

    if (action === 'unblock' && found) {
        throw new Error(
            'Il contatto risulta ancora nella lista dei bloccati.'
        )
    }

    return true
}

export async function before(m, { conn, isOwner, isROwner }) {
    if (m.isBaileys && m.fromMe) return true
    if (m.isGroup) return false
    if (!m.message) return true

    const bot = global.db.data.settings[conn.user.jid] || {}

    if (bot.antiPrivate && !isOwner && !isROwner) {
        try {
            await updateBlockStatusFix(conn, m.chat, 'block')
        } catch (e) {
            console.error(
                '[ANTI-PRIVATO] Errore:',
                e?.output?.statusCode,
                e?.stack || e?.message || e
            )
        }
    }

    return false
}
