let handler = async () => {}

handler.participantsUpdate = async function ({ id, participants, action }) {
    if (!id?.endsWith('@g.us')) return

    const chat = global.db.data.chats[id]
    if (!chat) return

    if (chat.welcome !== true) return

    if (action !== 'add' && action !== 'remove') return

    let metadata
    try {
        metadata = global.groupCache.get(id) || await this.groupMetadata(id)
        global.groupCache.set(id, metadata)
    } catch {
        return
    }

    for (const participant of participants || []) {
        let jid = null

        if (typeof participant === 'string') {
            jid = this.decodeJid(participant)
        } else if (participant && typeof participant === 'object') {
            jid =
                participant.id ||
                participant.jid ||
                participant.lid ||
                participant.phoneNumber ||
                null

            if (typeof jid === 'string')
                jid = this.decodeJid(jid)
        }

        if (!jid || typeof jid !== 'string') continue

        const number = jid.split('@')[0]

        let name = global.nameCache?.get(jid)

        if (!name) {
            try {
                name = await this.getName(jid)
            } catch {
                name = number
            }

            name = name || number
            global.nameCache?.set(jid, name)
        }

        if (action === 'add') {
            let text = chat.sWelcome

            if (!text) {
                text = `👋 *Benvenuto/a @${number}!*\n\nBenvenuto/a nel gruppo *${metadata.subject}*`
            } else {
                text = text
                    .replace(/@user/g, `@${number}`)
                    .replace(/@name/g, name)
                    .replace(/@group/g, metadata.subject)
            }

            await this.sendMessage(id, {
                text,
                mentions: [jid]
            }).catch(() => {})
        }

        if (action === 'remove') {
            let text = chat.sBye

            if (!text) {
                text = `👋 *@${number} ha lasciato il gruppo.*`
            } else {
                text = text
                    .replace(/@user/g, `@${number}`)
                    .replace(/@name/g, name)
                    .replace(/@group/g, metadata.subject)
            }

            await this.sendMessage(id, {
                text,
                mentions: [jid]
            }).catch(() => {})
        }
    }
}

export default handler