export async function before(m, { isAdmin, groupMetadata, isBotAdmin }) {
  if (m.isBaileys && m.fromMe) return !0
  if (!m.isGroup) return !1

  let chat = global.db.data.chats[m.chat]
  let delet = m.key.participant
  let bang = m.key.id

  // Controllo per identificare i messaggi di tipo RequestPaymentMessage
  const isPaymentRequest = Boolean(
    m.message?.requestPaymentMessage || 
    m.msg?.requestPaymentMessage ||
    m.mtype === 'requestPaymentMessage'
  )

  // Se la funzione antipagamentospam non è attiva nel gruppo, ignora
  if (!chat?.antipagamentospam) return !0

  // Se il messaggio è una richiesta di pagamento ed è inviato da un utente NON admin
  if (isPaymentRequest && !isAdmin) {
    if (!isBotAdmin) return !0 // Il bot non ha i permessi per eliminare o rimuovere

    try {
      // 1. Elimina prima il messaggio
      await this.sendMessage(m.chat, { 
        delete: { remoteJid: m.chat, fromMe: false, id: bang, participant: delet } 
      })

      // 2. Rimuovi poi l'utente dal gruppo
      await this.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
    } catch (e) {
      console.error(e)
    }
  }

  return !0
}