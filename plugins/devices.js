import baileys from '@trashcore/baileys'

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
// Non converte mai un LID in un PN.
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

// Raccoglie tutti gli identificativi conosciuti
// del partecipante, comprese le coppie LID/PN.
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

// Usa come destinatario della menzione l'ID effettivo
// del partecipante restituito dai metadati del gruppo.
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

let handler = async function(m, { conn, participants }) {
    if (!m.isGroup) {
        return m.reply('Usa questo comando in un gruppo.')
    }

    if (typeof conn.getUSyncDevices !== 'function') {
        return m.reply(
            '❌ Questa versione non espone getUSyncDevices().'
        )
    }

    await m.reply(
        '🔎 Analizzo i dispositivi e associo gli account ' +
        'ai partecipanti del gruppo...'
    )

    try {
        // Preferiamo i metadati aggiornati, che possono contenere
        // sia id LID sia phoneNumber.
        let groupParticipants = Array.isArray(participants)
            ? participants
            : []

        try {
            const metadata = await conn.groupMetadata(m.chat)

            if (
                metadata &&
                Array.isArray(metadata.participants) &&
                metadata.participants.length
            ) {
                groupParticipants = metadata.participants
            }
        } catch (metadataError) {
            console.log(
                '[DEVICES] Uso i partecipanti forniti dal framework.'
            )
        }

        const jids = [
            ...new Set(
                groupParticipants
                    .map(function(p) {
                        return typeof p === 'string' ? p : p && p.id
                    })
                    .filter(function(jid) {
                        return typeof jid === 'string' &&
                            jid.includes('@')
                    })
            )
        ]

        if (!jids.length) {
            return m.reply(
                '❌ Non ho trovato JID utilizzabili nel gruppo.'
            )
        }

        // Indice: ciascun alias conduce al partecipante reale.
        const participantByAlias = new Map()

        for (const participant of groupParticipants) {
            const mentionJid = getMentionJid(participant)

            if (!mentionJid) continue

            for (const alias of participantAliases(participant)) {
                participantByAlias.set(alias, participant)
            }
        }

        console.log('[DEVICES] Partecipanti inviati a USync:', jids)

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

        // Primo raggruppamento per identità restituita da USync.
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

        /*
         * Secondo raggruppamento: uniamo le identità LID/PN
         * che rimandano allo stesso partecipante del gruppo.
         * Questo evita di contare la stessa persona due volte.
         */
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

        console.log(
            '[DEVICES] Account multipli associati:',
            multiple.length
        )

        if (!multiple.length) {
            let result =
                '📱 *ANALISI DISPOSITIVI*\n\n' +
                '👥 Partecipanti analizzati: ' + jids.length + '\n' +
                '✅ Nessun partecipante associato a 2 o più ' +
                'dispositivi distinti.'

            if (unresolvedAccounts) {
                result +=
                    '\n\n⚠️ Account multipli non associabili ' +
                    'con certezza a un partecipante: ' +
                    unresolvedAccounts
            }

            return conn.sendMessage(
                m.chat,
                { text: result },
                { quoted: m }
            )
        }

        // Costruiamo menzioni native: nessun JID completo
        // o indirizzo @lid viene stampato nel testo.
        const mentions = []
        const mentioned = new Set()

        let text =
            '📱 *ACCOUNT CON DISPOSITIVI MULTIPLI*\n\n' +
            '👥 Partecipanti analizzati: ' + jids.length + '\n' +
            '⚠️ Account identificati: ' + multiple.length + '\n\n'

        for (const account of multiple) {
            const mentionJid = account.mentionJid
            const parsed = parseJid(mentionJid)

            if (!parsed) continue

            // Il token @... viene associato alla menzione nativa.
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
        text += 'ℹ️ Verifica effettuata tramite USync.'

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
            '❌ Errore durante il controllo:\n\n' +
            (e && e.stack ? e.stack : String(e))
        )
    }
}

handler.help = ['devices']
handler.tags = ['owner']
handler.command = ['devices', 'devicecheck']
handler.admin = true

export default handler