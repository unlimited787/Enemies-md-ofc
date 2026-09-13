let handler = m => m
handler.before = async function (m, {conn, isAdmin, isBotAdmin, isOwner, isROwner} ) {  
if (!m.isGroup) return !1
let chat = global.db.data.chats[m.chat]
let delet = m.key.participant
let bang = m.key.id
let bot = global.db.data.settings[this.user.jid] || {}
let user = global.db.data.users[m.sender]

this.spam = this.spam ? this.spam : {}
if (!(m.sender in this.spam)) {
let spaming = {
jid: await m.sender, 
spam: 0,
lastspam: 0
}
this.spam[spaming.jid] = spaming
  
} else try {
this.spam[m.sender].spam += 1
  
if (new Date - this.spam[m.sender].lastspam > 4000) {
if (this.spam[m.sender].spam > 7) {
this.spam[m.sender].spam = 0
  
this.spam[m.sender].lastspam = new Date * 1
let tiempo = 300000 * 5
let time = user.antispam + tiempo * 1
let texto = `𝐒𝐏𝐀𝐌 𝐑𝐈𝐋𝐄𝐕𝐀𝐓𝐎 ⛔` 

if (!chat.antiSpam) return
if (new Date - user.antispam < tiempo * 1) return
if (isBotAdmin && chat.antiSpam && !isAdmin && !isOwner && !isROwner && bot.restrict) {
await conn.reply(m.chat, texto,  m, { mentions: this.parseMention(texto) })

conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
user.antispam = new Date * 1  
  
} else {
this.spam[m.sender].spam = 0
this.spam[m.sender].lastspam = new Date * 1
}}}
  
} catch (e) {
console.log(e)
}}
export default handler

function msToTime(duration) {
var milliseconds = parseInt((duration % 1000) / 100),
seconds = Math.floor((duration / 1000) % 60),
minutes = Math.floor((duration / (1000 * 60)) % 60),
hours = Math.floor((duration / (1000 * 60 * 60)) % 24)

hours = (hours < 10) ? "0" + hours : hours
minutes = (minutes < 10) ? "0" + minutes : minutes
seconds = (seconds < 10) ? "0" + seconds : seconds

return minutes + " m y " + seconds + " s " 
}