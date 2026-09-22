import {
  proto,
  generateWAMessageFromContent
} from '@whiskeysockets/baileys'

let handler = async (m, { conn }) => {
  if (!m.quoted) {
    return m.reply('Rispondi al messaggio che vuoi eliminare.')
  }

  let key = m.quoted.key
    ? { ...m.quoted.key }
    : {
        remoteJid: m.quoted.chat || m.chat,
        id: m.quoted.id,
        fromMe: !!m.quoted.fromMe,
        participant: m.quoted.sender
      }

  const isPayment =
    m.quoted.mtype === 'requestPaymentMessage' ||
    !!m.quoted.message?.requestPaymentMessage ||
    !!m.quoted.msg?.requestPaymentMessage

  console.log('\n========== ELIMINA ==========')
  console.log('Tipo:', m.quoted.mtype)
  console.log('Payment:', isPayment)
  console.log('Key originale:', key)

  if (!key?.id) {
    return m.reply('Non riesco a recuperare l\'ID del messaggio.')
  }

  if (isPayment) {
    console.log('[ELIMINA] Tentativo cancelPaymentRequest...')

    try {
      await conn.sendMessage(m.chat, {
        cancelPaymentRequest: key
      })

      console.log('[ELIMINA] cancelPaymentRequest inviato')
    } catch (e) {
      console.log('[ELIMINA] cancelPaymentRequest FALLITO:', e?.message || e)
    }

    await new Promise(resolve => setTimeout(resolve, 700))
  }

  console.log('[ELIMINA] Tentativo DELETE standard...')

  try {
    await conn.sendMessage(m.chat, {
      delete: key
    })

    console.log('[ELIMINA] DELETE standard inviato')
  } catch (e) {
    console.log('[ELIMINA] DELETE standard FALLITO:', e?.message || e)
  }

  await new Promise(resolve => setTimeout(resolve, 700))

  console.log('[ELIMINA] Tentativo REVOKE raw...')

  try {
    const revoke = generateWAMessageFromContent(
      m.chat,
      {
        protocolMessage: {
          key,
          type: proto.Message.ProtocolMessage.Type.REVOKE
        }
      },
      {
        userJid: conn.user?.id
      }
    )

    await conn.relayMessage(
      m.chat,
      revoke.message,
      {
        messageId: revoke.key.id
      }
    )

    console.log('[ELIMINA] REVOKE raw inviato:', key.id)
  } catch (e) {
    console.log('[ELIMINA] REVOKE raw FALLITO:', e?.message || e)
  }

  await m.reply(
    isPayment
      ? 'Richiesta di pagamento: tentate cancellazione nativa + delete + revoke.'
      : 'Delete + revoke inviati.'
  )
}

handler.command = ['elimina']
handler.group = true

export default handler