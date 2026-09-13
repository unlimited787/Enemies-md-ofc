let handler = async (m, { conn, text, usedPrefix, command }) => {
  // Esempio d'uso: .richiedipagamento 50000 EUR
  // Nota: I prezzi in Baileys sono espressi in millesimi (50.00 EUR = 50000)
  
  let args = text ? text.split(' ') : []
  let amount = args[0] ? parseInt(args[0]) : 10000 // 10.00 EUR di default
  let currency = args[1] ? args[1].toUpperCase() : 'EUR'

  try {
    const paymentMessage = {
      requestPaymentMessage: {
        currencyCodeIso4217: currency,
        amount1000: amount,
        requestFrom: m.sender,
        noteMessage: {
          extendedTextMessage: {
            text: args.slice(2).join(' ') || 'Richiesta di pagamento via Bot'
          }
        },
        expiryTimestamp: Math.floor(Date.now() / 1000) + 86400 // Scade tra 24 ore
      }
    }

    // Invia il messaggio nativo
    await conn.relayMessage(m.chat, paymentMessage, {})

  } catch (e) {
    console.error(e)
    m.reply(`Errore durante l'invio del pagamento: ${e.message}`)
  }
}

handler.command = /^(richiedipagamento|requestpayment|paga)$/i
export default handler