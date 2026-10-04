import { randomBytes, createHash } from 'node:crypto'

/*
 * ============================================================
 * BAN CHECKER - WhatsApp /v2/exist
 * Ricostruzione del flusso usato dai fork moderni di Baileys.
 *
 * NON modifica:
 * - simple.js
 * - main.js
 * - auth/session
 * - creds del bot
 *
 * Il plugin usa soltanto le primitive Curve già presenti
 * nel Baileys installato nel progetto.
 * ============================================================
 */

const EXIST_URL = 'https://v.whatsapp.net/v2/exist'
const GRAPHQL_URL = 'https://graph.whatsapp.com/graphql'

const GRAPHQL_ACCESS_TOKEN =
    'WA|1015890928915437|3201f239340c1c8ec6262a6dad04200e'

const GRAPHQL_BAN_STATUS_DOC_ID =
    '25573756098908502'

const MOBILE_TOKEN_PREFIX =
    '0a1mLfGUIBVrMKF1RdvLI5lkRBvof6vn0fD2QRSM'

const REGISTRATION_PUBLIC_KEY = Buffer.from([
    5, 142, 140, 15,
    116, 195, 235, 197,
    215, 166, 134, 92,
    108, 60, 132, 56,
    86, 176, 97, 33,
    204, 232, 234, 119,
    77, 34, 251, 111,
    18, 37, 18, 48, 45
])

/*
 * ------------------------------------------------------------
 * Carica Curve dal Baileys già installato.
 * Prima prova @vkazee, poi @whiskeysockets.
 * ------------------------------------------------------------
 */

let Curve
let signedKeyPair
let WA_VERSION

async function loadCrypto() {
    const candidates = [
        '@vkazee/baileys/lib/Utils/crypto.js',
        '@whiskeysockets/baileys/lib/Utils/crypto.js'
    ]

    let lastError

    for (const path of candidates) {
        try {
            const mod = await import(path)

            if (mod.Curve && mod.signedKeyPair) {
                Curve = mod.Curve
                signedKeyPair = mod.signedKeyPair
                break
            }
        } catch (e) {
            lastError = e
        }
    }

    if (!Curve || !signedKeyPair) {
        throw new Error(
            'Impossibile caricare Curve/signedKeyPair dal Baileys installato.\n' +
            'Errore: ' + (lastError?.message || 'modulo non trovato')
        )
    }

    /*
     * Il fork Nexus costruisce MOBILE_TOKEN utilizzando
     * l'MD5 della versione WhatsApp.
     *
     * Proviamo a leggere la versione direttamente dal
     * Defaults del Baileys già installato.
     */

    const defaultsCandidates = [
        '@vkazee/baileys/lib/Defaults/index.js',
        '@whiskeysockets/baileys/lib/Defaults/index.js'
    ]

    for (const path of defaultsCandidates) {
        try {
            const mod = await import(path)

            if (mod.WA_VERSION) {
                WA_VERSION = mod.WA_VERSION
                break
            }
        } catch {}
    }

    /*
     * Fallback: se WA_VERSION non è esportata dal fork,
     * usiamo una versione abbastanza recente.
     *
     * Questo viene usato soltanto se il Baileys non espone
     * WA_VERSION internamente.
     */
    if (!WA_VERSION) {
        WA_VERSION = '2.3000.1'
    }
}

/*
 * ------------------------------------------------------------
 * UUID v4
 * Equivalente funzionale al uuid v4 usato nel sorgente.
 * ------------------------------------------------------------
 */

function uuidv4() {
    const b = randomBytes(16)

    b[6] = (b[6] & 0x0f) | 0x40
    b[8] = (b[8] & 0x3f) | 0x80

    const h = b.toString('hex')

    return (
        h.slice(0, 8) + '-' +
        h.slice(8, 12) + '-' +
        h.slice(12, 16) + '-' +
        h.slice(16, 20) + '-' +
        h.slice(20)
    )
}

/*
 * ------------------------------------------------------------
 * Registration ID
 *
 * Il sorgente usa:
 *
 * Uint16Array.from(randomBytes(2))[0] & 16383
 * ------------------------------------------------------------
 */

function generateRegistrationId() {
    return randomBytes(2).readUInt16BE(0) & 16383
}

/*
 * ------------------------------------------------------------
 * conversione identica a convertBufferToUrlHex()
 *
 * Esempio:
 * Buffer [0xab, 0x01]
 * diventa:
 * %ab%01
 * ------------------------------------------------------------
 */

function convertBufferToUrlHex(buffer) {
    let id = ''

    for (const x of buffer) {
        id += `%${x.toString(16).padStart(2, '0').toLowerCase()}`
    }

    return id
}

/*
 * ------------------------------------------------------------
 * urlencode() del sorgente Nexus.
 *
 * IMPORTANTISSIMO:
 * NON utilizzare encodeURIComponent().
 *
 * Il sorgente originale fa esattamente queste sostituzioni.
 * ------------------------------------------------------------
 */

function urlencode(str) {
    return String(str)
        .replace(/-/g, '%2d')
        .replace(/_/g, '%5f')
        .replace(/~/g, '%7e')
}

/*
 * ------------------------------------------------------------
 * Parsing numero.
 *
 * Per l'Italia gestiamo esplicitamente +39.
 * Sono supportati anche alcuni prefissi internazionali comuni.
 * ------------------------------------------------------------
 */

const COUNTRY_CODES = [
    '1',
    '20',
    '27',
    '30',
    '31',
    '32',
    '33',
    '34',
    '36',
    '39',
    '40',
    '41',
    '43',
    '44',
    '45',
    '46',
    '47',
    '48',
    '49',
    '51',
    '52',
    '53',
    '54',
    '55',
    '56',
    '57',
    '58',
    '60',
    '61',
    '62',
    '63',
    '64',
    '65',
    '66',
    '81',
    '82',
    '84',
    '86',
    '90',
    '91',
    '92',
    '93',
    '94',
    '95',
    '98',
    '211',
    '212',
    '213',
    '216',
    '218',
    '220',
    '221',
    '222',
    '223',
    '224',
    '225',
    '226',
    '227',
    '228',
    '229',
    '230',
    '231',
    '232',
    '233',
    '234',
    '235',
    '236',
    '237',
    '238',
    '239',
    '240',
    '241',
    '242',
    '243',
    '244',
    '245',
    '246',
    '248',
    '249',
    '250',
    '251',
    '252',
    '253',
    '254',
    '255',
    '256',
    '257',
    '258',
    '260',
    '261',
    '262',
    '263',
    '264',
    '265',
    '266',
    '267',
    '268',
    '269',
    '290',
    '291',
    '297',
    '298',
    '299',
    '350',
    '351',
    '352',
    '353',
    '354',
    '355',
    '356',
    '357',
    '358',
    '359',
    '370',
    '371',
    '372',
    '373',
    '374',
    '375',
    '376',
    '377',
    '378',
    '379',
    '380',
    '381',
    '382',
    '383',
    '385',
    '386',
    '387',
    '389',
    '420',
    '421',
    '423',
    '500',
    '501',
    '502',
    '503',
    '504',
    '505',
    '506',
    '507',
    '508',
    '509',
    '590',
    '591',
    '592',
    '593',
    '594',
    '595',
    '596',
    '597',
    '598',
    '599',
    '670',
    '672',
    '673',
    '674',
    '675',
    '676',
    '677',
    '678',
    '679',
    '680',
    '681',
    '682',
    '683',
    '685',
    '686',
    '687',
    '688',
    '689',
    '690',
    '691',
    '692',
    '850',
    '852',
    '853',
    '855',
    '856',
    '880',
    '886',
    '960',
    '961',
    '962',
    '963',
    '964',
    '965',
    '966',
    '967',
    '968',
    '970',
    '971',
    '972',
    '973',
    '974',
    '975',
    '976',
    '977',
    '992',
    '993',
    '994',
    '995',
    '996',
    '998'
]

function parsePhone(input) {
    let value = String(input || '').trim()

    if (!value) {
        throw new Error('Inserisci un numero di telefono.')
    }

    value = value.replace(/^00/, '+')
    value = value.replace(/[^\d+]/g, '')

    if (!value.startsWith('+')) {
        value = '+' + value
    }

    const digits = value.slice(1)

    if (!/^\d+$/.test(digits)) {
        throw new Error('Numero non valido.')
    }

    /*
     * Prima tentiamo i prefissi a 3 cifre.
     */
    const sorted = [...COUNTRY_CODES]
        .sort((a, b) => b.length - a.length)

    let countryCode = null

    for (const code of sorted) {
        if (digits.startsWith(code)) {
            countryCode = code
            break
        }
    }

    if (!countryCode) {
        /*
         * Per numeri italiani nudi tipo 39333...
         * il prefisso 39 viene identificato comunque.
         */
        if (digits.startsWith('39')) {
            countryCode = '39'
        }
    }

    if (!countryCode) {
        throw new Error(
            'Prefisso internazionale non riconosciuto.\n' +
            'Usa il formato +393xxxxxxxxx'
        )
    }

    const nationalNumber = digits.slice(countryCode.length)

    if (!nationalNumber || nationalNumber.length < 5) {
        throw new Error('Numero nazionale non valido.')
    }

    return {
        formatted: '+' + digits,
        countryCode,
        nationalNumber
    }
}

/*
 * ------------------------------------------------------------
 * Costruzione delle credenziali temporanee.
 *
 * Questo rispecchia initAuthCreds() del fork Nexus:
 *
 * identityKey
 * noiseKey
 * pairingEphemeralKeyPair
 * signedIdentityKey
 * signedPreKey
 * registrationId
 * deviceId
 * phoneId
 * identityId
 * backupToken
 * ------------------------------------------------------------
 */

function buildCredentials() {
    const identityKey = Curve.generateKeyPair()

    return {
        noiseKey: Curve.generateKeyPair(),

        pairingEphemeralKeyPair:
            Curve.generateKeyPair(),

        signedIdentityKey:
            identityKey,

        signedPreKey:
            signedKeyPair(identityKey, 1),

        registrationId:
            generateRegistrationId(),

        advSecretKey:
            randomBytes(32).toString('base64'),

        deviceId: (() => {
            const uuid = uuidv4()

            return Buffer
                .from(uuid.replace(/-/g, ''), 'hex')
                .toString('base64url')
        })(),

        phoneId:
            uuidv4(),

        identityId:
            randomBytes(20),

        backupToken:
            randomBytes(20)
    }
}

/*
 * ------------------------------------------------------------
 * registrationParams()
 *
 * Questa è la parte più importante.
 * È ricostruita dalla funzione pubblica Nexus.
 * ------------------------------------------------------------
 */

function registrationParams(creds, countryCode, nationalNumber) {
    const e_regid = Buffer.alloc(4)

    e_regid.writeInt32BE(
        creds.registrationId
    )

    const e_skey_id = Buffer.alloc(3)

    e_skey_id.writeInt16BE(
        creds.signedPreKey.keyId
    )

    /*
     * MOBILE_TOKEN =
     * prefix + MD5(WA_VERSION)
     */

    const versionHash = createHash('md5')
        .update(WA_VERSION)
        .digest('hex')

    const MOBILE_TOKEN =
        Buffer.from(
            MOBILE_TOKEN_PREFIX + versionHash
        )

    /*
     * token =
     * MD5(MOBILE_TOKEN + numero nazionale)
     */

    const token = createHash('md5')
        .update(
            Buffer.concat([
                MOBILE_TOKEN,
                Buffer.from(nationalNumber)
            ])
        )
        .digest('hex')

    return {
        cc: countryCode,

        in: nationalNumber,

        Rc: '0',

        lg: 'en',

        lc: 'GB',

        mistyped: '6',

        authkey:
            Buffer.from(
                creds.noiseKey.public
            ).toString('base64url'),

        e_regid:
            e_regid.toString('base64url'),

        e_keytype:
            'BQ',

        e_ident:
            Buffer.from(
                creds.signedIdentityKey.public
            ).toString('base64url'),

        e_skey_id:
            e_skey_id.toString('base64url'),

        e_skey_val:
            Buffer.from(
                creds.signedPreKey.keyPair.public
            ).toString('base64url'),

        e_skey_sig:
            Buffer.from(
                creds.signedPreKey.signature
            ).toString('base64url'),

        fdid:
            creds.phoneId,

        network_ratio_type:
            '1',

        expid:
            creds.deviceId,

        simnum:
            '1',

        hasinrc:
            '1',

        pid:
            Math.floor(
                Math.random() * 1000
            ).toString(),

        id:
            convertBufferToUrlHex(
                creds.identityId
            ),

        backup_token:
            convertBufferToUrlHex(
                creds.backupToken
            ),

        token
    }
}

/*
 * ------------------------------------------------------------
 * Costruzione URL esatta del sorgente Nexus.
 * ------------------------------------------------------------
 */

function buildExistUrl(params) {
    const parameter = []

    for (const param in params) {
        const value = params[param]

        if (
            value !== null &&
            value !== undefined
        ) {
            parameter.push(
                param + '=' + urlencode(value)
            )
        }
    }

    return EXIST_URL + '?' + parameter.join('&')
}

/*
 * ------------------------------------------------------------
 * Richiesta /v2/exist
 * ------------------------------------------------------------
 */

async function mobileRegisterExists(params) {
    const url = buildExistUrl(params)

    const controller =
        new AbortController()

    const timeout =
        setTimeout(
            () => controller.abort(),
            20000
        )

    try {
        const response =
            await fetch(url, {
                method: 'GET',

                headers: {
                    'User-Agent':
                        `WhatsApp/${WA_VERSION} ` +
                        'iOS/17.5.1 ' +
                        'Device/Apple-iPhone_13',

                    'Accept':
                        'application/json, text/plain, */*'
                },

                signal:
                    controller.signal
            })

        const raw =
            await response.text()

        let json

        try {
            json =
                JSON.parse(raw)
        } catch {
            throw {
                reason: 'bad_response',
                httpStatus: response.status,
                raw
            }
        }

        /*
         * Come mobileRegisterFetch() del sorgente:
         *
         * se c'è reason -> errore
         * se status non è ok/sent -> errore
         */

        if (
            response.status > 300 ||
            json.reason
        ) {
            throw json
        }

        if (
            json.status &&
            !['ok', 'sent'].includes(
                json.status
            )
        ) {
            throw json
        }

        return json

    } finally {
        clearTimeout(timeout)
    }
}

/*
 * ------------------------------------------------------------
 * GraphQL ban details
 *
 * Ricostruzione di getBanDetails().
 * ------------------------------------------------------------
 */

async function getBanDetails(appealToken) {
    const controller =
        new AbortController()

    const timeout =
        setTimeout(
            () => controller.abort(),
            15000
        )

    try {
        const body = {
            variables: JSON.stringify({
                app_id: 'dev.app.id',
                request_token: appealToken
            }),

            access_token:
                GRAPHQL_ACCESS_TOKEN,

            doc_id:
                GRAPHQL_BAN_STATUS_DOC_ID,

            lang:
                'en_GB',

            'Content-Type':
                'application/json'
        }

        const response =
            await fetch(
                GRAPHQL_URL,
                {
                    method: 'POST',

                    headers: {
                        'User-Agent':
                            `WhatsApp/${WA_VERSION} ` +
                            'iOS/17.5.1 ' +
                            'Device/Apple-iPhone_13',

                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify(body),

                    signal:
                        controller.signal
                }
            )

        const raw =
            await response.text()

        let json

        try {
            json =
                JSON.parse(raw)
        } catch {
            throw new Error(
                'Risposta GraphQL non JSON: ' + raw
            )
        }

        return (
            json?.data
                ?.whatsapp_support_ban_appeal_status
                || null
        )

    } finally {
        clearTimeout(timeout)
    }
}

/*
 * ------------------------------------------------------------
 * CHECK COMPLETO
 * ------------------------------------------------------------
 */

async function checkStatusWA(phoneNumber) {
    await loadCrypto()

    const number =
        parsePhone(phoneNumber)

    const creds =
        buildCredentials()

    const params =
        registrationParams(
            creds,
            number.countryCode,
            number.nationalNumber
        )

    try {
        /*
         * Se /exist riesce:
         * secondo il checker Nexus il numero viene
         * considerato active.
         */

        await mobileRegisterExists(params)

        return {
            number: number.formatted,

            status: 'active',

            isBanned: false,

            isNeedOfficialWa: false,

            banInfo: null
        }

    } catch (err) {

        /*
         * ====================================================
         * BAN
         * ====================================================
         */

        if (err?.appeal_token) {

            let banDetails = null

            try {
                banDetails =
                    await getBanDetails(
                        err.appeal_token
                    )
            } catch (e) {
                /*
                 * Anche se GraphQL fallisce,
                 * sappiamo già che /exist ha restituito
                 * appeal_token, quindi teniamo il ban.
                 */
                banDetails = null
            }

            const appealStatus =
                banDetails?.status || null

            let banType

            if (appealStatus === 'BANNED') {
                banType = 'permanent'
            } else if (appealStatus) {
                banType = 'temporary'
            } else {
                banType = 'unknown'
            }

            return {
                number: number.formatted,

                status: 'banned',

                isBanned: true,

                isNeedOfficialWa: false,

                banInfo: {
                    banType,

                    violationType:
                        err.violation_type ||
                        null,

                    violationReason:
                        err.violation_type
                            ? `Type ${err.violation_type}`
                            : 'Unknown',

                    canAppeal:
                        banType === 'temporary'
                            ? true
                            : banType === 'permanent'
                                ? false
                                : null,

                    appealToken:
                        err.appeal_token,

                    banTime:
                        banDetails?.ban_time ||
                        null,

                    banDate:
                        banDetails?.ban_time
                            ? new Date(
                                banDetails.ban_time * 1000
                            ).toISOString()
                            : null,

                    appealStatus,

                    appealCreatedAt:
                        banDetails?.appeal_creation_time
                            ? new Date(
                                banDetails.appeal_creation_time * 1000
                            ).toISOString()
                            : null
                },

                raw: err
            }
        }

        /*
         * ====================================================
         * CUSTOM BLOCK SCREEN
         * ====================================================
         */

        if (err?.custom_block_screen) {
            return {
                number: number.formatted,

                status: 'blocked',

                isBanned: false,

                isNeedOfficialWa: true,

                banInfo: null,

                raw: err
            }
        }

        /*
         * ====================================================
         * INCORRECT
         * ====================================================
         */

        if (err?.reason === 'incorrect') {
            return {
                number: number.formatted,

                status: 'active',

                isBanned: false,

                isNeedOfficialWa: false,

                banInfo: null,

                raw: err
            }
        }

        /*
         * ====================================================
         * RATE LIMIT
         * ====================================================
         */

        if (
            err?.reason ===
            'temporarily_unavailable'
        ) {
            return {
                number: number.formatted,

                status: 'rate_limited',

                isBanned: false,

                isNeedOfficialWa: false,

                banInfo: null,

                raw: err
            }
        }

        /*
         * ====================================================
         * ERRORE SCONOSCIUTO
         * ====================================================
         */

        return {
            number: number.formatted,

            status: 'error',

            isBanned: false,

            isNeedOfficialWa: false,

            banInfo: null,

            raw: err
        }
    }
}

/*
 * ------------------------------------------------------------
 * FORMATTAZIONE
 * ------------------------------------------------------------
 */

function formatResult(result) {

    if (
        result.status === 'banned'
    ) {
        const info =
            result.banInfo || {}

        let out =
            `🚫 *WHATSAPP BAN CHECK*\n\n` +
            `📱 Numero: ${result.number}\n` +
            `🔴 Stato: *BANNED*\n`

        if (
            info.banType === 'permanent'
        ) {
            out +=
                `⛔ Tipo: *PERMANENTE*\n`
        } else if (
            info.banType === 'temporary'
        ) {
            out +=
                `⚠️ Tipo: *TEMPORANEO*\n`
        } else {
            out +=
                `❓ Tipo: *NON DETERMINATO*\n`
        }

        if (info.violationType) {
            out +=
                `⚠️ Violation type: ${info.violationType}\n`
        }

        if (info.appealStatus) {
            out +=
                `📨 Appeal status: ${info.appealStatus}\n`
        }

        if (
            info.canAppeal === true
        ) {
            out +=
                `✅ Ricorso: possibile\n`
        } else if (
            info.canAppeal === false
        ) {
            out +=
                `❌ Ricorso dal checker: non disponibile\n`
        }

        if (info.banDate) {
            out +=
                `🕒 Ban date: ${info.banDate}\n`
        }

        return out
    }

    if (
        result.status === 'active'
    ) {
        return (
            `✅ *WHATSAPP BAN CHECK*\n\n` +
            `📱 Numero: ${result.number}\n` +
            `🟢 Stato: *ACTIVE*`
        )
    }

    if (
        result.status === 'blocked'
    ) {
        return (
            `⚠️ *WHATSAPP BAN CHECK*\n\n` +
            `📱 Numero: ${result.number}\n` +
            `🟠 Stato: *BLOCKED*\n` +
            `ℹ️ Il checker segnala che serve WhatsApp ufficiale.`
        )
    }

    if (
        result.status === 'rate_limited'
    ) {
        return (
            `⏳ *WHATSAPP BAN CHECK*\n\n` +
            `📱 Numero: ${result.number}\n` +
            `🟠 Stato: *RATE LIMITED*\n\n` +
            `WhatsApp sta limitando la richiesta.`
        )
    }

    let out =
        `❓ *WHATSAPP BAN CHECK*\n\n` +
        `📱 Numero: ${result.number}\n` +
        `🔵 Stato: *UNKNOWN / ERROR*`

    if (result.raw) {
        try {
            out +=
                `\n\n\`\`\`\n` +
                JSON.stringify(
                    result.raw,
                    null,
                    2
                ).slice(0, 3000) +
                `\n\`\`\``
        } catch {}
    }

    return out
}

/*
 * ============================================================
 * HANDLER
 * ============================================================
 */

let handler = async (m, { text }) => {

    if (!text?.trim()) {
        throw (
            `Uso corretto:\n` +
            `.bancheck +393XXXXXXXXX`
        )
    }

    const result =
        await checkStatusWA(
            text.trim()
        )

    await m.reply(
        formatResult(result)
    )
}

handler.help = [
    'bancheck <numero>'
]

handler.tags = [
    'tools'
]

handler.command = /^(bancheck|checkban)$/i

export default handler
