import quizData from './quiz.js'

const activeQuizzes = new Map()

const LETTERS = ['A', 'B', 'C', 'D']
const TIME_LIMIT = 30 * 1000

let handler = async (m, { conn, usedPrefix, command }) => {
const chat = m.chat

// Controlla se c'è già un quiz attivo
if (activeQuizzes.has(chat)) {
const game = activeQuizzes.get(chat)

const remaining = Math.max(
0,
Math.ceil((game.expiresAt - Date.now()) / 1000)
)

return conn.reply(
chat,
`c'è già un quiz in corso!\n\n` +
`❓ ${game.question.question}\n\n` +
`A) ${game.question.options[0]}\n` +
`B) ${game.question.options[1]}\n` +
`C) ${game.question.options[2]}\n` +
`D) ${game.question.options[3]}\n\n` +
`⏱️ Tempo rimanente: ${remaining}s\n\n` +
`Rispondi semplicemente con A, B, C oppure D.`,
m
)
}

if (!Array.isArray(quizData) || quizData.length === 0) {
return conn.reply(
chat,
'❌ Il database delle domande è vuoto o non è stato caricato.',
m
)
}

// Domanda casuale
const question = quizData[
Math.floor(Math.random() * quizData.length)
]

// Controllo di sicurezza
if (
!question.question ||
!Array.isArray(question.options) ||
question.options.length !== 4 ||
typeof question.answer !== 'number' ||
question.answer < 0 ||
question.answer > 3
) {
return conn.reply(
chat,
'❌ Una domanda nel database non è configurata correttamente.',
m
)
}

const expiresAt = Date.now() + TIME_LIMIT

const game = {
question,
expiresAt,
timer: null
}

activeQuizzes.set(chat, game)

const text =
`🧠 *QUIZ*\n\n` +
`❓ ${question.question}\n\n` +
`🅰️ ${question.options[0]}\n` +
`🅱️ ${question.options[1]}\n` +
`🇨 ${question.options[2]}\n` +
`🇩 ${question.options[3]}\n\n` +
`⏱️ Hai *30 secondi* per rispondere.\n` +
`👉 Rispondi con *A, B, C o D*.`

await conn.reply(chat, text, m)

// Timer
game.timer = setTimeout(async () => {
const current = activeQuizzes.get(chat)

if (!current || current !== game) return

activeQuizzes.delete(chat)

const correctLetter = LETTERS[question.answer]

await conn.reply(
chat,
`⏰ *TEMPO SCADUTO!*\n\n` +
`La risposta corretta era:\n` +
`✅ *${correctLetter}) ${question.options[question.answer]}*`,
m
)
}, TIME_LIMIT)
}

// Intercetta A / B / C / D quando c'è un quiz attivo
handler.before = async function (m, { conn }) {
if (!m || m.fromMe) return

const chat = m.chat
const game = activeQuizzes.get(chat)

if (!game) return

// Testo del messaggio
let answer = ''

if (typeof m.text === 'string') {
answer = m.text.trim().toUpperCase()
}

// Accetta anche 1, 2, 3, 4
const numberMap = {
'1': 'A',
'2': 'B',
'3': 'C',
'4': 'D'
}

if (numberMap[answer]) {
answer = numberMap[answer]
}

// Se non è una risposta valida, ignora
if (!LETTERS.includes(answer)) return

// Controllo timeout
if (Date.now() >= game.expiresAt) {
clearTimeout(game.timer)
activeQuizzes.delete(chat)

const correctLetter = LETTERS[game.question.answer]

await conn.reply(
chat,
`⏰ *TEMPO SCADUTO!*\n\n` +
`La risposta corretta era:\n` +
`✅ *${correctLetter}) ${game.question.options[game.question.answer]}*`,
m
)

return
}

clearTimeout(game.timer)
activeQuizzes.delete(chat)

const selectedIndex = LETTERS.indexOf(answer)
const correctIndex = game.question.answer

if (selectedIndex === correctIndex) {
await conn.reply(
chat,
`🎉 *RISPOSTA CORRETTA!*\n\n` +
`✅ *${answer}) ${game.question.options[selectedIndex]}*\n\n` +
`🏆 Complimenti!`,
m
)
} else {
const correctLetter = LETTERS[correctIndex]

await conn.reply(
chat,
`❌ *RISPOSTA SBAGLIATA!*\n\n` +
`✅ La risposta corretta era:\n` +
`*${correctLetter}) ${game.question.options[correctIndex]}*`,
m
)
}
}

handler.help = ['quiz']
handler.tags = ['game']
handler.command = ['quiz']

export default handler
