let handler = async (m, { conn, text }) => {
    if (!text) {
        return m.reply(
            `❌ Inserisci un numero.\n\n` +
            `Esempio:\n` +
            `.bancheck 393331234567`
        )
    }

    // Pulisce il numero
    let number = text.replace(/[^0-9]/g, '')

    if (number.length < 7) {
        return m.reply('❌ Numero non valido.')
    }

    let jid = number + '@s.whatsapp.net'

    await m.reply(
        `🔎 *WHATSAPP BAN CHECK*\n\n` +
        `📱 Numero: +${number}\n` +
        `⏳ Controllo in corso...`
    )

    let registry = null
    let sendPage = null
    let errors = []

    // =========================================================
    // A — CONTROLLO REGISTRAZIONE WHATSAPP
    // =========================================================

    try {
        if (typeof conn.onWhatsApp === 'function') {
            let result = await conn.onWhatsApp(jid)

            if (Array.isArray(result) && result.length > 0) {
                registry = result[0]
            } else {
                registry = {
                    exists: false
                }
            }
        } else {
            errors.push('onWhatsApp non disponibile')
        }
    } catch (e) {
        errors.push(`onWhatsApp: ${e.message}`)
    }

    // =========================================================
    // B — CONTROLLO PAGINA PUBBLICA WHATSAPP
    // =========================================================

    try {
        let url =
            `https://api.whatsapp.com/send?phone=${number}`

        let response = await fetch(url, {
            redirect: 'follow',
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
                    'AppleWebKit/537.36 Chrome/131.0 Safari/537.36'
            }
        })

        let html = await response.text()

        sendPage = {
            status: response.status,
            ok: response.ok,
            length: html.length,

            generic:
                /WhatsApp Messenger/i.test(html) &&
                !/Download WhatsApp/i.test(html),

            hasWhatsApp:
                /WhatsApp/i.test(html)
        }

    } catch (e) {
        errors.push(`send-page: ${e.message}`)
    }

    // =========================================================
    // ANALISI
    // =========================================================

    let exists =
        registry?.exists === true

    let confidence = 0
    let status = 'UNKNOWN'
    let emoji = '❓'

    /*
     * IMPORTANTE:
     * questa prima versione NON dichiara automaticamente
     * "BANNED" sulla base di un singolo fallimento.
     */

    if (exists) {
        status = 'ACTIVE'
        emoji = '🟢'
        confidence = 0.90
    } else if (registry && registry.exists === false) {
        status = 'OFF_WHATSAPP'
        emoji = '⚪'
        confidence = 0.80
    }

    // =========================================================
    // RISULTATO
    // =========================================================

    let out =
        `🔎 *WHATSAPP BAN CHECK*\n\n` +
        `📱 *Numero:* +${number}\n\n` +

        `${emoji} *Stato:* ${status}\n` +
        `📊 *Confidence:* ${Math.round(confidence * 100)}%\n\n` +

        `━━━━━━━━━━━━━━\n` +
        `📡 *Registry WhatsApp:* ` +
        `${registry?.exists === true ? '✅' : registry?.exists === false ? '❌' : '⚠️'}\n` +

        `🌐 *Send page:* ` +
        `${sendPage ? '✅' : '⚠️'}\n` +

        `━━━━━━━━━━━━━━`

    if (registry?.jid) {
        out += `\n🆔 *JID:* ${registry.jid}`
    }

    if (registry?.lid) {
        out += `\n🔗 *LID:* ${registry.lid}`
    }

    if (errors.length) {
        out +=
            `\n\n⚠️ *Note tecniche:*\n` +
            errors.map(x => `• ${x}`).join('\n')
    }

    out +=
        `\n\n_Questo controllo non invia messaggi al numero._`

    await m.reply(out)
}

handler.help = ['bancheck <numero>']
handler.tags = ['tools']
handler.command = ['bancheck', 'checkban']

export default handler
