let handler = async (m, { text, conn, isOwner, isROwner }) => {

  const botNumber = conn.user?.id?.split(':')[0]?.replace(/[^0-9]/g, '')
  const senderNumber = m.sender?.split('@')[0]?.replace(/[^0-9]/g, '')

  const isBot = senderNumber === botNumber

  if (!isROwner && !isOwner && !isBot) return

  let number

  if (m.quoted) {
    number = m.quoted.sender.split('@')[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net'
  } else if (text) {
    number = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net'
  } else {
    return m.reply('Scrivi un numero (senza +) o rispondi a un messaggio')
  }

  const clean = number.split('@')[0]

  const alreadyInOwner = global.owner.some(([num]) => num === clean)
  if (alreadyInOwner) return 

  global.owner.push([clean, 'Co-Owner', true])

  if (!global.db.data.owners) global.db.data.owners = []
  if (!global.db.data.owners.includes(number)) {
    global.db.data.owners.push(number)
  }

  m.reply(`${clean} aggiunto come owner. Nota: al riavvio del bot dovrai rifarlo.`)
}

handler.command = /^setowner$/i

export default handler
