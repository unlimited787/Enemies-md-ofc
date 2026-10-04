let handler = async (m, { conn, text }) => {

  let mentioned = []

  try {

    mentioned =
      m?.mentionedJid ||
      m?.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
      []

  } catch (e) {

    mentioned = []
  }


 
  if (mentioned.length > 0) {

    const jid =
      mentioned[0]


    try {

      const url =
        await conn.profilePictureUrl(
          jid,
          'image'
        )


      if (!url) {

        return 
      }


  

      const number =
        jid
          .split('@')[0]
          .split(':')[0]


      await conn.sendMessage(
        m.chat,
        {
          image: {
            url
          },
          caption:
            `ecco`
        },
        {
          quoted: m
        }
      )


      return

    } catch (e) {

      console.error(
        '[PIC] Errore menzione:',
        e
      )


      return 
    }
  }


 

  let quotedParticipant = null


  try {

    quotedParticipant =
      m?.quoted?.sender ||
      m?.quoted?.participant ||
      m?.message?.extendedTextMessage
        ?.contextInfo
        ?.participant ||
      null

  } catch (e) {

    quotedParticipant = null
  }


  if (
    quotedParticipant &&
    quotedParticipant.endsWith('@s.whatsapp.net')
  ) {

    try {

      const url =
        await conn.profilePictureUrl(
          quotedParticipant,
          'image'
        )


      if (!url) {

        return 
      }


      const number =
        quotedParticipant
          .split('@')[0]
          .split(':')[0]


      await conn.sendMessage(
        m.chat,
        {
          image: {
            url
          },
          caption:
            `ecco`
        },
        {
          quoted: m
        }
      )


      return

    } catch (e) {

      console.error(
        '[PIC] Errore messaggio citato:',
        e
      )


      return 
    }
  }




  if (!text) {

    return m.reply(
      'Usa: .pic 393331234567\n' +
      'Oppure tagga una persona: .pic @utente'
    )
  }




  const number =
    text.replace(/\D/g, '')


  if (!number) {

    return 
  }


  const jid =
    `${number}@s.whatsapp.net`




  try {

    const url =
      await conn.profilePictureUrl(
        jid,
        'image'
      )


    if (!url) {

      return 
    }


    await conn.sendMessage(
      m.chat,
      {
        image: {
          url
        },
        caption:
          `ecco`
      },
      {
        quoted: m
      }
    )


  } catch (e) {

    console.error(
      '[PIC]',
      e
    )


    return 
  }
}




handler.help = [
  'pic <numero>',
  'pic @utente'
]

handler.tags = [
  'tools'
]

handler.command = [
  'pic'
]

handler.group = false


export default handler