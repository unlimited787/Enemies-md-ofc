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

  /*
   * ============================================================
   * SOLO GRUPPI
   * ============================================================
   */

  if (!m?.isGroup)
    return true


  /*
   * ============================================================
   * CONTROLLO CHAT
   * ============================================================
   *
   * Questo deve essere il PRIMO controllo reale.
   *
   * Se antiSpam non è esattamente true,
   * questo plugin NON deve fare assolutamente nulla.
   */

  const chat =
    global.db?.data?.chats?.[m.chat]


  if (!chat)
    return true


  if (chat.antiSpam !== true)
    return true


  /*
   * ============================================================
   * ESCLUSIONI
   * ============================================================
   */

  if (
    isAdmin ||
    isOwner ||
    isROwner
  ) {
    return true
  }


  /*
   * ============================================================
   * CONFIGURAZIONE
   * ============================================================
   */

  const MAX_MESSAGES = 8
  const WINDOW = 4000


  /*
   * ============================================================
   * SENDER
   * ============================================================
   */

  const sender =
    m?.sender


  if (!sender)
    return true


  /*
   * ============================================================
   * INIZIALIZZA STORAGE
   * ============================================================
   */

  if (!this.spam)
    this.spam = {}


  if (!this.spam[m.chat])
    this.spam[m.chat] = {}


  if (!this.spam[m.chat][sender]) {

    this.spam[m.chat][sender] = []
  }


  /*
   * ============================================================
   * TIMESTAMP
   * ============================================================
   */

  const now =
    Date.now()


  /*
   * ============================================================
   * AGGIUNGI MESSAGGIO
   * ============================================================
 */

  this.spam[m.chat][sender].push(now)


  /*
   * Manteniamo solamente i messaggi
   * negli ultimi 4 secondi.
   */

  this.spam[m.chat][sender] =
    this.spam[m.chat][sender].filter(
      timestamp =>
        now - timestamp <= WINDOW
    )


  const messages =
    this.spam[m.chat][sender].length


  /*
   * ============================================================
   * NON È ANCORA SPAM
   * ============================================================
   */

  if (messages < MAX_MESSAGES)
    return true


  /*
   * ============================================================
   * BOT ADMIN?
   * ============================================================
   *
   * Se non può rimuovere l'utente,
   * non facciamo nulla.
   */

  if (!isBotAdmin)
    return true


  /*
   * ============================================================
   * RESTRICT
   * ============================================================
   */

  const bot =
    global.db?.data?.settings?.[this.user?.jid] || {}


  if (!bot.restrict)
    return true


  /*
   * ============================================================
   * SECONDO CONTROLLO AMMINISTRATORI
   * ============================================================
   */

  if (
    isAdmin ||
    isOwner ||
    isROwner
  ) {
    return true
  }


  /*
   * ============================================================
   * USER DATABASE
   * ============================================================
   */

  const user =
    global.db?.data?.users?.[sender]


  if (!user)
    return true


  /*
   * ============================================================
   * COOLDOWN
   * ============================================================
   */

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


  /*
   * ============================================================
   * SALVA L'AZIONE
   * ============================================================
 */

  user.antispam =
    now


  /*
   * ============================================================
   * RESET DEL CONTATORE
   * ============================================================
   *
   * Lo facciamo SOLO ora, quando abbiamo realmente
   * deciso di intervenire.
   */

  this.spam[m.chat][sender] = []


  /*
   * ============================================================
   * AVVISO
   * ============================================================
   */

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


    /*
     * ========================================================
     * REMOVE
     * ========================================================
     */

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
