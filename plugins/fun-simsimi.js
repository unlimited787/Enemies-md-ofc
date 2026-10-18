// plugins/prova.js  (ESM) — DEFINITIVO
import { jidNormalizedUser } from '@trashcore/baileys'

const norm = (j) => (j ? jidNormalizedUser(j) : null)
const bare = (j) => String(j ?? '').split('@')[0].split(':')[0]

// estrae un JID da una voce device in QUALSIASI forma
const devJid = (d) => {
  if (!d) return ''
  if (typeof d === 'string') return d
  if (d.jid) return d.jid
  if (d.id) return d.id
  if (d.user) { const s = d.server || 's.whatsapp.net'; return d.device ? `${d.user}:${d.device}@${s}` : `${d.user}@${s}` }
  return ''
}
// tutti i JID possibili di un partecipante
const pJids = (p) => [p?.id, p?.lid, p?.phoneNumber, p?.participantAlt, p?.phoneNumberAlt].filter(Boolean)

const protectedGroups = new Map()
let patched = false
function installPatch(conn) {
  if (patched) return true
  const keys = conn?.authState?.keys
  if (!keys?.set) return false
  const orig = keys.set.bind(keys)
  keys.set = async (data) => {
    const skm = data?.['sender-key-memory']
    if (skm) for (const g of Object.keys(skm)) {
      if (skm[g] === null && protectedGroups.has(g)) skm[g] = { ...protectedGroups.get(g) }
    }
    return orig(data)
  }
  patched = true
  return true
}

// rotazione: prova TUTTE le varianti (utente PN e LID, suffissi, device) e cancella quelle reali
async function rotate(conn, group) {
  const me = conn.authState.creds.me
  const ids = new Set()
  for (const jid of [me.id, me.lid].filter(Boolean)) {
    const u = bare(jid)
    for (const suf of ['', '_0', '_1', '_2', '_3']) {
      for (const dev of new Set([0, me.deviceId].filter((x) => x != null))) ids.add(`${group}::${u}${suf}::${dev}`)
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

// device di tutti i partecipanti (come fa il motore)
async function allDevices(conn, meta) {
  const jids = (meta.participants || []).map((p) => p.id || p.lid || p.phoneNumber).filter(Boolean)
  for (const c of [true, false]) {
    try { const r = await conn.getUSyncDevices(jids, c, false); if (r?.length) return r.map(devJid).filter(Boolean) } catch {}
  }
  return []
}

// risolve i device del bersaglio incrociando usync + metadata + mappa del motore
async function resolveExcluded(conn, meta, targets) {
  const users = new Set(targets.map(bare))

  // usync diretto sul bersaglio (copre la conversione PN->LID)
  for (const c of [true, false]) {
    try { for (const d of await conn.getUSyncDevices(targets, c, false)) { const j = devJid(d); if (j) users.add(bare(j)) } } catch {}
  }
  // metadata: se una voce matcha, prendi TUTTI i suoi JID (id/lid/phone)
  for (const p of meta.participants || []) {
    const ids = pJids(p)
    if (ids.some((j) => users.has(bare(j)))) for (const j of ids) users.add(bare(j))
  }

  const all = await allDevices(conn, meta)

  // unisci anche le chiavi reali gia' scritte dal motore nella mappa (ground truth)
  try {
    const cur = (await conn.authState.keys.get('sender-key-memory', [meta.id || meta.jid]))[meta.id || meta.jid] || {}
    for (const k of Object.keys(cur)) if (!all.includes(k)) all.push(k)
  } catch {}

  const excluded = all.filter((j) => users.has(bare(j)))
  return { users, all, excluded }
}

let handler = async (m, { conn, text, command }) => {
  const group = m.chat
  if (!group?.endsWith('@g.us')) return
  const okPatch = installPatch(conn)

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
  const { users, all, excluded } = await resolveExcluded(conn, meta, targets)

  console.log('[prova] patch:', okPatch, '| device totali:', all.length, '| sample:', all[0])
  console.log('[prova] user bersaglio:', [...users])
  console.log('[prova] device esclusi:', excluded.length, excluded.slice(0, 4))

  // ---- TEST memoria+rotazione: tutti esclusi => nessuno deve leggere ----
  if (command === 'provat') {
    const mapAll = {}
    for (const j of all) mapAll[j] = true
    protectedGroups.set(group, mapAll)
    const r = await rotate(conn, group)
    await conn.authState.keys.set({ 'sender-key-memory': { [group]: mapAll } })
    await conn.sendMessage(group, { text: 'TEST: nessuno deve leggere' }, { quoted: m })
    console.log('[provat] ruotate:', r.existing, '/', r.tried)
    return
  }

  const map = {}
  for (const j of (excluded.length ? excluded : [...users])) map[j] = true
  protectedGroups.set(group, map)

  const r = await rotate(conn, group)
  await conn.authState.keys.set({ 'sender-key-memory': { [group]: map } })
  await conn.sendMessage(group, { text: 'Ciao', mentions: targets }, { quoted: m })

  console.log('[prova] ruotate:', r.existing, '/', r.tried, '| esclusi applicati:', Object.keys(map).length)
}

handler.help = ['prova @persona', 'provat', 'ripara']
handler.tags = ['group']
handler.command = /^(prova|provat|ripara)$/i
handler.group = true
export default handler