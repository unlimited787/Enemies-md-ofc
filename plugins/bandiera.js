import bandiere from './bandiere-data.js'

const activeGames = new Map()

const LETTERS = ['A', 'B', 'C', 'D']
const TIME_LIMIT = 30 * 1000

let handler = async (m, { conn }) => {
    const chat = m.chat

    // Controlla se c'è già una partita attiva
    if (activeGames.has(chat)) {
        const game = activeGames.get(chat)

        const remaining = Math.max(
            0,
            Math.ceil((game.expiresAt - Date.now()) / 1000)
        )

        return conn.reply(
            chat,
            `🚩 *BANDIERA GIÀ ATTIVA!*\n\n` +
            `${game.flag}\n\n` +
            `🅰️ ${game.options[0]}\n` +
            `🅱️ ${game.options[1]}\n` +
            `🇨 ${game.options[2]}\n` +
            `🇩 ${game.options[3]}\n\n` +
            `⏱️ Tempo rimanente: *${remaining}s*\n\n` +
            `Rispondi con *A, B, C o D*.`,
            m
        )
    }

    if (!Array.isArray(bandiere) || bandiere.length === 0) {
        return conn.reply(
            chat,
            '❌ Il database delle bandiere è vuoto.',
            m
        )
    }

    // Sceglie una bandiera casuale
    const question = bandiere[
        Math.floor(Math.random() * bandiere.length)
    ]

    // Controllo formato
    if (
        !question.flag ||
        !Array.isArray(question.options) ||
        question.options.length !== 4 ||
        typeof question.answer !== 'number' ||
        question.answer < 0 ||
        question.answer > 3
    ) {
        return conn.reply(
            chat,
            '❌ Una bandiera nel database non è configurata correttamente.',
            m
        )
    }

    const expiresAt = Date.now() + TIME_LIMIT

    const game = {
        flag: question.flag,
        options: question.options,
        answer: question.answer,
        expiresAt,
        timer: null
    }

    activeGames.set(chat, game)

    const text =
        `🚩 *INDOVINA LA BANDIERA!*\n\n` +
        `${question.flag}\n\n` +
        `🅰️ ${question.options[0]}\n` +
        `🅱️ ${question.options[1]}\n` +
        `🇨 ${question.options[2]}\n` +
        `🇩 ${question.options[3]}\n\n` +
        `⏱️ Hai *30 secondi*!\n` +
        `👉 Rispondi con *A, B, C o D*.`

    await conn.reply(chat, text, m)

    // Timer
    game.timer = setTimeout(async () => {
        const current = activeGames.get(chat)

        if (!current || current !== game) return

        activeGames.delete(chat)

        const correctLetter = LETTERS[game.answer]

        await conn.reply(
            chat,
            `⏰ *TEMPO SCADUTO!*\n\n` +
            `La risposta corretta era:\n` +
            `✅ *${correctLetter}) ${game.options[game.answer]}*`,
            m
        )
    }, TIME_LIMIT)
}

// Intercetta A / B / C / D
handler.before = async function (m, { conn }) {
    if (!m || m.fromMe) return

    const chat = m.chat
    const game = activeGames.get(chat)

    if (!game) return

    let answer = ''

    if (typeof m.text === 'string') {
        answer = m.text.trim().toUpperCase()
    }

    // Accetta anche 1 / 2 / 3 / 4
    const numberMap = {
        '1': 'A',
        '2': 'B',
        '3': 'C',
        '4': 'D'
    }

    if (numberMap[answer]) {
        answer = numberMap[answer]
    }

    // Ignora qualsiasi altro messaggio
    if (!LETTERS.includes(answer)) return

    // Controllo timeout
    if (Date.now() >= game.expiresAt) {
        clearTimeout(game.timer)
        activeGames.delete(chat)

        const correctLetter = LETTERS[game.answer]

        await conn.reply(
            chat,
            `⏰ *TEMPO SCADUTO!*\n\n` +
            `La risposta corretta era:\n` +
            `✅ *${correctLetter}) ${game.options[game.answer]}*`,
            m
        )

        return
    }

    clearTimeout(game.timer)
    activeGames.delete(chat)

    const selectedIndex = LETTERS.indexOf(answer)

    if (selectedIndex === game.answer) {
        await conn.reply(
            chat,
            `🎉 *RISPOSTA CORRETTA!*\n\n` +
            `🚩 ${game.flag}\n` +
            `✅ *${answer}) ${game.options[selectedIndex]}*\n\n` +
            `🏆 Complimenti!`,
            m
        )
    } else {
        const correctLetter = LETTERS[game.answer]

        await conn.reply(
            chat,
            `❌ *RISPOSTA SBAGLIATA!*\n\n` +
            `Hai risposto: *${answer}) ${game.options[selectedIndex]}*\n\n` +
            `🚩 La bandiera era:\n` +
            `✅ *${correctLetter}) ${game.options[game.answer]}*`,
            m
        )
    }
}

handler.help = ['bandiera']
handler.tags = ['game']
handler.command = ['bandiera', 'flag']

export default handler
