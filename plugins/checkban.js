/*
 * WhatsApp BanCheck - standalone
 *
 * NON modifica:
 * - Trashcore Baileys
 * - simple.js
 * - main.js
 * - sessione
 *
 * Comandi:
 * .bancheck 393xxxxxxxxxx
 * .checkban 393xxxxxxxxxx
 */

import crypto from 'crypto'

const GRAPHQL_URL = 'https://graph.whatsapp.net/graphql'

const EXIST_URL = 'https://v.whatsapp.net/v2/exist'

function md5(data) {
    return crypto
        .createHash('md5')
        .update(data)
        .digest('hex')
}

function randomHex(length = 32) {
    return crypto
        .randomBytes(length / 2)
        .toString('hex')
}

function normalizeNumber(input) {
    return String(input || '').replace(/\D/g, '')
}

function splitNumber(number) {
    /*
     * cc = prefisso internazionale
     * in = resto del numero
     *
     * Per l'Italia, ad esempio:
     * 393331234567
     * cc = 39
     * in = 3331234567
     */

    if (number.startsWith('39') && number.length > 10) {
        return {
            cc: '39',
            in: number.slice(2)
        }
    }

    /*
     * Fallback:
     * gli ultimi 10 numeri vengono considerati
     * parte nazionale.
     */

    return {
        cc: number.slice(0, -10),
        in: number.slice(-10)
    }
}

async function checkExist(number, conn) {

    const { cc, in: national } = splitNumber(number)

    /*
     * Recuperiamo, quando disponibili, alcuni dati
     * dalla sessione già esistente.
     *
     * NON modifichiamo la sessione.
     */

    let creds = {}

    try {
        creds = conn?.authState?.creds || {}
    } catch {}

    /*
     * Identificatori locali.
     *
     * Non utilizziamo una seconda Baileys.
     */

    const phoneId =
        creds.me?.id ||
        creds.me?.jid ||
        `${number}@s.whatsapp.net`

    const deviceId =
        creds.deviceId ||
        randomHex(16)

    const identityId =
        creds.registrationId ||
        randomHex(16)

    const backupToken =
        creds.backupToken ||
        randomHex(32)

    /*
     * Token diagnostico.
     *
     * Alcune implementazioni pubbliche del checker
     * generano il token con MD5.
     */

    const tokenSource =
        `${cc}:${national}:${phoneId}:${deviceId}`

    const token = md5(tokenSource)

    const params = new URLSearchParams()

    params.set('cc', cc)
    params.set('in', national)

    params.set('authkey', '')
    params.set('e_regid', String(creds.registrationId || 0))
    params.set('e_keytype', 'BQ')
    params.set('e_ident', identityId)
    params.set('e_skey_id', '1')
    params.set('e_skey_val', randomHex(32))
    params.set('e_skey_sig', randomHex(64))

    params.set('token', token)
    params.set('id', phoneId)
    params.set('device_id', deviceId)
    params.set('backup_token', backupToken)

    const response = await fetch(EXIST_URL, {
        method: 'POST',

        headers: {
            'User-Agent':
                'WhatsApp/2.24.2.76 Android/14 Device/Generic',

            'Content-Type':
                'application/x-www-form-urlencoded',

            'Accept':
                '*/*'
        },

        body: params.toString()
    })

    const text = await response.text()

    let json = null

    try {
        json = JSON.parse(text)
    } catch {}

    return {
        http: response.status,
        ok: response.ok,
        text,
        json
    }
}


/*
 * ============================================================
 * BAN DETAILS
 * ============================================================
 */

async function getBanDetails(number, existResult) {

    /*
     * WhatsApp può restituire un appeal_token quando
     * l'account è sottoposto a una restrizione.
     */

    const appealToken =
        existResult?.json?.appeal_token ||
        existResult?.json?.data?.appeal_token ||
        null

    if (!appealToken) {
        return null
    }

    /*
     * Query GraphQL diagnostica.
     *
     * Manteniamo la richiesta isolata dal socket Baileys.
     */

    const query = `
        query GetBanDetails(
            $phone_number: String!,
            $appeal_token: String!
        ) {
            wa_check_ban_status(
                phone_number: $phone_number,
                appeal_token: $appeal_token
            ) {
                status
                ban_type
                violation_type
                violation_reason
                can_appeal
                appeal_status
                ban_time
            }
        }
    `

    const body = {
        query,
        variables: {
            phone_number: number,
            appeal_token: appealToken
        }
    }

    try {

        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',

            headers: {
                'Content-Type': 'application/json',
                'User-Agent':
                    'WhatsApp/2.24.2.76 Android/14'
            },

            body: JSON.stringify(body)
        })

        const text = await response.text()

        let json = null

        try {
            json = JSON.parse(text)
        } catch {}

        return {
            http: response.status,
            text,
            json
        }

    } catch (e) {

        return {
            error: e?.message || String(e)
        }
    }
}


/*
 * ============================================================
 * ANALISI RISPOSTA
 * ============================================================
 */

function analyseExist(result) {

    const json = result?.json

    if (!json) {
        return {
            status: 'UNKNOWN',
            banned: false
        }
    }

    const raw =
        JSON.stringify(json).toLowerCase()

    /*
     * Indicatori espliciti.
     */

    if (
        raw.includes('"banned"') ||
        raw.includes('"ban"') ||
        raw.includes('appeal_token')
    ) {

        return {
            status: 'BANNED',
            banned: true
        }
    }

    if (
        raw.includes('"active"') ||
        raw.includes('"registered"')
    ) {

        return {
            status: 'ACTIVE',
            banned: false
        }
    }

    if (
        raw.includes('blocked')
    ) {

        return {
            status: 'BLOCKED',
            banned: false
        }
    }

    if (
        raw.includes('rate_limited')
    ) {

        return {
            status: 'RATE_LIMITED',
            banned: false
        }
    }

    return {
        status: 'UNKNOWN',
        banned: false
    }
}


/*
 * ============================================================
 * FORMAT
 * ============================================================
 */

function formatBanDetails(details) {

    if (!details) return ''

    const json =
        details.json ||
        {}

    const data =
        json?.data?.wa_check_ban_status ||
        json?.data?.checkBanStatus ||
        json?.wa_check_ban_status ||
        {}

    let out = ''

    if (data.ban_type)
        out += `\n🚫 Tipo BAN: ${data.ban_type}`

    if (data.violation_type)
        out += `\n⚠️ Violazione: ${data.violation_type}`

    if (data.violation_reason)
        out += `\n📝 Motivo: ${data.violation_reason}`

    if (data.can_appeal !== undefined)
        out +=
            `\n📨 Appello: ${
                data.can_appeal ? 'disponibile' : 'non disponibile'
            }`

    if (data.appeal_status)
        out += `\n📬 Stato appello: ${data.appeal_status}`

    if (data.ban_time)
        out += `\n⏱️ Ban time: ${data.ban_time}`

    return out
}


/*
 * ============================================================
 * HANDLER
 * ============================================================
 */

let handler = async (m, { conn, text }) => {

    if (!text) {
        return m.reply(
            `❌ Uso corretto:\n\n` +
            `.bancheck 393xxxxxxxxxx`
        )
    }

    const number =
        normalizeNumber(text)

    if (number.length < 7) {
        return m.reply(
            '❌ Numero non valido.'
        )
    }

    await m.reply(
        `🔎 *WHATSAPP BAN CHECK*\n\n` +
        `📱 Numero: +${number}\n` +
        `⏳ Interrogazione in corso...`
    )

    let existResult

    try {

        existResult =
            await checkExist(
                number,
                conn
            )

    } catch (e) {

        return m.reply(
            `❌ *Errore durante il controllo*\n\n` +
            `${e?.message || e}`
        )
    }

    /*
     * Analisi iniziale.
     */

    let result =
        analyseExist(existResult)

    /*
     * Se WhatsApp ha fornito un appeal_token,
     * proviamo a ottenere i dettagli del BAN.
     */

    let banDetails = null

    if (
        existResult?.json?.appeal_token ||
        existResult?.json?.data?.appeal_token
    ) {

        banDetails =
            await getBanDetails(
                number,
                existResult
            )
    }

    /*
     * Se GraphQL conferma esplicitamente il BAN,
     * prevale sulla prima analisi.
     */

    if (banDetails?.json) {

        const raw =
            JSON.stringify(
                banDetails.json
            ).toLowerCase()

        if (
            raw.includes('banned') ||
            raw.includes('permanent_ban') ||
            raw.includes('temporary_ban')
        ) {

            result.status = 'BANNED'
            result.banned = true
        }
    }

    /*
     * ========================================================
     * OUTPUT
     * ========================================================
     */

    let emoji = '❓'

    if (result.status === 'ACTIVE')
        emoji = '🟢'

    else if (result.status === 'BANNED')
        emoji = '🔴'

    else if (result.status === 'BLOCKED')
        emoji = '🟠'

    else if (result.status === 'RATE_LIMITED')
        emoji = '🟡'

    let out =
        `🔎 *WHATSAPP BAN CHECK*\n\n` +
        `📱 *Numero:* +${number}\n\n` +

        `${emoji} *Stato:* ${result.status}\n` +

        `🚫 *isBanned:* ${
            result.banned ? 'true' : 'false'
        }\n\n` +

        `━━━━━━━━━━━━━━━━━━\n` +

        `🌐 *HTTP:* ${
            existResult?.http ?? 'N/A'
        }\n`

    if (banDetails?.http) {
        out +=
            `📡 *GraphQL HTTP:* ${
                banDetails.http
            }\n`
    }

    out +=
        formatBanDetails(
            banDetails
        )

    /*
     * Debug minimo se UNKNOWN.
     *
     * Serve per capire quale risposta
     * sta effettivamente dando WhatsApp.
     */

    if (
        result.status === 'UNKNOWN'
    ) {

        let debug =
            existResult?.text ||
            'nessuna risposta'

        out +=
            `\n\n⚠️ *Risposta server:*\n` +
            '```' +
            debug.slice(0, 2500) +
            '```'
    }

    await m.reply(out)
}


handler.help = [
    'bancheck <numero>',
    'checkban <numero>'
]

handler.tags = ['tools']

handler.command = [
    'bancheck',
    'checkban'
]

export default handler
