import fetch from 'node-fetch'

let handler = async (m, { text, usedPrefix, command }) => {
  if (!text) return m.reply(`Inserisci un testo! Esempio: ${usedPrefix + command} ciao`)

  try {
    await conn.sendPresenceUpdate('composing', m.chat)

    let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer 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',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [{ role: 'user', content: text }]
      })
    })

    let data = await response.json()

    // Se l'API restituisce un errore, lo stampa nel terminale e lo invia in chat
    if (data.error) {
      console.log('ERRORE GROQ API:', data.error)
      return m.reply(`Errore API: ${data.error.message}`)
    }

    let hasil = data.choices?.[0]?.message?.content

    if (hasil) {
      m.reply(hasil.trim())
    } else {
      m.reply('Nessuna risposta ricevuta dal modello.')
    }
  } catch (e) {
    console.error('ERRORE GENERICO:', e)
    m.reply(`Errore di connessione: ${e.message}`)
  }
}

handler.command = /^(andre)$/i
export default handler