/*
 * WhatsApp BanCheck - standalone diagnostic
 *
 * NON modifica:
 * - Trashcore Baileys
 * - simple.js
 * - main.js
 * - conn
 *
 * Comando:
 * .bancheck 393xxxxxxxxxx
 */

let handler = async (m, { conn, text }) => {

    if (!text) {
        throw `Uso:\n.bancheck 393xxxxxxxxxx`
    }

    const number = text.replace(/\D/g, '')

    if (number.length < 7) {
        throw '❌ Numero non valido.'
    }

    await m.reply(
        `🔎 *BAN CHECK V2*\n\n` +
        `📱 Numero: +${number}\n` +
        `⏳ Interrogo WhatsApp...`
    )

    /*
     * ============================================================
     * 1. REGISTRY CHECK
     * ============================================================
     *
     * Questo NON determina il ban.
     * Serve solamente come informazione aggiuntiva.
     */

    let registry = null

    try {
        if (typeof conn.onWhatsApp === 'function') {
            const r = await conn.onWhatsApp(
                number + '@s.whatsapp.net'
            )

            registry = Array.isArray(r) ? r[0] : r
        }
    } catch (e) {
        registry = {
            error: e?.message || String(e)
        }
    }

    /*
     * ============================================================
     * 2. WHATSAPP STATUS ENDPOINT
     * ============================================================
     *
     * Questa è la parte sperimentale.
     *
     * NON usiamo onWhatsApp() per decidere il BAN.
     */

    let response = null
    let responseText = null
    let responseJson = null

    try {

        const url =
            `https://v.whatsapp.net/v2/exist?cc=${number.slice(0, -10)}&in=${number.slice(-10)}`

        response = await fetch(url, {
            method: 'GET',
            redirect: 'manual',
            headers: {
                'User-Agent':
                    'WhatsApp/2.24.2.76 Android/14 Device/Generic',
                'Accept': '*/*'
            }
        })

        responseText = await response.text()

        try {
            responseJson = JSON.parse(responseText)
        } catch {
            responseJson = null
        }

    } catch (e) {

        response = {
            error: e?.message || String(e)
        }

    }

    /*
     * ============================================================
     * 3. ANALISI
     * ============================================================
     */

    let result = 'UNKNOWN'
    let confidence = 'BASSA'

    /*
     * NON trasformiamo arbitrariamente un errore HTTP in BAN.
     *
     * Per ora mostriamo tutti i segnali.
     */

    if (responseJson) {

        const raw = JSON.stringify(responseJson).toLowerCase()

        if (
            raw.includes('banned') ||
            raw.includes('"ban"') ||
            raw.includes('blocked')
        ) {
            result = 'POSSIBILE BAN'
            confidence = 'ALTA'
        }

        else if (
            raw.includes('active') ||
            raw.includes('registered')
        ) {
            result = 'ATTIVO'
            confidence = 'MEDIA'
        }
    }

    /*
     * ============================================================
     * 4. OUTPUT
     * ============================================================
     */

    let out =
        `🔎 *WHATSAPP BAN CHECK V2*\n\n` +
        `📱 *Numero:* +${number}\n\n` +
        `📊 *Risultato:* ${result}\n` +
        `🎯 *Confidence:* ${confidence}\n\n` +

        `━━━━━━━━━━━━━━━━━━\n` +
        `📡 *Registry:* ` +
        `${registry?.exists === true ? 'REGISTRATO' :
          registry?.exists === false ? 'NON REGISTRATO' :
          'NON DISPONIBILE'}\n`

    if (response?.status) {
        out +=
            `🌐 *HTTP:* ${response.status}\n`
    }

    if (responseJson) {

        out +=
            `📦 *JSON ricevuto:*\n` +
            '```json\n' +
            JSON.stringify(responseJson, null, 2).slice(0, 3500) +
            '\n```'

    } else if (responseText) {

        out +=
            `📦 *Risposta ricevuta:*\n` +
            '```\n' +
            responseText.slice(0, 3500) +
            '\n```'

    } else if (response?.error) {

        out +=
            `❌ *Errore:*\n` +
            response.error
    }

    await m.reply(out)
}

handler.help = ['bancheck <numero>']
handler.tags = ['tools']
handler.command = ['bancheck', 'checkban']

export default handler
