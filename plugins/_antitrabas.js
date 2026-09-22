import * as fs from 'fs'

export async function before(m, { conn, isAdmin, isBotAdmin, usedPrefix }) {
    if (m.isBaileys && m.fromMe) return !0
    if (!m.isGroup) return !1

    let chat = global.db.data.chats[m.chat]
    let bot = global.db.data.settings[this.user.jid] || {}

    let delet = m.key?.participant || m.sender
    let bang = m.key?.id
    let name = await conn.getName(m.sender)

    let fakemek = {
        key: {
            participant: '0@s.whatsapp.net',
            remoteJid: '0@s.whatsapp.net'
        },
        message: {
            groupInviteMessage: {
                groupJid: '51995386439-1616969743@g.us',
                inviteCode: 'm',
                groupName: 'P',
                caption: '0',
                jpegThumbnail: null
            }
        }
    }

    const text = typeof m.text === 'string' ? m.text : ''

    if (chat.antiTraba && text.length > 3000) {
        if (isAdmin) return

        if (isBotAdmin && bot.restrict) {
            await conn.sendMessage(m.chat, {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: bang,
                    participant: delet
                }
            })

            setTimeout(() => {
                conn.groupParticipantsUpdate(
                    m.chat,
                    [m.sender],
                    'remove'
                ).catch(() => {})
            }, 1000)

        } else if (!bot.restrict) {
            return
        }
    }

    return !0
}