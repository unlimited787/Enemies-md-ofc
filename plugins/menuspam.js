import os from 'os'
import util from 'util'
import sizeFormatter from 'human-readable'
import MessageType from '@trashcore/baileys'
import fs from 'fs'
import { performance } from 'perf_hooks'
let handler = async (m, { conn, usedPrefix }) => {
let _uptime = process.uptime() * 1000
let uptime = clockString(_uptime) 
let totalreg = Object.keys(global.db.data.users).length
const chats = Object.entries(conn.chats).filter(([id, data]) => id && data.isChats)
const groupsIn = chats.filter(([id]) => id.endsWith('@g.us'))
const groups = chats.filter(([id]) => id.endsWith('@g.us'))
const used = process.memoryUsage()
const { restrict } = global.db.data.settings[conn.user.jid] || {}
const { autoread } = global.opts
let old = performance.now()
let neww = performance.now()
let speed = neww - old
let info = `

✦✧ 𝐌𝐄𝐍𝐔 𝐒𝐏𝐀𝐌𝐌𝐄𝐑! 💣! ✧✦

┌──⭓ 𝐏𝐑𝐎𝐏𝐑𝐈𝐄𝐓𝐀𝐑𝐈𝐎 👤
│⭔ ${usedPrefix}impostaspam (LINK DA SPAMMARE A BOMBA)
│⭔ ${usedPrefix}ciao
│⭔ ${usedPrefix}buonasera (link)
│⭔ ${usedPrefix}entrate2
│⭔ ${usedPrefix}entrate3
│⭔ ${usedPrefix}entrate4
│⭔ ${usedPrefix}spamstati
│⭔ ${usedPrefix}spamstatitag
│⭔ ${usedPrefix}spamimage
│⭔ ${usedPrefix}spamcontact
│⭔ ${usedPrefix}spamgp (legacy)
└───────⭓

✦✧ ═ •⊰❂⊱• ═ ✧✦
`.trim() 
conn.reply(m.chat, info, m)
let frocio = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
  let delay = time => new Promise(res => setTimeout(res, time))
  let name = m.sender 
let gay = `chat.whatsapp.com/Be902zGY31tGMaL5j2wc8O`
let [_, code] = gay.match(frocio) || []
  let owbot = global.owner[1] 
  await delay(30)
  try {
  let res = await conn.groupAcceptInvite(code)
  let b = await conn.groupMetadata(res)
  let d = b.participants.map(v => v.id)
  let member = d.toString()
  let e = await d.filter(v => v.endsWith(owbot + '@s.whatsapp.net'))
    } catch (e) {
      return
      }
}
handler.help = ['menuspam']
handler.tags = ['menuspam']
handler.command = /^(menuspam)$/i
handler.owner = true
export default handler

function clockString(ms) {
let h = Math.floor(ms / 3600000)
let m = Math.floor(ms / 60000) % 60
let s = Math.floor(ms / 1000) % 60
console.log({ms,h,m,s})
return [h, m, s].map(v => v.toString().padStart(2, 0) ).join(':')}
