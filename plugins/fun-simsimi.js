
import baileys from '@trashcore/baileys'

function parseJid(jid) {
    if (typeof jid !== 'string') return null
    const at = jid.lastIndexOf('@')
    if (at < 1) return null
    const left = jid.slice(0, at)
    const server = jid.slice(at + 1)
    const colon = left.lastIndexOf(':')
    const user = colon < 0 ? left : left.slice(0, colon)
    const device = colon < 0 ? 0 : Number(left.slice(colon + 1))
    if (!user || !server) return null
    return { user, device: Number.isFinite(device) ? device : 0, server }
}

function normalizeEntries(entries) {
    if (!Array.isArray(entries)) return []
    const result = new Map()

    for (const entry of entries) {
        const jid = typeof entry === 'string' ? entry : entry?.jid
        const parsed = parseJid(jid)
        if (!parsed) continue

        const key = `${parsed.user}@${parsed.server}`
        if (!result.has(key)) {
            result.set(key, {
                user: parsed.user,
                server: parsed.server,
                devices: new Map()
            })
        }

        result.get(key).devices.set(parsed.device, jid)
    }

    return [...result.values()].map(account => ({
        user: account.user,
        server: account.server,
        devices: [...account.devices.entries()].map(([device, jid]) => ({
            device,
            jid
        }))
    }))
}

async function queryDevices(conn, jids) {
    if (typeof conn.getUSyncDevices === 'function') {
        return {
            method: 'getUSyncDevices',
            entries: await conn.getUSyncDevices(jids, false, false)
        }
    }

    if (typeof conn.executeUSyncQuery === 'function') {
        const USyncQuery = baileys.USyncQuery
        const USyncUser = baileys.USyncUser

        if (USyncQuery && USyncUser) {
            const query = new USyncQuery().withContext('interactive')

            if (typeof query.withDeviceProtocol !== 'function') {
                throw new Error('USyncQuery non espone withDeviceProtocol().')
            }

            query.withDeviceProtocol()

            if (typeof query.withLIDProtocol === 'function') {
                query.withLIDProtocol()
            }

            for (const jid of jids) {
                query.withUser(new USyncUser().withId(jid))
            }

            const response = await conn.executeUSyncQuery(query)
            const entries = []

            for (const item of response?.list || []) {
                const id = item.id
                const parsed = parseJid(id)
                if (!parsed) continue

                entries.push(id)

                for (const device of item.devices?.deviceList || []) {
                    entries.push(
                        `${parsed.user}:${device.id}@${parsed.server}`
                    )
                }
            }

            return { method: 'executeUSyncQuery', entries }
        }
    }

    throw new Error(
        'Trashcore non espone getUSyncDevices() né un executeUSyncQuery() utilizzabile con USyncQuery e USyncUser.'
    )
}

const handler = async (m, { conn, participants = [] }) => {
    if (!m.isGroup) {
        return m.reply('Usa questo comando in un gruppo.')
    }

    await m.reply('🔎 Controllo i dispositivi esposti da WhatsApp...')

    try {
        const jids = [...new Set(
            participants
                .map(p => p?.id)
                .filter(jid => typeof jid === 'string' && jid.includes('@'))
        )]

        if (!jids.length) {
            return m.reply('❌ Nessun JID valido trovato nei partecipanti.')
        }

        const { method, entries } = await queryDevices(conn, jids)

        if (!Array.isArray(entries)) {
            throw new Error('La query non ha restituito un array.')
        }

        const accounts = normalizeEntries(entries)
        const multiple = accounts.filter(account => account.devices.length >= 2)

        console.log('[DEVICES] Metodo:', method)
        console.log('[DEVICES] Partecipanti:', jids.length)
        console.log('[DEVICES] Risposta:', entries)
        console.log('[DEVICES] Account multipli:', multiple)

        if (!multiple.length) {
            return m.reply(
                `📱 *ANALISI DISPOSITIVI*\n\n` +
                `👥 Partecipanti inviati: ${jids.length}\n` +
                `🔧 Metodo: ${method}\n` +
                '✅ Nessun account con almeno 2 dispositivi rilevato nella risposta.'
            )
        }

        const mentions = []
        let text =
            '📱 *DISPOSITIVI MULTIPLI*\n\n' +
            `👥 Partecipanti inviati: ${jids.length}\n` +
            `🔧 Metodo: ${method}\n` +
            `⚠️ Account con almeno 2 dispositivi: ${multiple.length}\n\n`

        for (const account of multiple) {
            text += `👤 ${account.user}@${account.server}\n`
            text += `📱 *${account.devices.length} dispositivi rilevati*\n`

            for (const device of account.devices) {
                text += `   └─ Device ${device.device}\n`
            }

            text += '\n'

            if (account.server === 's.whatsapp.net') {
                mentions.push(`${account.user}@s.whatsapp.net`)
            }
        }

        text += '━━━━━━━━━━━━━━━━\n'
        text += 'ℹ️ Il numero di dispositivi non dimostra da solo l’uso di un bot.'

        return conn.sendMessage(
            m.chat,
            { text, mentions },
            { quoted: m }
        )
    } catch (error) {
        console.error('[DEVICES]', error)

        return m.reply(
            '❌ *Controllo non disponibile*\n\n' +
            `${error?.message || error}\n\n` +
            'La libreria potrebbe non esporre le API USync necessarie.'
        )
    }
}

handler.help = ['devices']
handler.tags = ['owner']
handler.command = ['devices', 'devicecheck']
handler.owner = true

export default handler
