import baileys from '@zervonex/baileys'

function parseJid(jid) {
    if (typeof jid !== 'string') return null

    const at = jid.indexOf('@')
    if (at === -1) return null

    const left = jid.slice(0, at)
    const server = jid.slice(at + 1)
    const colon = left.indexOf(':')

    if (colon === -1) {
        return {
            user: left,
            device: 0,
            server: server
        }
    }

    const user = left.slice(0, colon)
    const device = Number(left.slice(colon + 1))

    return {
        user: user,
        device: Number.isNaN(device) ? 0 : device,
        server: server
    }
}

// Rimuove l'eventuale suffisso del dispositivo.
function baseJid(jid) {
    const parsed = parseJid(jid)
    if (!parsed) return null

    return parsed.user + '@' + parsed.server
}

function getEntryJid(entry) {
    if (typeof entry === 'string') {
        return entry
    }

    if (!entry || typeof entry !== 'object') {
        return null
    }

    if (typeof entry.jid === 'string') {
        const parsed = parseJid(entry.jid)

        if (
            parsed &&
            entry.device !== undefined &&
            entry.device !== null &&
            Number(entry.device) !== 0 &&
            parsed.device === 0
        ) {
            return parsed.user + ':' +
                Number(entry.device) + '@' + parsed.server
        }

        return entry.jid
    }

    if (entry.user && entry.server) {
        const device = Number(entry.device || 0)
        const suffix = device ? ':' + device : ''

        return String(entry.user) + suffix +
            '@' + String(entry.server)
    }

    return null
}

function participantAliases(participant) {
    if (typeof participant === 'string') {
        const key = baseJid(participant)
        return key ? [key] : []
    }

    if (!participant || typeof participant !== 'object') {
        return []
    }

    const fields = [
        participant.id,
        participant.jid,
        participant.phoneNumber,
        participant.lid,
        participant.pn,
        participant.phone_number
    ]

    return [...new Set(
        fields
            .filter(function(value) {
                return typeof value === 'string'
            })
            .map(baseJid)
            .filter(Boolean)
    )]
}

function getMentionJid(participant) {
    if (typeof participant === 'string') {
        return baseJid(participant)
    }

    if (!participant || typeof participant !== 'object') {
        return null
    }

    const preferred =
        participant.id ||
        participant.jid ||
        participant.lid ||
        participant.phoneNumber ||
        participant.pn

    return baseJid(preferred)
}

let handler = async function(m, { conn }) {
    if (!m.isGroup) {
        return m.reply('Usa questo comando in un gruppo.')
    }

    if (typeof conn.getUSyncDevices !== 'function') {
        return m.reply(
            '❌ Questa versione non espone getUSyncDevices().'
        )
    }

    await m.reply(
        '🔎 Recupero le richieste di accesso al gruppo e analizzo i dispositivi...'
    )

    try {
        // Recupera la lista delle richieste in sospeso per entrare nel gruppo
        let pendingRequests = []
        try {
            if (typeof conn.groupRequestParticipantsList === 'function') {
                pendingRequests = await conn.groupRequestParticipantsList(m.chat)
            } else if (typeof conn.groupFetchAllParticipating === 'function') {
                // Metodo alternativo comune in alcune versioni
                const requests = await conn.groupRequestParticipantsList(m.chat).catch(() => [])
                pendingRequests = requests || []
            }
        } catch (err) {
            console.log('[DEVICES] Impossibile recuperare le richieste tramite groupRequestParticipantsList:', err)
        }

        if (!Array.isArray(pendingRequests) || !pendingRequests.length) {
            return m.reply('❌ Non ci sono richieste in sospeso per entrare in questo gruppo.')
        }

        const groupParticipants = pendingRequests

        const jids = [
            ...new Set(
                groupParticipants
                    .map(function(p) {
                        return typeof p === 'string' ? p : p && (p.id || p.jid)
                    })
                    .filter(function(jid) {
                        return typeof jid === 'string' &&
                            jid.includes('@')
                    })
            )
        ]

        if (!jids.length) {
            return m.reply(
                '❌ Non ho trovato JID utilizzabili tra le richieste in sospeso.'
            )
        }

        const participantByAlias = new Map()

        for (const participant of groupParticipants) {
            const mentionJid = getMentionJid(participant)

            if (!mentionJid) continue

            for (const alias of participantAliases(participant)) {
                participantByAlias.set(alias, participant)
            }
        }

        console.log('[DEVICES] Richieste inviate a USync:', jids)

        const devices = await conn.getUSyncDevices(
            jids,
            false,
            false
        )

        console.log('[DEVICES] Risposta USync:', devices)

        if (!Array.isArray(devices)) {
            return m.reply(
                '❌ USync ha restituito un formato inatteso.'
            )
        }

        const accounts = new Map()

        for (const entry of devices) {
            const jid = getEntryJid(entry)
            if (!jid) continue

            const parsed = parseJid(jid)
            const key = baseJid(jid)

            if (!parsed || !key) continue

            if (!accounts.has(key)) {
                accounts.set(key, {
                    key: key,
                    devices: new Map()
                })
            }

            const account = accounts.get(key)
            const deviceKey = String(parsed.device)

            if (!account.devices.has(deviceKey)) {
                account.devices.set(deviceKey, {
                    device: parsed.device,
                    jid: jid
                })
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
                if (account.devices.size >= 2) {
                    unresolvedAccounts++
                }
                continue
            }

            const mentionJid = getMentionJid(participant)

            if (!mentionJid) {
                if (account.devices.size >= 2) {
                    unresolvedAccounts++
                }
                continue
            }

            if (!resolvedAccounts.has(mentionJid)) {
                resolvedAccounts.set(mentionJid, {
                    mentionJid: mentionJid,
                    participant: participant,
                    devices: new Map()
                })
            }

            const resolved = resolvedAccounts.get(mentionJid)

            for (const device of account.devices.values()) {
                const deviceKey = String(device.device)

                if (!resolved.devices.has(deviceKey)) {
                    resolved.devices.set(deviceKey, device)
                }
            }
        }

        const multiple = [
            ...resolvedAccounts.values()
        ].filter(function(account) {
            return account.devices.size >= 2
        })

        if (!multiple.length) {
            let result =
                '📱 *ANALISI RICHIESTE DI ACCESSO*\n\n' +
                '👥 Richieste analizzate: ' + jids.length + '\n' +
                '✅ Nessun utente in attesa associato a 2 o più dispositivi distinti.'

            if (unresolvedAccounts) {
                result +=
                    '\n\n⚠️ Account multipli non associabili con certezza: ' +
                    unresolvedAccounts
            }

            return conn.sendMessage(
                m.chat,
                { text: result },
                { quoted: m }
            )
        }

        const mentions = []
        const mentioned = new Set()

        let text =
            '📱 *RICHIESTE CON DISPOSITIVI MULTIPLI*\n\n' +
            '👥 Richieste analizzate: ' + jids.length + '\n' +
            '⚠️ Utenti identificati: ' + multiple.length + '\n\n'

        for (const account of multiple) {
            const mentionJid = account.mentionJid
            const parsed = parseJid(mentionJid)

            if (!parsed) continue

            text +=
                '👤 @' + parsed.user + '\n' +
                '📱 ' + account.devices.size +
                ' dispositivi rilevati\n\n'

            if (!mentioned.has(mentionJid)) {
                mentions.push(mentionJid)
                mentioned.add(mentionJid)
            }
        }

        text += '━━━━━━━━━━━━━━━━\n'
        text += 'ℹ️ Verifica effettuata tramite USync sulle richieste pendenti.'

        if (unresolvedAccounts) {
            text +=
                '\n\n⚠️ Altri account non associabili con certezza: ' +
                unresolvedAccounts
        }

        return conn.sendMessage(
            m.chat,
            {
                text: text,
                mentions: mentions
            },
            {
                quoted: m
            }
        )

    } catch (e) {
        console.error('[DEVICES]', e)

        return m.reply(
            '❌ Errore durante il controllo delle richieste:\n\n' +
            (e && e.stack ? e.stack : String(e))
        )
    }
}

handler.help = ['pendingdevices', 'requestdevices']
handler.tags = ['owner']
handler.command = ['pendingdevices', 'requestdevices', 'reqdevices']
handler.admin = true

export default handler
