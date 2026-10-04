


let handler = m => m


handler.before = async function (
  m,
  {
    conn
  }
) {


  if (!m?.isGroup)
    return true



  const chat =
    global.db?.data?.chats?.[m.chat]


  /*
   * Se detect non è attivo,
   * questo plugin non fa assolutamente nulla.
   */

  if (!chat)
    return true


  if (chat.detect !== true)
    return true




  let action =
    m?.messageStubType ||
    m?.stubType ||
    m?.messageStubParameters?.type ||
    m?.action ||
    null



  if (typeof action === 'string') {

    action =
      action.toLowerCase()
  }


 

  let type = null


  if (
    action === 'promote' ||
    action === 'promoted'
  ) {

    type = 'promote'

  } else if (
    action === 'demote' ||
    action === 'demoted'
  ) {

    type = 'demote'
  }




  if (
    type === null &&
    typeof action === 'number'
  ) {

    if (action === 29)
      type = 'promote'

    else if (action === 30)
      type = 'demote'
  }


 

  if (!type)
    return true


 

  let participants = []


  /*
   * Primo tentativo:
   */

  if (
    Array.isArray(
      m?.messageStubParameters
    )
  ) {

    participants =
      m.messageStubParameters
  }


  /*
   * Alcuni fork usano m.participants.
   */

  if (
    !participants.length &&
    Array.isArray(m?.participants)
  ) {

    participants =
      m.participants
  }




  if (
    !participants.length &&
    typeof m?.messageStubParameters === 'string'
  ) {

    participants = [
      m.messageStubParameters
    ]
  }




  participants =
    participants
      .map(p => {

        if (typeof p !== 'string')
          return null

        return p
      })
      .filter(Boolean)



  if (!participants.length)
    return true




  const actor =
    m?.participant ||
    m?.sender ||
    m?.key?.participant ||
    null



  let text


  if (type === 'promote') {

    text =
      chat.sPromote ||
      this.spromote ||
      conn.spromote ||
      '@user ```è ora admin```'

  } else {

    text =
      chat.sDemote ||
      this.sdemote ||
      conn.sdemote ||
      '@user ```non è piu admin```'
  }



  for (const participant of participants) {

    /*
     * Numero senza @s.whatsapp.net
     */

    const number =
      participant
        .split('@')[0]
        .split(':')[0]



    let message =
      String(text)
        .replace(
          /@user/g,
          '@' + number
        )


 

    message =
      message
        .replace(
          /@target/g,
          '@' + number
        )


    /*
     * @admin = chi ha eseguito l'azione,
     * quando disponibile.
     */

    if (actor) {

      const actorNumber =
        actor
          .split('@')[0]
          .split(':')[0]


      message =
        message.replace(
          /@admin/g,
          '@' + actorNumber
        )
    }



    const mentions = [
      participant
    ]


    if (
      actor &&
      actor !== participant
    ) {

      mentions.push(actor)
    }



    try {

      await conn.sendMessage(
        m.chat,
        {
          text: message,
          mentions
        }
      )

    } catch (e) {

      console.error(
        '[GROUP-DETECT] Errore invio:',
        e
      )
    }
  }


  return true
}


handler.help = [
  'detect'
]

handler.tags = [
  'group'
]

handler.command = []


export default handler