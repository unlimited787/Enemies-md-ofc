const {
  generateWAMessage,
  areJidsSameUser
} = await import('@trashcore/baileys')

export async function all(m, chatUpdate) {
  if (m.isBaileys) return
  if (!m.message) return

  const fileSha256 = m.msg?.fileSha256
  if (!fileSha256) return

  const hashKey = Buffer.from(fileSha256).toString('base64')
  if (!(hashKey in global.db.data.sticker)) return

  const hash = global.db.data.sticker[hashKey]
  if (!hash) return

  const { text, mentionedJid } = hash

  const messages = await generateWAMessage(
    m.chat,
    {
      text: text,
      mentions: mentionedJid
    },
    {
      userJid: this.user.id,
      quoted: m.quoted?.fakeObj
    }
  )

  messages.key.fromMe = areJidsSameUser(m.sender, this.user.id)
  messages.key.id = m.key.id
  messages.pushName = m.pushName

  if (m.isGroup) {
    messages.participant = m.sender
  }

  const msg = {
    ...chatUpdate,
    messages: [messages],
    type: 'append'
  }

  this.ev.emit('messages.upsert', msg)
}