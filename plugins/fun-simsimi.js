// plugins/prova.js  (ESM)  — risoluzione canonica dal group metadata
import { jidNormalizedUser } from '@trashcore/baileys'

const norm = (j) => (j ? jidNormalizedUser(j) : null)
const bare = (j) => j.split('@')[0].split(':')[0]
const srvOf = (j) => j.split('@')[1] || ''

const protectedGroups = new Map()
let patched = false

function installPatch(conn) {
  if (patched) return
  const keys = conn?.authState?.keys
  if (!keys?.set) return
  const origSet = keys.set.bind(keys)
  keys.set = async (data) => {
    const skm = data?.['sender-key-memory']
    if (skm) for (const g of Object.keys(skm)) {
      if (skm[g] === null && protectedGroups.has(g)) skm[g] = { ...protectedGroups.get(g) }
    }
    return origSet(data)
  }
  patched = true
}

function senderKeyId(group, jid) {
  const u = bare(jid), srv = srvOf(jid)
  const dt = srv === 'lid' ? 1 : srv === 'hosted' ? 2 : srv === 'hosted.lid' ? 3 : 0
  const dev = jid.split('@')[0].includes(':') ? Number(jid.split('@')[0].split(':')[1]) : 0
  return `${group}::${dt === 0 ? u : `${u}_${dt}`}::${dev}`
}

// TUTTI i jid che un partecipante puo' avere (id, lid, phoneNumber, alt)
const pJids = (p) => [p.id, p.lid, p.phoneNumber, p.participantAlt, p.phoneNumberAlt].filter(Boolean)

async function rotateSenderKey(conn, group) {
  const me = conn.authState.creds.me
  const ids = new Set()
  for (const jid of [me.id, me.lid].filter(Boolean)) {
    const u = bare(jid), srv = srvOf(jid)
    const dts = srv === 'lid' ? [1] : srv === 'hosted' ? [2] : srv === 'hosted.lid' ? [3] : [0]
    for (const dt of dts) {
      const su = dt === 0 ? u : `${u}_${dt}`
      for (const dev of new Set([0, me.deviceId].filter((x) => x != null))) ids.add(`${group}::${su}::${dev}`)
    }
  }
  const all = [...ids]
  const found = await conn.authState.keys.get('sender-key', all)
  const existing = Object.keys(found).filter((k) => found[k])
  const wipe = {}
  for (const k of (existing.length ? existing : all)) wipe[k] = null
  await conn.authState.keys.set({ 'sender-key': wipe })
  return { existing, tried: all.length }
}

let handler = async (m, { conn, text, command }) => {
  const group = m.chat
  if (!group?.endsWith('@g.us')) return
  installPatch(conn)

  if (command === 'ripara') {
    protectedGroups.delete(group)
    await conn.authState.keys.set({ 'sender-key-memory': { [group]: null } })
    return conn.sendMessage(group, { text: 'esclusione rimossa' }, { quoted: m })
  }

  let targets = (m.mentionedJid || m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []).map(norm)
  if (!targets.length && text) targets = text.split(/\s+/).map((a) => norm(a.replace(/\D/g, '') + '@s.whatsapp.net'))
  targets = [...new Set(targets.filter(Boolean))]
  if (!targets.length) return m.reply('Uso: .prova @persona')

  // ---- 1) metadata del gruppo ----
  const meta = await conn.groupMetadata(group)

  // utenti bersaglio (PN + eventuale LID)
  const exUsers = new Set(targets.map(bare))

  // ---- 2) trova i partecipanti che matchano e raccogli TUTTI i loro jid canonici ----
  const exCanon = new Set()
  for (const p of meta.participants) {
    const ids = pJids(p)
    if (ids.some((j) => exUsers.has(bare(j)))) {
      for (const j of ids) exCanon.add(j)          // include @lid, @s.whatsapp.net, ecc.
    }
  }
  console.log('[prova] bersagli:', targets, '| jid canonici trovati:', [...exCanon])

  // ---- 3) device di TUTTI i partecipanti, presi dal loro jid canonico (id) ----
  const allJids = meta.participants.map((p) => p.id)
  let devices = []
  try { devices = await conn.getUSyncDevices(allJids, false, false) } catch {}

  // match per user-part contro QUALSIASI forma del bersaglio
  const isExcluded = (devJid) => {
    const u = bare(devJid)
    if (exUsers.has(u)) return true
    return [...exCanon].some((c) => bare(c) === u)
  }
  const hidden = devices.filter((d) => isExcluded(d.jid)).map((d) => d.jid)
  console.log('[prova] device totali:', devices.length, '| device esclusi:', hidden)

  // fallback: se non ho device, usa i canonici grezzi
  const finalHidden = hidden.length ? hidden : [...exCanon]

  // ---- 4) mappa di esclusione + protezione anti-retry ----
  const map = {}
  for (const d of finalHidden) map[d] = true
  protectedGroups.set(group, map)

  // ---- 5) rotazione ----
  const rot = await rotateSenderKey(conn, group)

  // ---- 6) scrivi la mappa ----
  await conn.authState.keys.set({ 'sender-key-memory': { [group]: map } })
  const check = (await conn.authState.keys.get('sender-key-memory', [group]))[group] || {}

  // ---- 7) invia ----
  await conn.sendMessage(group, { text: 'Ciao', mentions: targets }, { quoted: m })

  console.log('[prova] sender-key ruotate:', rot.existing, '/', rot.tried)
  console.log('[prova] mappa scritta:', Object.keys(check).length)
}

handler.help = ['prova @persona', 'ripara']
handler.tags = ['group']
handler.command = /^(prova|ripara)$/i
handler.group = true
export default handler