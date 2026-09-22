let handler = m => m
handler.before = async function (m, {conn, isAdmin, isBotAdmin, isOwner, isROwner, participants} ) {
if (!m.isGroup) return !1
let chat = global.db.data.chats[m.chat]
let delet = m.key.participant
let bang = m.key.id 

let bot = global.db.data.settings[conn.user.jid] || {}
let users = participants.map(u => u.id).filter(v => v !== conn.user.jid) 
for (let user of users) {  
if (isBotAdmin && chat.antiArab && !isAdmin && !isOwner && !isROwner && bot.restrict) {
   
if (user.startsWith('22' || '22')) {
conn.groupParticipantsUpdate(m.chat, [user], 'remove')
let responseb = await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet }})  
}  

if (user.startsWith('23' || '23')) {
conn.groupParticipantsUpdate(m.chat, [user], 'remove')
let responseb = await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet }}) 
} 

if (user.startsWith('24' || '24')) {
conn.groupParticipantsUpdate(m.chat, [user], 'remove')
let responseb = await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet }}) 
} 

if (user.startsWith('25' || '25')) {
conn.groupParticipantsUpdate(m.chat, [user], 'remove')
let responseb = await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet }})
} 

if (user.startsWith('26' || '26')) {
conn.groupParticipantsUpdate(m.chat, [user], 'remove')
let responseb = await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet }})
} 

if (user.startsWith('213' || '213')) {
conn.groupParticipantsUpdate(m.chat, [user], 'remove')
let responseb = await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet }}) 
} 	

if (user.startsWith('215' || '215')) {
conn.groupParticipantsUpdate(m.chat, [user], 'remove')
let responseb = await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet }})
} 

if (user.startsWith('216' || '216')) {
conn.groupParticipantsUpdate(m.chat, [user], 'remove')
let responseb = await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet }})
} 

if (user.startsWith('217' || '217')) {
conn.groupParticipantsUpdate(m.chat, [user], 'remove')
let responseb = await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet }})
} 

if (user.startsWith('218' || '218')) {
conn.groupParticipantsUpdate(m.chat, [user], 'remove')
let responseb = await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet }})
} 

if (user.startsWith('9' || '9')) {
conn.groupParticipantsUpdate(m.chat, [user], 'remove')
let responseb = await conn.sendMessage(m.chat, { delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet }}) 
} 	
   
}}}
export default handler
