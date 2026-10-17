import baileys from '@whiskeysockets/baileys'

/*
 * Estrae user e device da un JID senza usare jidDecode().
 *
 * Esempi:
 *
 * 123456789@s.whatsapp.net
 *       user   = 123456789
 *       device = 0
 *
 * 123456789:2@s.whatsapp.net
 *       user   = 123456789
 *       device = 2
 *
 * 123456789@lid
 *       user   = 123456789
 *       device = 0
 */
function parseJid(jid) {

    if (typeof jid !== 'string')
        return null

    const at = jid.indexOf('@')

    if (at === -1)
        return null

    const left = jid.slice(0, at)
    const server = jid.slice(at + 1)

    const colon = left.indexOf(':')

    if (colon === -1) {

        return {
            user: left,
            device: 0,
            server
        }
    }

    const user = left.slice(0, colon)
    const deviceString = left.slice(colon + 1)

    const device = Number(deviceString)

    return {
        user,
        device: Number.isNaN(device)
            ? 0
            : device,
        server
    }
}


let handler = async (m, { conn, participants }) => {

    if (!m.isGroup)
        return m.reply('Usa questo comando in un gruppo.')

    if (typeof conn.getUSyncDevices !== 'function') {

        return m.reply(
            '❌ La tua versione di WhiskeySockets non espone getUSyncDevices().'
        )
    }

    await m.reply(
        '🔎 Controllo i dispositivi degli utenti del gruppo...'
    )

    try {

        /*
         * IMPORTANTE:
         *
         * Non tocchiamo i JID.
         * Non usiamo jidNormalizedUser().
         * Non usiamo jidDecode().
         *
         * Passiamo direttamente gli ID forniti
         * dal tuo sistema participants.
         */

        const jids = [
            ...new Set(
                participants
                    .map(p => p?.id)
                    .filter(
                        jid =>
                            typeof jid === 'string' &&
                            jid.includes('@')
                    )
            )
        ]

        if (!jids.length) {

            return m.reply(
                '❌ Non ho trovato JID utilizzabili nei partecipanti.'
            )
        }

        console.log(
            '[DEVICES] JID inviati a USync:',
            jids
        )


        /*
         * Chiediamo a WhatsApp i dispositivi.
         *
         * false = niente cache
         * false = non ignorare il device 0
         */

        const devices = await conn.getUSyncDevices(
            jids,
            false,
            false
        )


        console.log(
            '[DEVICES] Risposta USync:',
            devices
        )


        if (!Array.isArray(devices)) {

            return m.reply(
                '❌ USync ha restituito un formato inatteso:\n\n' +
                String(devices)
            )
        }


        /*
         * Raggruppiamo i dispositivi.
         *
         * NON assumiamo che l'ID restituito
         * corrisponda necessariamente al numero.
         */

        const accounts = new Map()


        for (const entry of devices) {

            if (!entry)
                continue


            /*
             * A seconda della versione di Baileys,
             * l'elemento può avere .jid oppure
             * essere direttamente una stringa.
             */

            const jid =
                typeof entry === 'string'
                    ? entry
                    : entry.jid


            if (!jid)
                continue


            const parsed = parseJid(jid)

            if (!parsed)
                continue


            /*
             * Per ora raggruppiamo usando la parte
             * USER del JID restituito da WhatsApp.
             */

            const key =
                `${parsed.user}@${parsed.server}`


            if (!accounts.has(key)) {

                accounts.set(
                    key,
                    {
                        user: parsed.user,
                        server: parsed.server,
                        devices: []
                    }
                )
            }


            const account =
                accounts.get(key)


            /*
             * Evitiamo duplicati.
             */

            if (
                !account.devices.some(
                    d => d.device === parsed.device
                )
            ) {

                account.devices.push({
                    device: parsed.device,
                    jid
                })
            }
        }


        /*
         * Prendiamo solo gli account
         * con almeno 2 dispositivi.
         */

        const multiple =
            [...accounts.values()]
                .filter(
                    account =>
                        account.devices.length >= 2
                )


        console.log(
            '[DEVICES] Account multipli:',
            multiple
        )


        if (!multiple.length) {

            return m.reply(
                '📱 *ANALISI DISPOSITIVI*\n\n' +

                `👥 Partecipanti analizzati: ${jids.length}\n` +

                '✅ Nessun account con 2 o più dispositivi ' +
                'restituiti da WhatsApp.'
            )
        }


        /*
         * Costruiamo il risultato.
         */

        let text =
            '📱 *DISPOSITIVI MULTIPLI*\n\n'

        text +=
            `👥 Partecipanti analizzati: ${jids.length}\n`

        text +=
            `⚠️ Account con 2+ dispositivi: ${multiple.length}\n\n`


        const mentions = []


        for (const account of multiple) {

            text +=
                `👤 ${account.user}@${account.server}\n`

            text +=
                `📱 *${account.devices.length} dispositivi*\n`


            for (const device of account.devices) {

                text +=
                    `   └─ Device ${device.device}\n`
            }

            text += '\n'


            /*
             * Mention solo se è un normale JID PN.
             *
             * Non trasformiamo arbitrariamente i @lid.
             */

            if (
                account.server ===
                's.whatsapp.net'
            ) {

                mentions.push(
                    `${account.user}@s.whatsapp.net`
                )
            }
        }


        text +=
            '━━━━━━━━━━━━━━━━\n'

        text +=
            'ℹ️ Dati ottenuti tramite USync.'


        return conn.sendMessage(
            m.chat,
            {
                text,
                mentions
            },
            {
                quoted: m
            }
        )


    } catch (e) {

        console.error(
            '[DEVICES]',
            e
        )

        return m.reply(
            '❌ Errore durante il controllo:\n\n' +
            `${e?.stack || e?.message || e}`
        )
    }
}


handler.help = ['devices']
handler.tags = ['owner']
handler.command = [
    'devices',
    'devicecheck'
]
handler.owner = true

export default handler
