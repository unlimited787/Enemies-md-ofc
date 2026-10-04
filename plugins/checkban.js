import fetch from 'node-fetch'

const URL = 'https://7107.api.greenapi.com/waInstance710722755372/unbanStatus/a181d957d05842f19bcc3690a7645f029ff1e3ecbd4843ff8e'

function normalizeNumber(number = '') {
  return String(number)
    .replace(/@s\.whatsapp\.net/g, '')
    .replace(/@c\.us/g, '')
    .replace(/\D/g, '')
    .replace(/^00/, '')
}

function getStatus(status) {
  switch (status) {
    case 'UNBANNED':
      return '?? Account sbloccato'
    case 'IN_REVIEW':
      return '?? Richiesta in revisione'
    case 'PERMANETLY_BANNED':
      return '?? Account permanentemente bannato'
    case 'NO_APPEAL_OPEN':
      return '? Nessuna richiesta di sblocco'
    default:
      return `? ${status || 'Sconosciuto'}`
  }
}

let handler = async function (m, { text, usedPrefix, command }) {

  let number = text?.trim() || ''

  if (!number && m.quoted?.sender) {
    number = m.quoted.sender.split('@')[0]
  }

  number = normalizeNumber(number)

  if (!number) {
    return m.reply(
      `? Usa ${usedPrefix}${command} 393xxxxxxxxx\n` +
      `oppure rispondi a un messaggio con ${usedPrefix}${command}`
    )
  }

  await m.reply('?? Controllo account...')

  try {

    const response = await fetch(URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: Number(number)
      })
    })

    const raw = await response.text()

    let data

    try {
      data = JSON.parse(raw)
    } catch {
      data = null
    }

    if (!response.ok) {
      return m.reply(
        `? *CHECKBAN*\n\n` +
        `HTTP: ${response.status}\n` +
        `${data?.message || data?.error || raw || 'Errore sconosciuto'}`
      )
    }

    if (!data?.status) {
      return m.reply(
        `? *CHECKBAN*\n\n` +
        `Risposta API non valida:\n${raw}`
      )
    }

    let message =
      `?? *CHECKBAN*\n\n` +
      `?? Numero: +${number}\n` +
      `?? Stato: ${getStatus(data.status)}`

    if (data.reason) {
      message += `\n?? Motivo: ${data.reason}`
    }

    return m.reply(message)

  } catch (error) {

    console.error('[CHECKBAN]', error)

    return m.reply(
      `? *CHECKBAN*\n\n` +
      `${error.message || 'Errore di connessione'}`
    )
  }
}

handler.help = ['checkban <numero>']
handler.tags = ['owner']
handler.command = /^checkban$/i

export default handler