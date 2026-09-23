import os from 'os'
import util from 'util'
import sizeFormatter from 'human-readable'
let runtime = function(seconds) {
	seconds = Number(seconds);
	var d = Math.floor(seconds / (3600 * 24));
	var h = Math.floor(seconds % (3600 * 24) / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 60);
	var dDisplay = d > 0 ? d + (d == 1 ? " 𝐠𝐢𝐨𝐫𝐧𝐨, " : " 𝐠𝐢𝐨𝐫𝐧𝐢, ") : "";
	var hDisplay = h > 0 ? h + (h == 1 ? " 𝐨𝐫𝐚, " : " 𝐨𝐫𝐞, ") : "";
	var mDisplay = m > 0 ? m + (m == 1 ? " 𝐦𝐢𝐧𝐮𝐭𝐨, " : " 𝐦𝐢𝐧𝐮𝐭𝐢, ") : "";
	var sDisplay = s > 0 ? s + (s == 1 ? " 𝐬𝐞𝐜𝐨𝐧𝐝𝐨" : " 𝐬𝐞𝐜𝐨𝐧𝐝𝐢") : "";
	return dDisplay + hDisplay + mDisplay + sDisplay;
}
import MessageType from '@vkazee/baileys'
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
let speed = (neww - old).toFixed(4)
let info = `
 ══ •⊰❂⊱• ══
pong 
𝐁Ꮻ𝐓 attivo da \n
${runtime(process.uptime())}
 ══ •⊰❂⊱• ══
`.trim() 
conn.reply(m.chat, info, m)
}
handler.help = ['infobot', 'speed']
handler.tags = ['info', 'tools']
handler.command = /^(ping|speed|infobot)$/i
export default handler



function clockString(ms) {
let h = Math.floor(ms / 3600000)
let m = Math.floor(ms / 60000) % 60
let s = Math.floor(ms / 1000) % 60
console.log({ms,h,m,s})
return [h, m, s].map(v => v.toString().padStart(2, 0) ).join(':')}
