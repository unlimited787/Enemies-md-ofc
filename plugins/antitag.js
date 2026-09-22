let handler = m => m

handler.before = async function (m, { participants, conn, isBotAdmin, isAdmin }) {
    if (!m.isGroup) return

    const users = (participants || []).map(u => conn.decodeJid(u.id))
    const frocio = users.length - 1

    const chat = global.db.data.chats[m.chat]
    const delet = m.key?.participant || m.sender
    const bang = m.key?.id

    const mentionedJid = m.mentionedJid || []

    if (isBotAdmin && !isAdmin) {
        if (mentionedJid.length >= 20) {
            await conn.groupParticipantsUpdate(m.chat, [m.sender], 'remove')

            if (bang) {
                await conn.sendMessage(m.chat, {
                    delete: {
                        remoteJid: m.chat,
                        fromMe: false,
                        id: bang,
                        participant: delet
                    }
                })
            }
        }
    }
}

export default handler