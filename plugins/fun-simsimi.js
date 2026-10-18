// plugins/prova.js  (ESM)  — difensivo
import { jidNormalizedUser } from '@trashcore/baileys'

const norm = (j) => (j ? jidNormalizedUser(j) : null)
const bare = (j) => String(j ?? '').split('@')[0].split(':')[0]
const srvOf = (j) => String(j ?? '').split('@')[1] || ''

// estrae un JID da una voce device, qualunque forma abbia (stringa o oggetto)
const devJid = (d) => {
  if (!d) return ''
  if (typeof d === 'string') return d
  if (d.jid) return d.jid
  if (d.id) return d.id
  if (d.user) {
    const srv = d.server || 's.whatsapp.net'
    return d.device ? `${d.user}:${d.device}@${srv}` : `${d.user}@${srv}`
  }
  return ''
}

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
  const dev = String(jid).split('@')[0].includes(':') ? Number(String(jid).split('@')[0].split(':')[1]) : 0
  return `${group}::${dt === 0 ? u : `${u}_${dt}`}::${dev}`
}

const pJids = (p) => [p?.id, p?.lid, p?.phoneNumber, p?.participantAlt, p?.phoneNumberAlt].filter(Boolean)

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

  const meta = await conn.groupMetadata(group)
  const exUsers = new Set(targets.map(bare))

  // jid canonici dei bersagli, da OGNI forma presente nel metadata
  const exCanon = new Set()
  for (const p of meta.participants || []) {
    const ids = pJids(p)
    if (ids.some((j) => exUsers.has(bare(j)))) for (const j of ids) exCanon.add(j)
  }
  console.log('[prova] bersagli:', targets, '| canonici:', [...exCanon])

  // device di tutti i partecipanti
  const allJids = (meta.participants || []).map((p) => p.id || p.lid || p.phoneNumber).filter(Boolean)
  let devices = []
  try { devices = await conn.getUSyncDevices(allJids, false, false) } catch {}
  console.log('[prova] sample device:', JSON.stringify(devices?.[0]))

  const isExcluded = (j) => {
    const u = bare(j)
    return !!u && (exUsers.has(u) || [...exCanon].some((c) => bare(c) === u))
  }
  const hidden = (devices || []).map(devJid).filter(Boolean).filter(isExcluded)
  console.log('[prova] device totali:', devices?.length || 0, '| esclusi:', hidden)

  const finalHidden = hidden.length ? hidden : [...exCanon]
  const map = {}
  for (const d of finalHidden) map[d] = true
  protectedGroups.set(group, map)

  const rot = await rotateSenderKey(conn, group)
  await conn.authState.keys.set({ 'sender-key-memory': { [group]: map } })

  await conn.sendMessage(group, { text: 'Ciao', mentions: targets }, { quoted: m })

  console.log('[prova] ruotate:', rot.existing, '/', rot.tried, '| esclusi applicati:', finalHidden.length)
}

handler.help = ['prova @persona', 'ripara']
handler.tags = ['group']
handler.command = /^(prova|ripara)$/i
handler.group = true
export default handler