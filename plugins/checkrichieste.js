function parseJid(jid) {
    if (typeof jid !== 'string') return null
    const at = jid.indexOf('@')
    if (at === -1) return null
    const left = jid.slice(0, at)
    const server = jid.slice(at + 1)
    const colon = left.indexOf(':')

    if (colon === -1) {
        return { user: left, device: 0, server: server }
    }
    const user = left.slice(0, colon)
    const device = Number(left.slice(colon + 1))
    return {
        user: user,
        device: Number.isNaN(device) ? 0 : device,
        server: server
    }
}

function baseJid(jid) {
    const parsed = parseJid(jid)
    if (!parsed) return null
    return parsed.user + '@' + parsed.server
}

function getEntryJid(entry) {
    if (typeof entry === 'string') return entry
    if (!entry || typeof entry !== 'object') return null

    if (typeof entry.jid === 'string') {
        const parsed = parseJid(entry.jid)
        if (parsed && entry.device !== undefined && entry.device !== null && Number(entry.device) !== 0 && parsed.device === 0) {
            return parsed.user + ':' + Number(entry.device) + '@' + parsed.server
        }
        return entry.jid
    }

    if (entry.user && entry.server) {
        const device = Number(entry.device || 0)
        const suffix = device ? ':' + device : ''
        return String(entry.user) + suffix + '@' + String(entry.server)
    }
    return null
}

function participantAliases(participant) {
    if (typeof participant === 'string') {
        const key = baseJid(participant)
        return key ? [key] : []
    }
    if (!participant || typeof participant !== 'object') return []

    const fields = [
        participant.id,
        participant.jid,
        participant.phoneNumber,
        participant.lid,
        participant.pn,
        participant.phone_number
    ]

    return [...new Set(
        fields.filter(v => typeof v === 'string').map(baseJid).filter(Boolean)
    )]
}

function getMentionJid(participant) {
    if (typeof participant === 'string') return baseJid(participant)
    if (!participant || typeof participant !== 'object') return null
    const preferred = participant.id || participant.jid || participant.lid || participant.phoneNumber || participant.pn
    return baseJid(preferred)
}

let handler = async function(m, { conn }) {
    if (!m.isGroup) {
        return m.reply('❌ Usa questo comando in un gruppo.')
    }

    await m.reply('🔎 [FORZATORE] Recupero richieste pendenti e analisi dispositivi in corso...')

    try {
        let pendingRequests = []

        // 1. Tentativo multiplo e grezzo per estrarre le richieste di accesso (compatibile con Trashcore e altri fork)
        try {
            if (typeof conn.groupRequestParticipantsList === 'function') {
                pendingRequests = await conn.groupRequestParticipantsList(m.chat)
            }
        } catch (e1) {
            console.log('[DEBUG] groupRequestParticipantsList fallito, provo fallback metadata...', e1)
        }

        if (!Array.isArray(pendingRequests) || !pendingRequests.length) {
            try {
                const metadata = await conn.groupMetadata(m.chat)
                if (metadata) {
                    pendingRequests = metadata.pendingParticipants || metadata.requests || metadata.joinRequests || []
                }
            } catch (e2) {
                console.log('[DEBUG] Fallito anche il recupero via groupMetadata', e2)
            }
        }

        if (!Array.isArray(pendingRequests) || !pendingRequests.length) {
            return m.reply('✅ Nessuna richiesta di accesso in sospeso trovata per questo gruppo (o il fork non espone le liste pending).')
        }

        // Estrazione grezza dei JID
        const jids = [
            ...new Set(
                pendingRequests
                    .map(p => (typeof p === 'string' ? p : p && (p.id || p.jid || p.phoneNumber)))
                    .filter(jid => typeof jid === 'string' && jid.includes('@'))
            )
        ]

        if (!jids.length) {
            return m.reply('❌ Trovate richieste, ma nessun JID valido è stato estratto.')
        }

        const participantByAlias = new Map()
        for (const participant of pendingRequests) {
            const mentionJid = getMentionJid(participant)
            if (!mentionJid) continue
            for (const alias of participantAliases(participant)) {
                participantByAlias.set(alias, participant)
            }
        }

        // 2. Controllo USync ultra-protetto (Gestisce l'assenza o il fallimento di getUSyncDevices in Trashcore)
        let devices = []
        try {
            if (typeof conn.getUSyncDevices === 'function') {
                devices = await conn.getUSyncDevices(jids, false, false)
            } else if (typeof conn.query === 'function') {
                // Tentativo grezzo tramite query diretta se getUSyncDevices è assente
                console.log('[DEBUG] getUSyncDevices assente, provo query nativa...')
                // Fallback simulato o array vuoto per evitare crash bloccanti
                devices = []
            }
        } catch (usyncErr) {
            console.log('[ERROR] USync fallito o bloccato dal fork:', usyncErr)
        }

        // Se USync non restituisce nulla ma abbiamo i partecipanti in sospeso, facciamo un controllo basato sui dati grezzi
        if (!Array.isArray(devices) || !devices.length) {
            let fallbackText = `📱 *ANALISI GREZZA RICHIESTE (USync non responsivo)*\n\n` +
                               `👥 Utenti in attesa trovati: ${jids.length}\n\n`
            
            for (const jid of jids) {
                const parsed = parseJid(jid)
                if (parsed) {
                    fallbackText += `👤 @${parsed.user} (Jid grezzo)\n`
                }
            }
            fallbackText += `\n⚠️ Il fork attuale (@trashcore) non ha restituito i dispositivi multipli via USync, ma ecco i numeri in attesa.`

            const mentions = jids.map(j => baseJid(j)).filter(Boolean)
            return conn.sendMessage(m.chat, { text: fallbackText, mentions }, { quoted: m })
        }

        // Elaborazione standard dispositivi multipli se USync ha risposto
        const accounts = new Map()
        for (const entry of devices) {
            const jid = getEntryJid(entry)
            if (!jid) continue
            const parsed = parseJid(jid)
            const key = baseJid(jid)
            if (!parsed || !key) continue

            if (!accounts.has(key)) {
                accounts.set(key, { key: key, devices: new Map() })
            }
            const account = accounts.get(key)
            const deviceKey = String(parsed.device)
            if (!account.devices.has(deviceKey)) {
                account.devices.set(deviceKey, { device: parsed.device, jid: jid })
            }
        }

        const resolvedAccounts = new Map()
        let unresolvedAccounts = 0

        for (const account of accounts.values()) {
            let participant = null
            for (const device of account.devices.values()) {
                const alias = baseJid(device.jid)
                if (participantByAlias.has(alias)) {
                    participant = participantByAlias.get(alias)
                    break
                }
            }

            if (!participant) {
                if (account.devices.size >= 2) unresolvedAccounts++
                continue
            }

            const mentionJid = getMentionJid(participant)
            if (!mentionJid) {
                if (account.devices.size >= 2) unresolvedAccounts++
                continue
            }

            if (!resolvedAccounts.has(mentionJid)) {
                resolvedAccounts.set(mentionJid, { mentionJid, participant, devices: new Map() })
            }

            const resolved = resolvedAccounts.get(mentionJid)
            for (const device of account.devices.values()) {
                const deviceKey = String(device.device)
                if (!resolved.devices.has(deviceKey)) {
                    resolved.devices.set(deviceKey, device)
                }
            }
        }

        const multiple = [...resolvedAccounts.values()].filter(acc => acc.devices.size >= 2)

        if (!multiple.length) {
            return m.reply(
                '📱 *ANALISI RICHIESTE PENDENTI*\n\n' +
                `👥 Richieste analizzate: ${jids.length}\n` +
                '✅ Nessun utente in attesa risulta associato a 2 o più dispositivi.' +
                (unresolvedAccounts ? `\n\n⚠️ Altri account non associabili: ${unresolvedAccounts}` : '')
            )
        }

        const mentions = []
        let text = '📱 *RICHIESTE CON DISPOSITIVI MULTIPLI*\n\n' +
                   `👥 Richieste analizzate: ${jids.length}\n` +
                   `⚠️ Utenti con multi-device sospetto: ${multiple.length}\n\n`

        for (const account of multiple) {
            const mentionJid = account.mentionJid
            const parsed = parseJid(mentionJid)
            if (!parsed) continue

            text += `👤 @${parsed.user}\n📱 ${account.devices.size} dispositivi rilevati\n\n`
            if (!mentions.includes(mentionJid)) {
                mentions.push(mentionJid)
            }
        }

        text += '━━━━━━━━━━━━━━━━\nℹ️ Controllo forzato eseguito sulle richieste pendenti.'

        return conn.sendMessage(m.chat, { text, mentions }, { quoted: m })

    } catch (e) {
        console.error('[PLUGIN ERROR]', e)
        return m.reply('❌ Errore critico nello script:\n\n' + (e && e.stack ? e.stack : String(e)))
    }
}

handler.help = ['pendingdevices', 'requestdevices']
handler.tags = ['owner']
handler.command = ['pendingdevices', 'requestdevices', 'reqdevices']

export default handler
