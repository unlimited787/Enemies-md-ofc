// plugins/blackjack.js
// BLACKJACK MULTIPLAYER - SINGLE PLUGIN
// Tutto incluso: fiches, turni, hit, stand, double, split,
// blackjack, assicurazione, dealer, saldo, join, leave e nuova partita.

const games = new Map()
const balances = new Map()

const START_BALANCE = 1000
const MIN_BET = 10
const MAX_BET = 1000000

const SUITS = ['♠️', '♥️', '♦️', '♣️']
const RANKS = [
    { name: 'A', value: 11 },
    { name: '2', value: 2 },
    { name: '3', value: 3 },
    { name: '4', value: 4 },
    { name: '5', value: 5 },
    { name: '6', value: 6 },
    { name: '7', value: 7 },
    { name: '8', value: 8 },
    { name: '9', value: 9 },
    { name: '10', value: 10 },
    { name: 'J', value: 10 },
    { name: 'Q', value: 10 },
    { name: 'K', value: 10 }
]

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

function getBalance(user) {
    if (!balances.has(user)) {
        balances.set(user, START_BALANCE)
    }

    return balances.get(user)
}

function setBalance(user, amount) {
    balances.set(user, Math.max(0, Math.floor(amount)))
}

function addBalance(user, amount) {
    setBalance(user, getBalance(user) + amount)
}

function normalizeJid(jid = '') {
    return String(jid)
        .replace(/:\d+(?=@)/, '')
        .replace(/@lid$/, '@s.whatsapp.net')
}

function getUserId(m) {
    return normalizeJid(m.sender || m.participant || '')
}

function userName(m) {
    return m.pushName || m.name || m.sender?.split('@')[0] || 'Giocatore'
}

function createDeck() {
    const deck = []

    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({
                rank: rank.name,
                value: rank.value,
                suit
            })
        }
    }

    // Mischia Fisher-Yates
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))

        const tmp = deck[i]
        deck[i] = deck[j]
        deck[j] = tmp
    }

    return deck
}

function cardText(card) {
    return `${card.rank}${card.suit}`
}

function handValue(hand) {
    let total = 0
    let aces = 0

    for (const card of hand) {
        total += card.value

        if (card.rank === 'A') {
            aces++
        }
    }

    while (total > 21 && aces > 0) {
        total -= 10
        aces--
    }

    return total
}

function isBlackjack(hand) {
    return hand.length === 2 && handValue(hand) === 21
}

function isBust(hand) {
    return handValue(hand) > 21
}

function canSplit(hand) {
    if (hand.length !== 2) return false

    return hand[0].rank === hand[1].rank
}

function canDouble(hand) {
    return hand.length === 2
}

function formatHand(hand, hidden = false) {
    if (hidden) {
        if (!hand.length) return '—'

        return `🂠  ${cardText(hand[1])}`
    }

    return hand.map(cardText).join('  ')
}

function money(amount) {
    return `${Math.floor(amount).toLocaleString('it-IT')} 🪙`
}

function getGame(chat) {
    return games.get(chat)
}

function activePlayers(game) {
    return [...game.players.values()]
}

function currentPlayer(game) {
    if (!game.turnOrder.length) return null

    return game.players.get(
        game.turnOrder[game.currentTurn]
    )
}

function removePlayer(game, jid) {
    game.players.delete(jid)

    game.turnOrder = game.turnOrder.filter(
        x => x !== jid
    )

    if (game.currentTurn >= game.turnOrder.length) {
        game.currentTurn = 0
    }
}

function drawCard(game) {
    if (!game.deck.length) {
        game.deck = createDeck()
    }

    return game.deck.pop()
}

function createHand(bet) {
    return {
        cards: [],
        bet,
        insurance: 0,
        doubled: false,
        finished: false,
        result: null,
        payout: 0
    }
}

function createPlayer(jid, name, bet) {
    return {
        jid,
        name,
        hands: [
            createHand(bet)
        ],
        activeHand: 0,
        done: false
    }
}

function activeHand(player) {
    return player.hands[player.activeHand]
}

function nextHand(player) {
    player.activeHand++

    if (player.activeHand >= player.hands.length) {
        player.done = true
        return false
    }

    return true
}

function allPlayersDone(game) {
    return activePlayers(game).every(
        player => player.done
    )
}

function dealerShouldHit(hand) {
    const value = handValue(hand)

    // Dealer sta su 17
    return value < 17
}

function dealerPlay(game) {
    while (dealerShouldHit(game.dealer)) {
        game.dealer.push(drawCard(game))
    }
}

function playerCanAct(game, jid) {
    const player = game.players.get(jid)

    if (!player) return false
    if (game.phase !== 'playing') return false
    if (player.done) return false

    return game.turnOrder[game.currentTurn] === jid
}

function nextTurn(game) {
    if (!game.turnOrder.length) return

    let safety = 0

    while (safety < game.turnOrder.length + 5) {
        game.currentTurn++

        if (game.currentTurn >= game.turnOrder.length) {
            game.currentTurn = 0
        }

        const player = currentPlayer(game)

        if (player && !player.done) {
            return
        }

        safety++
    }
}

function prepareNextPlayablePlayer(game) {
    let safety = 0

    while (safety < game.turnOrder.length + 5) {
        const player = currentPlayer(game)

        if (player && !player.done) {
            return player
        }

        game.currentTurn++

        if (game.currentTurn >= game.turnOrder.length) {
            game.currentTurn = 0
        }

        safety++
    }

    return null
}

function gameHeader(game) {
    return (
        `🃏 *BLACKJACK*\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `💰 Banco: ${money(game.dealer.length)}\n\n`
    )
}

function renderGame(game, revealDealer = false) {
    let text =
        `🃏 *BLACKJACK*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n`

    if (revealDealer) {
        text +=
            `🎩 *BANCO*\n` +
            `${formatHand(game.dealer)}\n` +
            `💠 Totale: *${handValue(game.dealer)}*\n\n`
    } else {
        text +=
            `🎩 *BANCO*\n` +
            `${formatHand(game.dealer, true)}\n` +
            `❓ Totale nascosto\n\n`
    }

    text += `👥 *GIOCATORI*\n\n`

    for (const player of activePlayers(game)) {
        text += `👤 *${player.name}*\n`

        player.hands.forEach((hand, index) => {
            const value = handValue(hand)

            text +=
                `  ${player.hands.length > 1 ? `Mano ${index + 1}: ` : ''}` +
                `${formatHand(hand)}\n` +
                `  💠 ${value > 21 ? `💥 ${value}` : value}` +
                `  💰 ${money(hand.bet)}`

            if (hand.doubled) {
                text += ` ×2`
            }

            if (hand.finished) {
                text += `  ✓`
            }

            text += `\n`

            if (hand.insurance > 0) {
                text += `  🛡️ Assicurazione: ${money(hand.insurance)}\n`
            }
        })

        text += `\n`
    }

    if (!revealDealer) {
        const player = currentPlayer(game)

        if (player) {
            const hand = activeHand(player)

            text +=
                `🎯 *TURNO DI ${player.name.toUpperCase()}*\n` +
                `Mano: ${formatHand(hand)}\n` +
                `Totale: *${handValue(hand)}*\n\n` +
                `🃏 *.bj hit* — Pesca\n` +
                `🛑 *.bj stand* — Stai\n`

            if (canDouble(hand)) {
                text += `💰 *.bj double* — Raddoppia\n`
            }

            if (
                canSplit(hand) &&
                player.hands.length < 4
            ) {
                text += `✂️ *.bj split* — Dividi\n`
            }

            if (
                game.canInsurance &&
                hand.cards.length === 2 &&
                hand.insurance === 0
            ) {
                text += `🛡️ *.bj insurance* — Assicurazione\n`
            }
        }
    }

    return text
}

function resultsText(game) {
    let text =
        `\n━━━━━━━━━━━━━━━━━━\n` +
        `🏁 *RISULTATI*\n\n`

    const dealerValue = handValue(game.dealer)

    for (const player of activePlayers(game)) {
        text += `👤 *${player.name}*\n`

        player.hands.forEach((hand, index) => {
            const playerValue = handValue(hand)

            let result = ''
            let payout = 0

            if (isBlackjack(hand)) {
                if (isBlackjack(game.dealer)) {
                    result = '🤝 PAREGGIO'
                    payout = hand.bet
                } else {
                    result = '🃏 BLACKJACK!'
                    payout = hand.bet * 2.5
                }
            } else if (playerValue > 21) {
                result = '💥 SBANCATO'
                payout = 0
            } else if (isBlackjack(game.dealer)) {
                result = '❌ PERDI'
                payout = 0
            } else if (dealerValue > 21) {
                result = '🎉 VINCI'
                payout = hand.bet * 2
            } else if (playerValue > dealerValue) {
                result = '🎉 VINCI'
                payout = hand.bet * 2
            } else if (playerValue < dealerValue) {
                result = '❌ PERDI'
                payout = 0
            } else {
                result = '🤝 PAREGGIO'
                payout = hand.bet
            }

            // Assicurazione
            if (hand.insurance > 0) {
                if (isBlackjack(game.dealer)) {
                    payout += hand.insurance * 3
                    text += `  🛡️ Assicurazione: *VINTA* +${money(hand.insurance * 3)}\n`
                } else {
                    text += `  🛡️ Assicurazione: *PERSA* -${money(hand.insurance)}\n`
                }
            }

            const oldBalance = getBalance(player.jid)

            addBalance(
                player.jid,
                payout
            )

            hand.result = result
            hand.payout = payout

            text +=
                `${player.hands.length > 1 ? `  Mano ${index + 1}: ` : '  '}` +
                `${result}\n` +
                `  🃏 ${formatHand(hand)}\n` +
                `  💠 Totale: *${playerValue}*\n` +
                `  💰 Ritorno: *${money(payout)}*\n` +
                `  🪙 Saldo: *${money(getBalance(player.jid))}*\n\n`
        })
    }

    text +=
        `🎩 *BANCO*\n` +
        `${formatHand(game.dealer)}\n` +
        `💠 Totale: *${dealerValue}*\n`

    return text
}

function helpText() {
    return (
        `🃏 *BLACKJACK — COMANDI*\n\n` +

        `🎰 *.blackjack* / *.bj*\n` +
        `Avvia una nuova partita.\n\n` +

        `👥 *.bj join 100*\n` +
        `Entra nella partita con 100 fiches.\n\n` +

        `🚪 *.bj leave*\n` +
        `Esci dalla partita prima dell'inizio.\n\n` +

        `🃏 *.bj hit*\n` +
        `Pesca una carta.\n\n` +

        `🛑 *.bj stand*\n` +
        `Passa il turno.\n\n` +

        `💰 *.bj double*\n` +
        `Raddoppia la puntata e pesca una sola carta.\n\n` +

        `✂️ *.bj split*\n` +
        `Divide una coppia in due mani.\n\n` +

        `🛡️ *.bj insurance*\n` +
        `Compra l'assicurazione se il banco mostra un Asso.\n\n` +

        `💼 *.bj saldo*\n` +
        `Mostra le tue fiches.\n\n` +

        `🏆 *.bj players*\n` +
        `Mostra i giocatori della partita.\n\n` +

        `❌ *.bj cancel*\n` +
        `Annulla la partita.\n\n` +

        `🎲 Puntata minima: *${MIN_BET}*\n` +
        `🎲 Saldo iniziale: *${START_BALANCE}*`
    )
}

async function sendGame(conn, chat, game, extra = '') {
    const text =
        renderGame(game, false) +
        (extra ? `\n${extra}` : '')

    const sent = await conn.sendMessage(
        chat,
        { text },
        game.lastMessage
            ? { quoted: game.lastMessage }
            : {}
    )

    game.lastMessage = sent

    return sent
}

async function sendResult(conn, chat, game) {
    const text =
        renderGame(game, true) +
        resultsText(game)

    const sent = await conn.sendMessage(
        chat,
        { text },
        game.lastMessage
            ? { quoted: game.lastMessage }
            : {}
    )

    game.lastMessage = sent

    return sent
}

async function finishGame(conn, chat, game) {
    if (game.phase === 'finished') return

    game.phase = 'dealer'

    dealerPlay(game)

    game.phase = 'finished'

    await sendResult(conn, chat, game)

    games.delete(chat)
}

async function startPlaying(conn, chat, game) {
    game.phase = 'playing'

    // Controlla blackjack immediato del banco
    if (isBlackjack(game.dealer)) {
        await finishGame(conn, chat, game)
        return
    }

    // Controlla blackjack immediato dei giocatori
    for (const player of activePlayers(game)) {
        const hand = activeHand(player)

        if (isBlackjack(hand)) {
            hand.finished = true
            player.done = true
        }
    }

    const first = prepareNextPlayablePlayer(game)

    if (!first) {
        await finishGame(conn, chat, game)
        return
    }

    await sendGame(conn, chat, game)
}

async function dealInitialCards(game) {
    game.dealer = [
        drawCard(game),
        drawCard(game)
    ]

    for (const player of activePlayers(game)) {
        for (let i = 0; i < 2; i++) {
            activeHand(player).cards.push(
                drawCard(game)
            )
        }
    }
}

async function startGame(conn, chat, game) {
    await dealInitialCards(game)

    await sendGame(
        conn,
        chat,
        game,
        `🎰 *La partita è iniziata!*\n` +
        `Gli altri giocatori possono ancora entrare.`
    )

    // Piccola finestra per permettere agli altri di fare join
    game.joinOpen = true

    setTimeout(async () => {
        const current = games.get(chat)

        if (!current || current !== game) return
        if (current.phase !== 'waiting') return

        current.joinOpen = false

        await startPlaying(
            conn,
            chat,
            current
        )
    }, 15000)
}

function parseAmount(value) {
    const amount = Number(
        String(value || '')
            .replace(/[€$£,_]/g, '')
            .replace(',', '.')
    )

    if (!Number.isFinite(amount)) {
        return null
    }

    return Math.floor(amount)
}

function isGroup(m) {
    return !!m.isGroup
}

function getQuotedId(m) {
    if (!m?.quoted) return null

    return (
        m.quoted.id ||
        m.quoted.key?.id ||
        m.quoted.key?.messageId ||
        null
    )
}

function isGameQuote(m, game) {
    if (!m?.quoted) return false

    const quotedId = getQuotedId(m)

    if (!quotedId) return false

    return game.messageIds?.has(quotedId)
}

function rememberMessage(game, sent) {
    const id = sent?.key?.id

    if (!id) return

    if (!game.messageIds) {
        game.messageIds = new Set()
    }

    game.messageIds.add(id)

    // Manteniamo solo gli ultimi 15 ID
    while (game.messageIds.size > 15) {
        const first = game.messageIds.values().next().value

        if (!first) break

        game.messageIds.delete(first)
    }
}

async function sendAndRemember(conn, chat, game, text) {
    const sent = await conn.sendMessage(
        chat,
        { text },
        game.lastMessage
            ? { quoted: game.lastMessage }
            : {}
    )

    game.lastMessage = sent

    rememberMessage(game, sent)

    return sent
}

async function handleHit(conn, chat, game, jid) {
    if (!playerCanAct(game, jid)) {
        return conn.reply(
            chat,
            `⛔ Non è il tuo turno.`,
            game.lastMessage
        )
    }

    const player = game.players.get(jid)
    const hand = activeHand(player)

    hand.cards.push(drawCard(game))

    const value = handValue(hand)

    if (value > 21) {
        hand.finished = true

        if (!nextHand(player)) {
            nextTurn(game)
        }

        const next = prepareNextPlayablePlayer(game)

        if (!next) {
            await finishGame(conn, chat, game)
            return
        }

        await sendAndRemember(
            conn,
            chat,
            game,
            `💥 *${player.name}* ha sballato con *${value}*!\n\n` +
            `➡️ Tocca a *${next.name}*.`
        )

        return
    }

    if (value === 21) {
        hand.finished = true

        if (!nextHand(player)) {
            nextTurn(game)
        }

        const next = prepareNextPlayablePlayer(game)

        if (!next) {
            await finishGame(conn, chat, game)
            return
        }

        await sendAndRemember(
            conn,
            chat,
            game,
            `🎯 *${player.name}* ha fatto *21*!\n\n` +
            `➡️ Tocca a *${next.name}*.`
        )

        return
    }

    await sendAndRemember(
        conn,
        chat,
        game,
        `🃏 *${player.name}* pesca:\n` +
        `${formatHand(hand)}\n\n` +
        `💠 Totale: *${value}*`
    )
}

async function handleStand(conn, chat, game, jid) {
    if (!playerCanAct(game, jid)) {
        return conn.reply(
            chat,
            `⛔ Non è il tuo turno.`,
            game.lastMessage
        )
    }

    const player = game.players.get(jid)
    const hand = activeHand(player)

    hand.finished = true

    if (!nextHand(player)) {
        nextTurn(game)
    }

    const next = prepareNextPlayablePlayer(game)

    if (!next) {
        await finishGame(conn, chat, game)
        return
    }

    await sendAndRemember(
        conn,
        chat,
        game,
        `🛑 *${player.name}* sta.\n\n` +
        `➡️ Tocca a *${next.name}*.`
    )
}

async function handleDouble(conn, chat, game, jid) {
    if (!playerCanAct(game, jid)) {
        return conn.reply(
            chat,
            `⛔ Non è il tuo turno.`,
            game.lastMessage
        )
    }

    const player = game.players.get(jid)
    const hand = activeHand(player)

    if (!canDouble(hand)) {
        return conn.reply(
            chat,
            `❌ Puoi fare Double solo con le prime due carte.`,
            game.lastMessage
        )
    }

    if (hand.doubled) {
        return conn.reply(
            chat,
            `❌ Hai già raddoppiato.`,
            game.lastMessage
        )
    }

    if (getBalance(jid) < hand.bet) {
        return conn.reply(
            chat,
            `❌ Non hai abbastanza fiches per raddoppiare.`,
            game.lastMessage
        )
    }

    setBalance(
        jid,
        getBalance(jid) - hand.bet
    )

    hand.bet *= 2
    hand.doubled = true

    hand.cards.push(drawCard(game))

    const value = handValue(hand)

    hand.finished = true

    if (!nextHand(player)) {
        nextTurn(game)
    }

    const next = prepareNextPlayablePlayer(game)

    if (!next) {
        await finishGame(conn, chat, game)
        return
    }

    await sendAndRemember(
        conn,
        chat,
        game,
        `💰 *${player.name}* ha fatto DOUBLE!\n\n` +
        `🃏 ${formatHand(hand)}\n` +
        `💠 Totale: *${value}*\n` +
        `💵 Puntata: *${money(hand.bet)}*\n\n` +
        `➡️ Tocca a *${next.name}*.`
    )
}

async function handleSplit(conn, chat, game, jid) {
    if (!playerCanAct(game, jid)) {
        return conn.reply(
            chat,
            `⛔ Non è il tuo turno.`,
            game.lastMessage
        )
    }

    const player = game.players.get(jid)

    if (player.hands.length >= 4) {
        return conn.reply(
            chat,
            `❌ Puoi avere al massimo 4 mani.`,
            game.lastMessage
        )
    }

    const hand = activeHand(player)

    if (!canSplit(hand)) {
        return conn.reply(
            chat,
            `❌ Puoi dividere solo una coppia dello stesso valore.`,
            game.lastMessage
        )
    }

    if (getBalance(jid) < hand.bet) {
        return conn.reply(
            chat,
            `❌ Non hai abbastanza fiches per lo split.`,
            game.lastMessage
        )
    }

    setBalance(
        jid,
        getBalance(jid) - hand.bet
    )

    const card1 = hand.cards[0]
    const card2 = hand.cards[1]

    const firstHand = {
        cards: [card1, drawCard(game)],
        bet: hand.bet,
        insurance: 0,
        doubled: false,
        finished: false,
        result: null,
        payout: 0
    }

    const secondHand = {
        cards: [card2, drawCard(game)],
        bet: hand.bet,
        insurance: 0,
        doubled: false,
        finished: false,
        result: null,
        payout: 0
    }

    player.hands.splice(
        player.activeHand,
        1,
        firstHand,
        secondHand
    )

    await sendAndRemember(
        conn,
        chat,
        game,
        `✂️ *${player.name}* ha diviso la mano!\n\n` +
        `🃏 *Mano 1:* ${formatHand(firstHand)}\n` +
        `💠 ${handValue(firstHand)}\n\n` +
        `🃏 *Mano 2:* ${formatHand(secondHand)}\n` +
        `💠 ${handValue(secondHand)}\n\n` +
        `➡️ Continua con la *Mano 1*.`
    )
}

async function handleInsurance(conn, chat, game, jid) {
    if (!playerCanAct(game, jid)) {
        return conn.reply(
            chat,
            `⛔ Non è il tuo turno.`,
            game.lastMessage
        )
    }

    if (!game.canInsurance) {
        return conn.reply(
            chat,
            `❌ L'assicurazione non è disponibile.`,
            game.lastMessage
        )
    }

    const player = game.players.get(jid)
    const hand = activeHand(player)

    if (hand.cards.length !== 2) {
        return conn.reply(
            chat,
            `❌ Puoi comprare l'assicurazione solo all'inizio della mano.`,
            game.lastMessage
        )
    }

    if (hand.insurance > 0) {
        return conn.reply(
            chat,
            `❌ Hai già acquistato l'assicurazione.`,
            game.lastMessage
        )
    }

    const amount = Math.floor(hand.bet / 2)

    if (getBalance(jid) < amount) {
        return conn.reply(
            chat,
            `❌ Non hai abbastanza fiches per l'assicurazione.\n` +
            `Servono: *${money(amount)}*`,
            game.lastMessage
        )
    }

    setBalance(
        jid,
        getBalance(jid) - amount
    )

    hand.insurance = amount

    await sendAndRemember(
        conn,
        chat,
        game,
        `🛡️ *${player.name}* ha acquistato l'assicurazione.\n\n` +
        `💰 Costo: *${money(amount)}*\n` +
        `🛡️ Copertura: *${money(amount * 3)}*`
    )
}

let handler = async (m, { conn, args, command }) => {
    if (!m) return

    const chat = m.chat
    const jid = getUserId(m)
    const name = userName(m)

    const sub = String(args?.[0] || '')
        .toLowerCase()

    // =========================
    // SALDO
    // =========================

    if (
        command === 'saldo' ||
        command === 'bj-saldo' ||
        (command === 'bj' && sub === 'saldo')
    ) {
        return conn.reply(
            chat,
            `💼 *PORTAFOGLIO*\n\n` +
            `👤 ${name}\n` +
            `🪙 Saldo: *${money(getBalance(jid))}*`,
            m
        )
    }

    // =========================
    // HELP
    // =========================

    if (
        command === 'bjhelp' ||
        (command === 'bj' && sub === 'help')
    ) {
        return conn.reply(
            chat,
            helpText(),
            m
        )
    }

    // =========================
    // GIOCO ESISTENTE
    // =========================

    let game = games.get(chat)

    // =========================
    // CANCEL
    // =========================

    if (
        command === 'bj' &&
        ['cancel', 'stop', 'end'].includes(sub)
    ) {
        if (!game) {
            return conn.reply(
                chat,
                `❌ Non c'è nessuna partita attiva.`,
                m
            )
        }

        games.delete(chat)

        return conn.reply(
            chat,
            `🛑 *PARTITA ANNULLATA*\n\n` +
            `La partita è stata chiusa senza modificare i saldi.`,
            m
        )
    }

    // =========================
    // PLAYERS
    // =========================

    if (
        command === 'bj' &&
        ['players', 'giocatori', 'player'].includes(sub)
    ) {
        if (!game) {
            return conn.reply(
                chat,
                `❌ Nessuna partita attiva.`,
                m
            )
        }

        let text =
            `👥 *GIOCATORI*\n\n`

        for (const player of activePlayers(game)) {
            text +=
                `👤 ${player.name}` +
                `${player.done ? ' ✅' : ''}\n`
        }

        return conn.reply(
            chat,
            text,
            m
        )
    }

    // =========================
    // JOIN
    // =========================

    if (
        command === 'bj' &&
        ['join', 'entra', 'partecipa'].includes(sub)
    ) {
        if (!game) {
            return conn.reply(
                chat,
                `❌ Non c'è ancora una partita.\n` +
                `Usa *.blackjack* per crearne una.`,
                m
            )
        }

        if (game.phase !== 'waiting') {
            return conn.reply(
                chat,
                `❌ La fase di ingresso è terminata.`,
                m
            )
        }

        if (!game.joinOpen) {
            return conn.reply(
                chat,
                `❌ Non puoi più entrare in questa partita.`,
                m
            )
        }

        if (game.players.has(jid)) {
            return conn.reply(
                chat,
                `⚠️ Sei già nella partita.`,
                m
            )
        }

        const bet = parseAmount(args?.[1])

        if (
            bet === null ||
            bet < MIN_BET ||
            bet > MAX_BET
        ) {
            return conn.reply(
                chat,
                `❌ Puntata non valida.\n\n` +
                `Esempio: *.bj join 100*\n` +
                `Minimo: *${MIN_BET}*\n` +
                `Massimo: *${MAX_BET}*`,
                m
            )
        }

        if (getBalance(jid) < bet) {
            return conn.reply(
                chat,
                `❌ Non hai abbastanza fiches.\n\n` +
                `Saldo: *${money(getBalance(jid))}*\n` +
                `Puntata: *${money(bet)}*`,
                m
            )
        }

        setBalance(
            jid,
            getBalance(jid) - bet
        )

        game.players.set(
            jid,
            createPlayer(
                jid,
                name,
                bet
            )
        )

        game.turnOrder.push(jid)

        return conn.reply(
            chat,
            `✅ *${name}* è entrato al tavolo!\n\n` +
            `💰 Puntata: *${money(bet)}*\n` +
            `🪙 Saldo restante: *${money(getBalance(jid))}*\n\n` +
            `👥 Giocatori: *${game.players.size}*`,
            m
        )
    }

    // =========================
    // LEAVE
    // =========================

    if (
        command === 'bj' &&
        ['leave', 'esci'].includes(sub)
    ) {
        if (!game) {
            return conn.reply(
                chat,
                `❌ Non c'è nessuna partita.`,
                m
            )
        }

        if (game.phase !== 'waiting') {
            return conn.reply(
                chat,
                `❌ Non puoi uscire durante una mano in corso.`,
                m
            )
        }

        const player = game.players.get(jid)

        if (!player) {
            return conn.reply(
                chat,
                `❌ Non sei nella partita.`,
                m
            )
        }

        const refund = player.hands.reduce(
            (sum, hand) => sum + hand.bet,
            0
        )

        addBalance(jid, refund)

        removePlayer(game, jid)

        return conn.reply(
            chat,
            `🚪 *${name}* ha lasciato il tavolo.\n\n` +
            `💰 Restituite: *${money(refund)}*`,
            m
        )
    }

    // =========================
    // HIT
    // =========================

    if (
        command === 'bj' &&
        ['hit', 'h', 'carta'].includes(sub)
    ) {
        if (!game) {
            return conn.reply(
                chat,
                `❌ Nessuna partita attiva.`,
                m
            )
        }

        return handleHit(
            conn,
            chat,
            game,
            jid
        )
    }

    // =========================
    // STAND
    // =========================

    if (
        command === 'bj' &&
        ['stand', 's', 'stop'].includes(sub)
    ) {
        if (!game) {
            return conn.reply(
                chat,
                `❌ Nessuna partita attiva.`,
                m
            )
        }

        return handleStand(
            conn,
            chat,
            game,
            jid
        )
    }

    // =========================
    // DOUBLE
    // =========================

    if (
        command === 'bj' &&
        ['double', 'd', 'raddoppia'].includes(sub)
    ) {
        if (!game) {
            return conn.reply(
                chat,
                `❌ Nessuna partita attiva.`,
                m
            )
        }

        return handleDouble(
            conn,
            chat,
            game,
            jid
        )
    }

    // =========================
    // SPLIT
    // =========================

    if (
        command === 'bj' &&
        ['split', 'splitto', 'dividi'].includes(sub)
    ) {
        if (!game) {
            return conn.reply(
                chat,
                `❌ Nessuna partita attiva.`,
                m
            )
        }

        return handleSplit(
            conn,
            chat,
            game,
            jid
        )
    }

    // =========================
    // INSURANCE
    // =========================

    if (
        command === 'bj' &&
        ['insurance', 'assicurazione', 'ins'].includes(sub)
    ) {
        if (!game) {
            return conn.reply(
                chat,
                `❌ Nessuna partita attiva.`,
                m
            )
        }

        return handleInsurance(
            conn,
            chat,
            game,
            jid
        )
    }

    // =========================
    // AVVIO
    // =========================

    if (
        command !== 'blackjack' &&
        command !== 'bj'
    ) {
        return
    }

    if (game) {
        return conn.reply(
            chat,
            `🃏 *BLACKJACK GIÀ ATTIVO!*\n\n` +
            `👥 Giocatori: *${game.players.size}*\n\n` +
            `Per entrare:\n` +
            `*.bj join 100*\n\n` +
            `Per vedere i comandi:\n` +
            `*.bj help*`,
            m
        )
    }

    game = {
        chat,
        phase: 'waiting',
        joinOpen: true,

        deck: createDeck(),

        dealer: [],

        players: new Map(),
        turnOrder: [],
        currentTurn: 0,

        canInsurance: false,

        lastMessage: null,
        messageIds: new Set(),

        createdAt: Date.now()
    }

    games.set(chat, game)

    // Chi lancia il comando non entra automaticamente:
    // deve scegliere la puntata.
    const sent = await conn.reply(
        chat,
        `🃏 *BLACKJACK*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +

        `🎰 *Nuovo tavolo aperto!*\n\n` +

        `💰 Per partecipare:\n` +
        `*.bj join 100*\n\n` +

        `📌 Esempio:\n` +
        `*.bj join 500*\n\n` +

        `🪙 Saldo iniziale di ogni giocatore:\n` +
        `*${money(START_BALANCE)}*\n\n` +

        `⏳ Avete *15 secondi* per entrare.\n\n` +

        `👥 Più giocatori possono partecipare alla stessa mano.`,
        m
    )

    game.lastMessage = sent

    rememberMessage(
        game,
        sent
    )

    // Dopo 15 secondi parte la mano.
    setTimeout(async () => {
        const current = games.get(chat)

        if (!current || current !== game) return

        current.joinOpen = false

        if (current.players.size === 0) {
            games.delete(chat)

            await conn.reply(
                chat,
                `🃏 *BLACKJACK ANNULLATO*\n\n` +
                `Nessun giocatore è entrato al tavolo.`,
                sent
            )

            return
        }

        await startGame(
            conn,
            chat,
            current
        )
    }, 15000)
}

handler.help = [
    'blackjack',
    'bj',
    'bj join <puntata>',
    'bj hit',
    'bj stand',
    'bj double',
    'bj split',
    'bj insurance',
    'bj saldo',
    'bj players',
    'bj leave',
    'bj cancel'
]

handler.tags = ['game']

handler.command = [
    'blackjack',
    'bj',
    'saldo',
    'bj-saldo',
    'bjhelp'
]

export default handler
