

const URL_REGEX =
  /(?:(?:http?|ftp):\/\/|www\.)[^\s<>"'`]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s<>"'`]*)?/i


function normalizeText(text = '') {
  return String(text)
    .normalize('NFKC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}



function containsLink(text = '') {
  if (!text)
    return false

  const original = normalizeText(text)

  if (URL_REGEX.test(original)) {
    URL_REGEX.lastIndex = 0
    return true
  }

  URL_REGEX.lastIndex = 0

  const obfuscated = original
    .replace(/\s+/g, '')
    .replace(/\[\s*dot\s*\]/gi, '.')
    .replace(/\(\s*dot\s*\)/gi, '.')
    .replace(/\{\s*dot\s*\}/gi, '.')
    .replace(/\[\.\]/g, '.')

  return URL_REGEX.test(obfuscated)
}



function getMessageTexts(m) {
  const texts = []

  const add = value => {
    if (typeof value === 'string' && value.trim())
      texts.push(value)
  }


  add(m.text)
  add(m.caption)
  add(m.body)

  const msg =
    m.message ||
    m.msg ||
    null

  if (!msg)
    return [...new Set(texts)]



  add(msg.conversation)


  if (msg.extendedTextMessage) {
    add(msg.extendedTextMessage.text)

  }



  if (msg.imageMessage) {
    add(msg.imageMessage.caption)
  }



  if (msg.videoMessage) {
    add(msg.videoMessage.caption)
  }



  if (msg.documentMessage) {
    add(msg.documentMessage.caption)
    add(msg.documentMessage.fileName)
  }


 
  if (msg.audioMessage) {
    add(msg.audioMessage.fileName)
  }


  
  if (msg.stickerMessage) {
    add(msg.stickerMessage.fileName)
  }



if (msg.contactMessage) {

  add(
    msg.contactMessage.displayName
  )

  add(
    msg.contactMessage.vcard
  )
}




if (msg.contactsArrayMessage) {

  add(
    msg.contactsArrayMessage.displayName
  )

  const contacts =
    msg.contactsArrayMessage.contacts

  if (Array.isArray(contacts)) {

    for (const contact of contacts) {

      add(contact?.displayName)
      add(contact?.vcard)
    }
  }
}
 
  if (msg.buttonsResponseMessage) {
    add(msg.buttonsResponseMessage.selectedDisplayText)
    add(msg.buttonsResponseMessage.selectedButtonId)
  }


  
  if (msg.listResponseMessage) {
    add(msg.listResponseMessage.title)
    add(msg.listResponseMessage.description)
    add(msg.listResponseMessage.singleSelectReply?.selectedRowId)
  }


  
  if (msg.templateButtonReplyMessage) {
    add(msg.templateButtonReplyMessage.selectedDisplayText)
    add(msg.templateButtonReplyMessage.selectedId)
  }



  if (msg.interactiveResponseMessage) {
    const nativeFlow =
      msg.interactiveResponseMessage.nativeFlowResponseMessage

    if (nativeFlow) {
      add(nativeFlow.paramsJson)
    }
  }


  return [...new Set(texts)]
}


export async function before(
  m,
  {
    conn,
    args,
    usedPrefix,
    command,
    isAdmin,
    isBotAdmin
  }
) {


  if (m.isBaileys && m.fromMe)
    return true


 
  if (!m.isGroup)
    return false


  const chat = global.db.data.chats[m.chat]

  if (!chat?.antiLink)
    return true



  if (isAdmin)
    return true


  const bot =
    global.db.data.settings[this.user.jid] || {}


 
  const texts = getMessageTexts(m)

  const hasLink = texts.some(text => containsLink(text))


  if (!hasLink)
    return true


  let groupInvite = ''

  try {
    groupInvite =
      `chat.whatsapp.com/${await this.groupInviteCode(m.chat)}`
  } catch (e) {
    console.error(
      '[ANTILINK]err',
      e
    )
  }


  const containsGroupInvite =
    groupInvite &&
    texts.some(text =>
      normalizeText(text)
        .toLowerCase()
        .includes(groupInvite.toLowerCase())
    )


  if (containsGroupInvite)
    return true


 
  if (!isBotAdmin) {
    if (!bot.restrict)
      return true

    return true
  }



  try {

    await conn.sendMessage(m.chat, {
      delete: {
        remoteJid: m.chat,
        fromMe: false,
        id: m.key.id,
        participant: m.key.participant
      }
    })

  } catch (error) {

    console.error(
      '[ANTILINK] Errore eliminazione:',
      error
    )
  }

  

    try {

      await conn.groupParticipantsUpdate(
        m.chat,
        [m.sender],
        'remove'
      )

    } catch (error) {

      console.error(
        '[ANTILINK] Err',
        error
      )
    }
  


  return true
}