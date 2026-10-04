import {
  generateWAMessageFromContent
} from '@trashcore/baileys'

const sleep = ms =>
  new Promise(resolve => setTimeout(resolve, ms))

const REQUEST_TIMEOUT = 5000

function getKey(m) {

  const q = m.quoted

  if (!q)
    return null

  const k = q.key || {}

  const id =
    k.id ||
    q.id

  if (!id)
    return null

  const key = {
    remoteJid:
      k.remoteJid ||
      q.chat ||
      m.chat,

    id,

    fromMe:
      Boolean(
        k.fromMe ??
        q.fromMe
      )
  }

  const participant =
    k.participant ||
    q.sender

  if (participant)
    key.participant = participant

  return key
}

function getType(q) {

  if (q?.mtype)
    return q.mtype

  if (q?.message) {

    const keys =
      Object.keys(q.message)

    if (keys.length)
      return keys[0]
  }

  if (q?.msg) {

    const keys =
      Object.keys(q.msg)

    if (keys.length)
      return keys[0]
  }

  return 'unknown'
}

function isPayment(q) {

  return Boolean(
    q?.mtype === 'requestPaymentMessage' ||
    q?.message?.requestPaymentMessage ||
    q?.msg?.requestPaymentMessage ||
    q?.requestPaymentMessage
  )
}

async function run(name, fn) {

  try {

    const result = await Promise.race([
      Promise.resolve().then(fn),

      new Promise((_, reject) =>
        setTimeout(
          () => reject(
            new Error('Timeout')
          ),
          REQUEST_TIMEOUT
        )
      )
    ])

    console.log(
      `[ELIMINA] ${name}: OK`
    )

    return {
      name,
      ok: true,
      result
    }

  } catch (error) {

    console.error(
      `[ELIMINA] ${name}:`,
      error?.message || error
    )

    return {
      name,
      ok: false,
      error:
        error?.message ||
        String(error)
    }
  }
}

async function deleteRequest(
  conn,
  chat,
  key
) {

  return run(
    'DELETE',
    () =>
      conn.sendMessage(
        chat,
        {
          delete: key
        }
      )
  )
}

async function declineRequest(
  conn,
  chat,
  key
) {

  return run(
    'DECLINE_PAYMENT',
    () =>
      conn.sendMessage(
        chat,
        {
          declinePaymentRequest: key
        }
      )
  )
}

async function cancelRequest(
  conn,
  chat,
  key
) {

  return run(
    'CANCEL_PAYMENT',
    () =>
      conn.sendMessage(
        chat,
        {
          cancelPaymentRequest: key
        }
      )
  )
}

async function revokeRequest(
  conn,
  chat,
  key
) {

  return run(
    'RAW_REVOKE',
    async () => {

      const revoke =
        generateWAMessageFromContent(
          chat,
          {
            protocolMessage: {
              key: {
                remoteJid:
                  key.remoteJid,

                id:
                  key.id,

                fromMe:
                  key.fromMe,

                ...(key.participant
                  ? {
                      participant:
                        key.participant
                    }
                  : {})
              },

              type: 0
            }
          },
          {
            userJid:
              conn.user?.id
          }
        )

      if (!revoke?.message)
        throw new Error(
          'ProtocolMessage non generato'
        )

      await conn.relayMessage(
        chat,
        revoke.message,
        {
          messageId:
            revoke.key?.id
        }
      )

      return true
    }
  )
}

async function executePaymentCleanup(
  conn,
  chat,
  key
) {

  const results = []

  /*
   * 1. DELETE
   */
  results.push(
    await deleteRequest(
      conn,
      chat,
      key
    )
  )

  await sleep(250)

  /*
   * 2. DECLINE
   */
  results.push(
    await declineRequest(
      conn,
      chat,
      key
    )
  )

  await sleep(250)

  /*
   * 3. CANCEL
   */
  results.push(
    await cancelRequest(
      conn,
      chat,
      key
    )
  )

  await sleep(250)

  /*
   * 4. RAW REVOKE
   */
  results.push(
    await revokeRequest(
      conn,
      chat,
      key
    )
  )

  return results
}

async function executeNormalCleanup(
  conn,
  chat,
  key
) {

  const results = []

  results.push(
    await deleteRequest(
      conn,
      chat,
      key
    )
  )

  await sleep(250)

  results.push(
    await revokeRequest(
      conn,
      chat,
      key
    )
  )

  return results
}

let handler = async function (
  m,
  { conn, isBotAdmin }
) {

  if (!m.isGroup)
    return m.reply(
      'Questo comando funziona solo nei gruppi.'
    )

  if (!m.quoted)
    return m.reply(
      'Rispondi al messaggio che vuoi eliminare.'
    )

  const key =
    getKey(m)

  if (!key?.id) {

    return m.reply(
      '? Impossibile recuperare la key del messaggio.'
    )
  }

  const type =
    getType(m.quoted)

  const payment =
    isPayment(m.quoted)

  console.log(
    '\n========== ELIMINA =========='
  )

  console.log(
    'Tipo:',
    type
  )

  console.log(
    'Payment:',
    payment
  )

  console.log(
    'RemoteJid:',
    key.remoteJid
  )

  console.log(
    'ID:',
    key.id
  )

  console.log(
    'FromMe:',
    key.fromMe
  )

  console.log(
    'Participant:',
    key.participant
  )

  if (!key.fromMe && !isBotAdmin) {

    return m.reply(
      '? Il bot deve essere admin per eliminare questo messaggio.'
    )
  }

  const results =
    payment

      ? await executePaymentCleanup(
          conn,
          m.chat,
          key
        )

      : await executeNormalCleanup(
          conn,
          m.chat,
          key
        )

  const successful =
    results
      .filter(x => x.ok)
      .map(x => x.name)

  const failed =
    results
      .filter(x => !x.ok)
      .map(x => x.name)

  console.log(
    '\n========== RISULTATO =========='
  )

  console.log(
    'Riusciti:',
    successful.join(', ') || 'nessuno'
  )

  console.log(
    'Falliti:',
    failed.join(', ') || 'nessuno'
  )

  if (!successful.length) {

    return m.reply(
      '? Nessuna operazione è stata accettata da WhatsApp.'
    )
  }

  if (payment) {

    return m.reply(
      `? Payment cleanup eseguito.\n\nAccettati: ${successful.join(', ')}`
    )
  }

  return m.reply(
    `? Operazioni di eliminazione eseguite.\n\nAccettati: ${successful.join(', ')}`
  )
}

handler.command = ['elimina']
handler.group = true

export default handler
