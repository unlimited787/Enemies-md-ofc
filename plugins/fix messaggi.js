import { promises as fs } from 'fs'
import path from 'path'

const SESSION_PATH = './EnemiesSessione'

const SAFE_KEEP = new Set([
'creds.json',
'app-state-sync-version.json'
])

const DANGEROUS_PATTERNS = [
/^creds.json$/i,
/^app-state-sync-version.json$/i
]

function cleanJid(jid) {
if (!jid || typeof jid !== 'string') return null

return jid
    .trim()
    .replace(/:[^@]+(?=@)/, '')

}

function getBareId(jid) {
const clean = cleanJid(jid)
if (!clean) return null

return clean.split('@')[0]

}

function addVariants(set, jid) {
if (!jid) return

const clean = cleanJid(jid)
if (!clean) return

const bare = getBareId(clean)

if (clean) set.add(clean.toLowerCase())
if (bare) set.add(bare.toLowerCase())

if (clean.endsWith('@s.whatsapp.net')) {
    set.add(`${bare}@s.whatsapp.net`)
}

if (clean.endsWith('@lid')) {
    set.add(`${bare}@lid`)
}

if (clean.endsWith('@g.us')) {
    set.add(`${bare}@g.us`)
}

}

async function resolveLIDPN(conn, jid, ids) {
if (!jid) return

addVariants(ids, jid)

const clean = cleanJid(jid)

if (!clean?.endsWith('@lid')) return

try {
    const mapping = conn?.signalRepository?.lidMapping

    if (mapping?.getPNForLID) {
        const pn = await mapping.getPNForLID(clean)

        if (pn) {
            addVariants(ids, pn)

            console.log(
                '[DS FIX] LID → PN:',
                clean,
                '=>',
                pn
            )
        }
    }
} catch (e) {
    console.log(
        '[DS FIX] LID mapping error:',
        e?.message || e
    )
}

}

async function recursiveFiles(dir) {
const output = []

let entries

try {
    entries = await fs.readdir(
        dir,
        { withFileTypes: true }
    )
} catch {
    return output
}

for (const entry of entries) {
    const full = path.join(
        dir,
        entry.name
    )

    if (entry.isDirectory()) {
        output.push(
            ...(await recursiveFiles(full))
        )
    } else {
        output.push(full)
    }
}

return output

}

function isProtected(name) {
if (SAFE_KEEP.has(name)) return true

return DANGEROUS_PATTERNS.some(
    regex => regex.test(name)
)

}

function isSignalFile(name) {
const n = name.toLowerCase()

return (
    n.startsWith('session-') ||
    n.startsWith('sender-key-') ||
    n.startsWith('sender-key-memory-') ||
    n.startsWith('pre-key-') ||
    n.startsWith('prekey-') ||
    n.startsWith('lid-mapping-') ||
    n.includes('sender-key') ||
    n.includes('session')
)

}

function belongsToTarget(name, ids) {
const lower = name.toLowerCase()

for (const id of ids) {
    const bare = id
        .replace(/@/g, '')
        .replace(/:/g, '')
        .toLowerCase()

    if (!bare) continue

    if (lower.includes(bare)) {
        return true
    }
}

return false

}

async function deleteFile(file) {
try {
await fs.unlink(file)
return true
} catch {
return false
}
}

async function inspectKeys(conn, ids) {

const results = []

const keys = conn?.authState?.keys

if (!keys?.get) {
    return results
}

/*
 * Controlliamo le categorie che possono bloccare
 * una sessione Signal senza toccare creds.
 */

const categories = [
    'session',
    'sender-key',
    'sender-key-memory',
    'pre-key',
    'lid-mapping'
]

for (const category of categories) {

    try {

        const data = await keys.get(
            category,
            [...ids]
        )

        if (data && Object.keys(data).length) {

            results.push({
                category,
                count: Object.keys(data).length
            })
        }

    } catch (e) {

        console.log(
            `[DS FIX] keys.get(${category}) error:`,
            e?.message || e
        )
    }
}

return results

}

async function purgeTargetFiles(ids) {

const deleted = []
const skipped = []

const files = await recursiveFiles(
    SESSION_PATH
)

for (const file of files) {

    const name = path.basename(file)

    if (isProtected(name)) {
        skipped.push(name)
        continue
    }

    if (!isSignalFile(name)) {
        continue
    }

    if (!belongsToTarget(name, ids)) {
        continue
    }

    const ok = await deleteFile(file)

    if (ok) {
        deleted.push(
            path.relative(
                SESSION_PATH,
                file
            )
        )
    }
}

return {
    deleted,
    skipped
}

}

async function purgeSenderMemory(conn, ids) {

const keys = conn?.authState?.keys

if (!keys?.set) {
    return 0
}

let count = 0

/*
 * Questo è particolarmente importante.
 *
 * Baileys usa sender-key-memory per ricordare
 * quali destinatari hanno già ricevuto una sender key.
 *
 * Se quella memoria rimane obsoleta, il retry può
 * non ricostruire correttamente la sessione.
 */

for (const id of ids) {

    try {

        await keys.set({
            'sender-key-memory': {
                [id]: null
            }
        })

        count++

    } catch (e) {

        console.log(
            '[DS FIX] sender-key-memory:',
            e?.message || e
        )
    }
}

return count

}

async function recreateSession(conn, ids) {

const repository =
    conn?.signalRepository

if (!repository) {
    return {
        attempted: false,
        success: false
    }
}

/*
 * Le versioni recenti di Baileys espongono
 * validateSession / jidToSignalProtocolAddress.
 */

const output = []

for (const jid of ids) {

    if (
        !jid.endsWith('@s.whatsapp.net') &&
        !jid.endsWith('@lid')
    ) {
        continue
    }

    try {

        if (repository.validateSession) {

            const state =
                await repository.validateSession(jid)

            output.push({
                jid,
                exists: !!state?.exists
            })

            console.log(
                '[DS FIX] validateSession:',
                jid,
                state
            )
        }

    } catch (e) {

        console.log(
            '[DS FIX] validateSession:',
            jid,
            e?.message || e
        )
    }
}

return {
    attempted: true,
    success: true,
    output
}

}

const handler = async (m, { conn }) => {

if (!conn?.user?.jid) {

    return conn.sendMessage(
        m.chat,
        {
            text:
                '❌ Baileys non è ancora connesso.'
        },
        { quoted: m }
    )
}

if (
    global.conn?.user?.jid &&
    global.conn.user.jid !== conn.user.jid
) {

    return conn.sendMessage(
        m.chat,
        {
            text:
                '❌ Devi eseguire il comando sulla connessione principale.'
        },
        { quoted: m }
    )
}

console.log(
    '\n\n========== DS EMERGENCY FIX =========='
)

try {

    /*
     * 1. Costruiamo TUTTI gli identificatori possibili.
     */

    const ids = new Set()

    addVariants(ids, m.chat)
    addVariants(ids, m.sender)
    addVariants(ids, m.participant)

    /*
     * 2. LID → PN
     */

    const initialIds = [...ids]

    for (const jid of initialIds) {
        await resolveLIDPN(
            conn,
            jid,
            ids
        )
    }

    /*
     * 3. Se il messaggio contiene remoteJidAlt,
     *    sfruttiamolo.
     */

    if (m.key?.remoteJidAlt) {

        addVariants(
            ids,
            m.key.remoteJidAlt
        )

        await resolveLIDPN(
            conn,
            m.key.remoteJidAlt,
            ids
        )
    }

    /*
     * 4. Participant alternativo.
     */

    if (m.key?.participantAlt) {

        addVariants(
            ids,
            m.key.participantAlt
        )

        await resolveLIDPN(
            conn,
            m.key.participantAlt,
            ids
        )
    }

    console.log(
        '[DS FIX] IDENTIFICATORI:',
        [...ids]
    )

    /*
     * 5. Controlliamo la struttura delle chiavi.
     */

    const before =
        await inspectKeys(
            conn,
            ids
        )

    console.log(
        '[DS FIX] KEY STATE:',
        before
    )

    /*
     * 6. RESET DELLA MEMORIA SENDER KEY.
     */

    const memoryReset =
        await purgeSenderMemory(
            conn,
            ids
        )

    console.log(
        '[DS FIX] sender-key-memory reset:',
        memoryReset
    )

    /*
     * 7. Proviamo a validare le sessioni.
     */

    const sessionState =
        await recreateSession(
            conn,
            ids
        )

    /*
     * 8. Pulizia mirata dei file.
     *
     * NON vengono cancellati:
     * - creds.json
     * - app-state
     * - sessioni di altri utenti
     */

    const purge =
        await purgeTargetFiles(
            ids
        )

    console.log(
        '[DS FIX] FILE ELIMINATI:',
        purge.deleted
    )

    /*
     * 9. Secondo controllo.
     */

    const after =
        await inspectKeys(
            conn,
            ids
        )

    console.log(
        '[DS FIX] KEY STATE AFTER:',
        after
    )

    console.log(
        '======================================\n'
    )

    let text =
        `fix completo, prova ad usare ora il bot.`

    

    return conn.sendMessage(
        m.chat,
        { text },
        { quoted: m }
    )

} catch (e) {

    console.error(
        '[DS FIX FATAL]',
        e
    )

    return conn.sendMessage(
        m.chat,
        {
            text:
                `❌ *FIX FALLITO*\n\n` +
                `${e?.stack || e?.message || e}`
        },
        { quoted: m }
    )
}

}

handler.help = [
'fixmsgespera',
'ds'
]

handler.tags = [
'group'
]

handler.command =
/^(fix|ds)$/i

export default handler