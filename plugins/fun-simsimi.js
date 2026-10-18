// plugins/prova.js  (ESM)
import { jidNormalizedUser } from '@trashcore/baileys'

const norm = (j) => (j ? jidNormalizedUser(j) : null)
const bare = (j) => String(j ?? '').split('@')[0].split(':')[0]
const srvOf = (j) => String(j ?? '').split('@')[1] || ''
const devJid = (d) => {
  if (!d) return ''
  if (typeof d === 'string') return d
  if (d.jid) return d.jid
  if (d.id) return d.id
  if (d.user) { const s = d.server || 's.whatsapp.net'; return d.device ? `${d.user}:${d.device}@${s}` : `${d.user}@${s}` }
  return ''
}
const pJids = (p) => [p?.id, p?.lid, p?.phoneNumber, p?.participantAlt, p?.phoneNumberAlt].filter(Boolean)

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

async function rotate(conn, group) {
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

async function rawDevices(conn, meta) {
  const jids = (meta.participants || []).map((p) => p.id || p.lid || p.phoneNumber).filter(Boolean)
  for (const useCache of [true, false]) {
    try { const r = await conn.getUSyncDevices(jids, useCache, false); if (r?.length) return r } catch {}
  }
  return []
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
  const raw = await rawDevices(conn, meta)
  console.log('[prova] sample device RAW:', JSON.stringify(raw?.[0]))
  console.log('[prova] device totali:', raw.length)

  const allDev = raw.map(devJid).filter(Boolean)
  const exUsers = new Set(targets.map(bare))
  const exCanon = new Set()
  for (const p of meta.participants || []) {
    const ids = pJids(p)
    if (ids.some((j) => exUsers.has(bare(j)))) for (const j of ids) exCanon.add(j)
  }
  console.log('[prova] bersagli:', targets, '| canonici:', [...exCanon])

  const cur = (await conn.authState.keys.get('sender-key-memory', [group]))[group] || {}
  const curKeys = Object.keys(cur)
  console.log('[prova] chiavi mappa motore:', curKeys.length, curKeys.slice(0, 6))

  const match = (u) => u && (exUsers.has(u) || [...exCanon].some((c) => bare(c) === u))
  const fromMap = curKeys.filter((k) => match(bare(k)))
  const fromDev = allDev.filter((k) => match(bare(k)))
  const excluded = [...new Set([...fromMap, ...fromDev])]
  console.log('[prova] esclusi -> da mappa:', fromMap.length, '| da device:', fromDev.length, '| tot:', excluded.length)

  // ---- TEST: tutti esclusi => nessuno deve leggere ----
  if (command === 'provat') {
    const all = {}
    for (const k of [...new Set([...curKeys, ...allDev])]) all[k] = true
    protectedGroups.set(group, all)
    const r = await rotate(conn, group)
    await conn.authState.keys.set({ 'sender-key-memory': { [group]: all } })
    await conn.sendMessage(group, { text: 'TEST: nessuno deve leggere' }, { quoted: m })
    console.log('[provat] all-true:', Object.keys(all).length, '| ruotate:', r.existing, '/', r.tried)
    return
  }

  const finalExcluded = excluded.length ? excluded : [...exCanon]
  const map = {}
  for (const k of finalExcluded) map[k] = true
  protectedGroups.set(group, map)

  const r = await rotate(conn, group)
  await conn.authState.keys.set({ 'sender-key-memory': { [group]: map } })
  await conn.sendMessage(group, { text: 'Ciao', mentions: targets }, { quoted: m })

  const after = (await conn.authState.keys.get('sender-key-memory', [group]))[group] || {}
  console.log('[prova] ruotate:', r.existing, '/', r.tried, '| mappa dopo invio:', Object.keys(after).length)
}

handler.help = ['prova @persona', 'provat', 'ripara']
handler.tags = ['group']
handler.command = /^(prova|provat|ripara)$/i
handler.group = true
export default handler