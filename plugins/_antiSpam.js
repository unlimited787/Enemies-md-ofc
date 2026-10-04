let handler = m => m

handler.before = async function (
  m,
  {
    conn,
    isAdmin,
    isBotAdmin,
    isOwner,
    isROwner
  }
) {


  if (!m.isGroup)
    return true


  const chat =
    global.db.data.chats[m.chat]

  if (!chat?.antiSpam)
    return true


  const MAX_MESSAGES = 8
  const WINDOW = 4000


 
  if (!this.spam)
    this.spam = {}


  if (!this.spam[m.chat])
    this.spam[m.chat] = {}


  const sender =
    m.sender


 
  if (
    isAdmin ||
    isOwner ||
    isROwner
  ) {
    return true
  }


 
  if (!this.spam[m.chat][sender]) {

    this.spam[m.chat][sender] = []
  }


  const now =
    Date.now()


  this.spam[m.chat][sender].push(now)


 
  this.spam[m.chat][sender] =
    this.spam[m.chat][sender].filter(
      timestamp =>
        now - timestamp <= WINDOW
    )


  const messages =
    this.spam[m.chat][sender].length


 
  if (messages < MAX_MESSAGES)
    return true


  
  this.spam[m.chat][sender] = []


  if (!isBotAdmin)
    return true


  
  const bot =
    global.db.data.settings[this.user.jid] || {}


  if (!bot.restrict)
    return true


 
  if (
    isAdmin ||
    isOwner ||
    isROwner
  ) {
    return true
  }


  
  const user =
    global.db.data.users[sender]


  if (!user)
    return true


  const COOLDOWN =
    25 * 60 * 1000


  const lastAction =
    Number(user.antispam || 0)


  
  if (
    lastAction &&
    now - lastAction < COOLDOWN
  ) {
    return true
  }


  
  user.antispam =
    now


  const testo =
    '𝐒𝐏𝐀𝐌 𝐑𝐈𝐋𝐄𝐕𝐀𝐓𝐎 ⛔'


  try {

   
    await conn.reply(
      m.chat,
      testo,
      m,
      {
        mentions: [sender]
      }
    )


    
    await conn.groupParticipantsUpdate(
      m.chat,
      [sender],
      'remove'
    )

  } catch (e) {

    console.error(
      '[ANTISPAM]',
      e
    )
  }


  return true
}


export default handler