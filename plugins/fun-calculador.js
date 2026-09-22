let handler = async (m, { conn, command, text }) => {
    const mentions = Array.isArray(m.mentionedJid)
        ? m.mentionedJid.filter(Boolean)
        : []

    let user = null

    if (mentions.length) {
        user = mentions[0]
    } else if (m.quoted?.sender) {
        user = m.quoted.sender
    }

    if (!user && !text) return
    if (!user && text) return

    const number = user
        ? user.split('@')[0]
        : ''

    const name = `@${number}`

    const percent = Math.floor(Math.random() * 101)

    let result

    switch (command.toLowerCase()) {
        case 'pajero':
        case 'pajera':
            result = 'oko'
            break

        case 'gay':
        case 'frocio':
            result = `${name} è ${command.replace('how', '')} 🏳️‍🌈 al ${percent}%`
            break

        case 'lesbica':
            result = `${name} è ${command.replace('how', '')} 🏳️‍🌈 al ${percent}%`
            break

        case 'nero':
        case 'nera':
            result = `${name} è ⚫ ${command.replace('how', '')} al ${percent}%`
            break

        case 'puttana':
            result = `${name} è al ${percent}% ${command.replace('how', '')} 🔞`
            break

        case 'random':
            result = `${name} è al ${percent}% ${command.replace('how', '')} 🤡`
            break

        case 'puttaniere':
            result = `${name} è al ${percent}% ${command.replace('how', '')} 🔞`
            break

        case 'puto':
        case 'manco':
        case 'manca':
        case 'rata':
        case 'prostituta':
            result = `${name} è al ${percent}% ${command.replace('how', '')}`
            break

        default:
            return
    }

    await conn.reply(
        m.chat,
        result.trim(),
        m,
        {
            mentions: [user]
        }
    )
}

handler.help = [
    'gay',
    'lesbica',
    'pajero',
    'pajera',
    'puto',
    'puttana',
    'manco',
    'manca',
    'rata',
    'prostituta',
    'puttaniere'
].map(v => v + ' @tag | nombre')

handler.tags = ['calculator']

handler.command = /^(gay|lesbica|frocio|random|puto|puttana|nero|nera|rata|prostituta|puttaniere|pajero|pajera|manco|manca)$/i

export default handler