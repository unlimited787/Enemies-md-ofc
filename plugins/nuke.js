

let handler = async (m, { conn, args, groupMetadata, participants, usedPrefix, command, isBotAdmin, isSuperAdmin }) => {
let ps = participants.map(u => u.id).filter(v => v !== conn.user.jid) 
let bot = global.db.data.settings[conn.user.jid] || {}
if (ps == '') return 
const delay = time => new Promise(res=>setTimeout(res,time));
switch (command) {
case "nuke":  
if (!bot.restrict) return 
if (!isBotAdmin) return       
let ownerGroup = m.chat.split`-`[0] + '@s.whatsapp.net'
let users = participants.map(u => u.id).filter(v => v !== conn.user.jid)   
if (isBotAdmin && bot.restrict) { 
await delay(1)    
let responseb = await conn.groupParticipantsUpdate(m.chat, users, 'remove')
if (responseb[0].status === "404") 
await delay(1)
} else return 
break           
}}
handler.command = /^(hhahahahahhaa3555553|nuke)$/i
handler.group = handler.botAdmin = handler.owner = true
handler.fail = null
export default handler
