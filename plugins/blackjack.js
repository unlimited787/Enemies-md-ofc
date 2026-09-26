// plugins/blackjack.js
// BLACKJACK MULTIPLAYER - SINGLE PLUGIN
// Fiches, multiplayer, hit, stand, double, split, insurance,
// blackjack naturale, dealer, saldo, join, leave, start, cancel.

const games = new Map()
const balances = new Map()

const START_BALANCE = 1000
const MIN_BET = 10
const MAX_BET = 1000000
const MAX_PLAYERS = 6

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

/*
 * IMPORTANTE:
 * Non tocchiamo il sistema JID/LID globale del bot.
 *
 * Qui usiamo solo una chiave locale per identificare
 * il giocatore della partita.
 *
 * NON convertiamo @lid in @s.whatsapp.net.
 */
function playerId(m) {
    const id = String(
        m?.sender ||
        m?.participant ||
        m?.key?.participant ||
        ''
    )

    if (!id) return ''

    // Elimina solamente l'eventuale device ID.
    return id.replace(/:\d+(?=@)/, '')
}

function playerName(m) {
    return (
        m?.pushName ||
        m?.name ||
        String(m?.sender || '').split('@')[0] ||
        'Giocatore'
    )
}

function getBalance(jid) {
    if (!balances.has(jid)) {
        balances.set(jid, START_BALANCE)
    }

    return balances.get(jid)
}

function setBalance(jid, amount) {
    balances.set(jid, Math.max(0, Math.floor(amount)))
}

function addBalance(jid, amount) {
    setBalance(jid, getBalance(jid) + amount)
}

function money(amount) {
    return `${Math.floor(amount).toLocaleString('it-IT')} 🪙`
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

    // Fisher-Yates
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))

        const tmp = deck[i]
        deck[i] = deck[j]
        deck[j] = tmp
    }

    return deck
}

function drawCard(game) {
    if (!game.deck.length) {
        game.deck = createDeck()
    }

    return game.deck.pop()
}

function cardText(card) {
    return `${card.rank}${card.suit}`
}

function formatHand(hand, hidden = false) {
    if (!hand?.length) return '—'

    if (hidden) {
        return `🂠  ${cardText(hand[1])}`
    }

    return hand.map(cardText).join('  ')
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

function activePlayers(game) {
    return [...game.players.values()]
}

function activeHand(player) {
    return player.hands[player.activeHand]
}

function currentPlayer(game) {
    if (!game.turnOrder.length) return null

    return game.players.get(
        game.turnOrder[game.currentTurn]
    ) || null
}

function playerCanAct(game, jid) {
    if (!game) return false
    if (game.phase !== 'playing') return false

    const player = game.players.get(jid)

    if (!player) return false
    if (player.done) return false

    return game.turnOrder[game.currentTurn] === jid
}

function nextHand(player) {
    player.activeHand++

    if (player.activeHand >= player.hands.length) {
        player.done = true
        return false
    }

    return true
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
    if (!game.turnOrder.length) return null

    let safety = 0

    while (safety < game.turnOrder.length + 10) {
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

function dealerShouldHit(hand) {
    return handValue(hand) < 17
}

function dealerPlay(game) {
    while (dealerShouldHit(game.dealer)) {
        game.dealer.push(drawCard(game))
    }
}

function parseAmount(value) {
    if (value === undefined || value === null) {
        return null
    }

    const amount = Number(
        String(value)
            .replace(/[€$£,_]/g, '')
            .replace(',', '.')
    )

    if (!Number.isFinite(amount)) {
        return null
    }

    return Math.floor(amount)
}

/* =========================
   MESSAGGI
========================= */

function rememberMessage(game, message) {
    const id = message?.key?.id

    if (!id) return

    if (!game.messageIds) {
        game.messageIds = new Set()
    }

    game.messageIds.add(id)

    while (game.messageIds.size > 20) {
        const first = game.messageIds.values().next().value

        if (!first) break

        game.messageIds.delete(first)
    }
}

async function sendGame(conn, chat, game, text) {
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

async function reply(conn, chat, text, quoted = null) {
    return conn.reply(
        chat,
        text,
        quoted || undefined
    )
}

/* =========================
   RENDER
========================= */

function renderWaiting(game) {
    let text =
        `🃏 *BLACKJACK*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n` +
        `🎰 *TAVOLO APERTO*\n\n`

    text +=
        `👑 Host: *${game.hostName}*\n\n` +
        `👥 Giocatori: *${game.players.size}/${MAX_PLAYERS}*\n\n`

    if (!game.players.size) {
        text += `Nessun giocatore ancora entrato.\n\n`
    } else {
        for (const player of activePlayers(game)) {
            text +=
                `👤 *${player.name}*\n` +
                `   💰 Puntata: *${money(player.hands[0].bet)}*\n\n`
        }
    }

    text +=
        `━━━━━━━━━━━━━━━━━━\n` +
        `Per entrare:\n` +
        `*.bj join 100*\n\n` +
        `Quando siete pronti, l'host usa:\n` +
        `*.bj start*\n\n` +
        `Per uscire:\n` +
        `*.bj leave*\n\n` +
        `Per annullare:\n` +
        `*.bj cancel*`

    return text
}

function renderGame(game, revealDealer = false) {
    let text =
        `🃏 *BLACKJACK*\n` +
        `━━━━━━━━━━━━━━━━━━\n\n`

    text += `🎩 *BANCO*\n`

    if (revealDealer) {
        text +=
            `${formatHand(game.dealer)}\n` +
            `💠 Totale: *${handValue(game.dealer)}*\n\n`
    } else {
        text +=
            `${formatHand(game.dealer, true)}\n` +
            `❓ Totale nascosto\n\n`
    }

    text += `👥 *GIOCATORI*\n\n`

    for (const player of activePlayers(game)) {
        text += `👤 *${player.name}*\n`

        player.hands.forEach((hand, index) => {
            const value = handValue(hand)

            text +=
                `  ${player.hands.length > 1 ? `*Mano ${index + 1}:* ` : ''}` +
                `${formatHand(hand)}\n` +
                `  💠 ${value > 21 ? `💥 ${value}` : value}\n` +
                `  💰 ${money(hand.bet)}`

            if (hand.doubled) {
                text += ` ×2`
            }

            if (hand.finished) {
                text += ` ✓`
            }

            if (hand.insurance > 0) {
                text +=
                    `\n  🛡️ Assicurazione: ${money(hand.insurance)}`
            }

            text += `\n`
        })

        text += `\n`
    }

    if (!revealDealer && game.phase === 'playing') {
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
                text +=
                    `💰 *.bj double* — Raddoppia\n`
            }

            if (
                canSplit(hand) &&
                player.hands.length < 4
            ) {
                text +=
                    `✂️ *.bj split* — Dividi\n`
            }

            if (
                game.canInsurance &&
                hand.cards.length === 2 &&
                hand.insurance === 0
            ) {
                text +=
                    `🛡️ *.bj insurance* — Assicurazione\n`
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
    const dealerBJ = isBlackjack(game.dealer)

    for (const player of activePlayers(game)) {
        text += `👤 *${player.name}*\n`

        player.hands.forEach((hand, index) => {
            const playerValue = handValue(hand)

            let result = ''
            let payout = 0

            if (isBlackjack(hand)) {
                if (dealerBJ) {
                    result = '🤝 PAREGGIO'
                    payout = hand.bet
                } else {
                    result = '🃏 BLACKJACK!'
                    payout = hand.bet * 2.5
                }
            } else if (playerValue > 21) {
                result = '💥 SBANCATO'
                payout = 0
            } else if (dealerBJ) {
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
                if (dealerBJ) {
                    const insurancePayout =
                        hand.insurance * 3

                    payout += insurancePayout

                    text +=
                        `  🛡️ Assicurazione: *VINTA* ` +
                        `+${money(insurancePayout)}\n`
                } else {
                    text +=
                        `  🛡️ Assicurazione: *PERSA*\n`
                }
            }

            addBalance(
                player.jid,
                payout
            )

            hand.result = result
            hand.payout = payout

            text +=
                `${player.hands.length > 1
                    ? `  *Mano ${index + 1}:* `
                    : '  '}` +
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

/* =========================
   START
========================= */

function dealInitialCards(game) {
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

async function finishGame(conn, chat, game) {
    if (game.phase === 'finished') return

    game.phase = 'dealer'

    dealerPlay(game)

    game.phase = 'finished'

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
    rememberMessage(game, sent)

    games.delete(chat)
}

async function startGame(conn, chat, game) {
    if (!game) return

    if (game.phase !== 'waiting') {
        return
    }

    if (game.players.size < 1) {
        return reply(
            conn,
            chat,
            `❌ Serve almeno un giocatore per iniziare.`
        )
    }

    game.joinOpen = false
    game.phase = 'dealing'

    dealInitialCards(game)

    // Assicurazione disponibile se il banco mostra Asso.
    game.canInsurance =
        game.dealer[0]?.rank === 'A'

    // Controllo blackjack del banco.
    if (isBlackjack(game.dealer)) {
        await finishGame(conn, chat, game)
        return
    }

    game.phase = 'playing'

    // I giocatori con blackjack naturale
    // saltano il turno.
    for (const player of activePlayers(game)) {
        const hand = activeHand(player)

        if (isBlackjack(hand)) {
            hand.finished = true
            player.done = true
        }
    }

    game.currentTurn = 0

    const first = prepareNextPlayablePlayer(game)

    if (!first) {
        await finishGame(conn, chat, game)
        return
    }

    await sendGame(
        conn,
        chat,
        game,
        `🎰 *LA PARTITA È INIZIATA!*\n\n` +
        `➡️ Tocca a *${first.name}*.`
    )
}

/* =========================
   HIT
========================= */

async function handleHit(conn, chat, game, jid) {
    if (!playerCanAct(game, jid)) {
        const current = currentPlayer(game)

        return reply(
            conn,
            chat,
            current
                ? `⛔ Non è il tuo turno.\n\n🎯 Tocca a *${current.name}*.`
                : `⛔ Non è il tuo turno.`,
            game.lastMessage
        )
    }

    const player = game.players.get(jid)
    const hand = activeHand(player)

    hand.cards.push(drawCard(game))

    const value = handValue(hand)

    if (value > 21) {
        hand.finished = true

        const changedHand = nextHand(player)

        if (!changedHand) {
            nextTurn(game)
        }

        const next = prepareNextPlayablePlayer(game)

        if (!next) {
            await finishGame(conn, chat, game)
            return
        }

        await sendGame(
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

        const changedHand = nextHand(player)

        if (!changedHand) {
            nextTurn(game)
        }

        const next = prepareNextPlayablePlayer(game)

        if (!next) {
            await finishGame(conn, chat, game)
            return
        }

        await sendGame(
            conn,
            chat,
            game,
            `🎯 *${player.name}* ha fatto *21*!\n\n` +
            `➡️ Tocca a *${next.name}*.`
        )

        return
    }

    await sendGame(
        conn,
        chat,
        game,
        `🃏 *${player.name}* pesca:\n\n` +
        `${formatHand(hand)}\n` +
        `💠 Totale: *${value}*`
    )
}

/* =========================
   STAND
========================= */

async function handleStand(conn, chat, game, jid) {
    if (!playerCanAct(game, jid)) {
        const current = currentPlayer(game)

        return reply(
            conn,
            chat,
            current
                ? `⛔ Non è il tuo turno.\n\n🎯 Tocca a *${current.name}*.`
                : `⛔ Non è il tuo turno.`,
            game.lastMessage
        )
    }

    const player = game.players.get(jid)
    const hand = activeHand(player)

    hand.finished = true

    const changedHand = nextHand(player)

    if (!changedHand) {
        nextTurn(game)
    }

    const next = prepareNextPlayablePlayer(game)

    if (!next) {
        await finishGame(conn, chat, game)
        return
    }

    await sendGame(
        conn,
        chat,
        game,
        `🛑 *${player.name}* sta.\n\n` +
        `➡️ Tocca a *${next.name}*.`
    )
}

/* =========================
   DOUBLE
========================= */

async function handleDouble(conn, chat, game, jid) {
    if (!playerCanAct(game, jid)) {
        const current = currentPlayer(game)

        return reply(
            conn,
            chat,
            current
                ? `⛔ Non è il tuo turno.\n\n🎯 Tocca a *${current.name}*.`
                : `⛔ Non è il tuo turno.`,
            game.lastMessage
        )
    }

    const player = game.players.get(jid)
    const hand = activeHand(player)

    if (!canDouble(hand)) {
        return reply(
            conn,
            chat,
            `❌ Puoi fare Double solo con le prime due carte.`,
            game.lastMessage
        )
    }

    if (hand.doubled) {
        return reply(
            conn,
            chat,
            `❌ Hai già raddoppiato.`,
            game.lastMessage
        )
    }

    if (getBalance(jid) < hand.bet) {
        return reply(
            conn,
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
    hand.finished = true

    const value = handValue(hand)

    const changedHand = nextHand(player)

    if (!changedHand) {
        nextTurn(game)
    }

    const next = prepareNextPlayablePlayer(game)

    if (!next) {
        await finishGame(conn, chat, game)
        return
    }

    await sendGame(
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

/* =========================
   SPLIT
========================= */

async function handleSplit(conn, chat, game, jid) {
    if (!playerCanAct(game, jid)) {
        const current = currentPlayer(game)

        return reply(
            conn,
            chat,
            current
                ? `⛔ Non è il tuo turno.\n\n🎯 Tocca a *${current.name}*.`
                : `⛔ Non è il tuo turno.`,
            game.lastMessage
        )
    }

    const player = game.players.get(jid)
    const hand = activeHand(player)

    if (player.hands.length >= 4) {
        return reply(
            conn,
            chat,
            `❌ Puoi avere al massimo 4 mani.`,
            game.lastMessage
        )
    }

    if (!canSplit(hand)) {
        return reply(
            conn,
            chat,
            `❌ Puoi dividere solo una coppia dello stesso valore.`,
            game.lastMessage
        )
    }

    if (getBalance(jid) < hand.bet) {
        return reply(
            conn,
            chat,
            `❌ Non hai abbastanza fiches per lo split.`,
            game.lastMessage
        )
    }

    // Seconda puntata
    setBalance(
        jid,
        getBalance(jid) - hand.bet
    )

    const card1 = hand.cards[0]
    const card2 = hand.cards[1]

    const firstHand = createHand(hand.bet)
    const secondHand = createHand(hand.bet)

    firstHand.cards = [
        card1,
        drawCard(game)
    ]

    secondHand.cards = [
        card2,
        drawCard(game)
    ]

    player.hands.splice(
        player.activeHand,
        1,
        firstHand,
        secondHand
    )

    await sendGame(
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

/* =========================
   INSURANCE
========================= */

async function handleInsurance(conn, chat, game, jid) {
    if (!playerCanAct(game, jid)) {
        const current = currentPlayer(game)

        return reply(
            conn,
            chat,
            current
                ? `⛔ Non è il tuo turno.\n\n🎯 Tocca a *${current.name}*.`
                : `⛔ Non è il tuo turno.`,
            game.lastMessage
        )
    }

    if (!game.canInsurance) {
        return reply(
            conn,
            chat,
            `❌ L'assicurazione non è disponibile.`,
            game.lastMessage
        )
    }

    const player = game.players.get(jid)
    const hand = activeHand(player)

    if (hand.cards.length !== 2) {
        return reply(
            conn,
            chat,
            `❌ Puoi comprare l'assicurazione solo all'inizio della mano.`,
            game.lastMessage
        )
    }

    if (hand.insurance > 0) {
        return reply(
            conn,
            chat,
            `❌ Hai già acquistato l'assicurazione.`,
            game.lastMessage
        )
    }

    const amount = Math.floor(hand.bet / 2)

    if (getBalance(jid) < amount) {
        return reply(
            conn,
            chat,
            `❌ Non hai abbastanza fiches.\n\n` +
            `Servono: *${money(amount)}*`,
            game.lastMessage
        )
    }

    setBalance(
        jid,
        getBalance(jid) - amount
    )

    hand.insurance = amount

    await sendGame(
        conn,
        chat,
        game,
        `🛡️ *${player.name}* ha acquistato l'assicurazione.\n\n` +
        `💰 Costo: *${money(amount)}*\n` +
        `🛡️ Copertura: *${money(amount * 3)}*`
    )
}

/* =========================
   HELP
========================= */

function helpText() {
    return (
        `🃏 *BLACKJACK — COMANDI*\n\n` +

        `🎰 *.blackjack* / *.bj*\n` +
        `Apre un nuovo tavolo.\n\n` +

        `👥 *.bj join 100*\n` +
        `Entra con una puntata di 100 fiches.\n\n` +

        `▶️ *.bj start*\n` +
        `Fa partire la partita.\n` +
        `Solo chi ha creato il tavolo.\n\n` +

        `🚪 *.bj leave*\n` +
        `Esci prima dell'inizio.\n\n` +

        `🃏 *.bj hit*\n` +
        `Pesca una carta.\n\n` +

        `🛑 *.bj stand*\n` +
        `Passa.\n\n` +

        `💰 *.bj double*\n` +
        `Raddoppia la puntata e pesca una carta.\n\n` +

        `✂️ *.bj split*\n` +
        `Divide una coppia.\n\n` +

        `🛡️ *.bj insurance*\n` +
        `Assicurazione contro il blackjack del banco.\n\n` +

        `💼 *.bj saldo*\n` +
        `Mostra le tue fiches.\n\n` +

        `🏆 *.bj players*\n` +
        `Mostra i giocatori.\n\n` +

        `❌ *.bj cancel*\n` +
        `Annulla il tavolo.\n\n` +

        `🎲 Minimo: *${MIN_BET}*\n` +
        `🎲 Massimo: *${MAX_BET}*\n` +
        `👥 Massimo giocatori: *${MAX_PLAYERS}*\n` +
        `🪙 Saldo iniziale: *${START_BALANCE}*`
    )
}

/* =========================
   HANDLER
========================= */

let handler = async (m, { conn, args, command }) => {
    if (!m) return

    const chat = m.chat
    const jid = playerId(m)
    const name = playerName(m)

    if (!jid) return

    const sub = String(args?.[0] || '').toLowerCase()

    /* =========================
       SALDO
    ========================= */

    if (
        command === 'saldo' ||
        command === 'bj-saldo' ||
        (command === 'bj' && sub === 'saldo')
    ) {
        return reply(
            conn,
            chat,
            `💼 *PORTAFOGLIO*\n\n` +
            `👤 ${name}\n` +
            `🪙 Saldo: *${money(getBalance(jid))}*`,
            m
        )
    }

    /* =========================
       HELP
    ========================= */

    if (
        command === 'bjhelp' ||
        (command === 'bj' && sub === 'help')
    ) {
        return reply(
            conn,
            chat,
            helpText(),
            m
        )
    }

    let game = games.get(chat)

    /* =========================
       CANCEL
    ========================= */

    if (
        command === 'bj' &&
        ['cancel', 'stop', 'end'].includes(sub)
    ) {
        if (!game) {
            return reply(
                conn,
                chat,
                `❌ Non c'è nessuna partita attiva.`,
                m
            )
        }

        // Solo l'host può cancellare.
        if (game.host !== jid) {
            return reply(
                conn,
                chat,
                `⛔ Solo chi ha creato il tavolo può annullarlo.`,
                m
            )
        }

        // Se la partita non è ancora iniziata,
        // restituiamo tutte le puntate.
        if (game.phase === 'waiting') {
            for (const player of activePlayers(game)) {
                const refund = player.hands.reduce(
                    (sum, hand) => sum + hand.bet,
                    0
                )

                addBalance(
                    player.jid,
                    refund
                )
            }
        }

        games.delete(chat)

        return reply(
            conn,
            chat,
            `🛑 *PARTITA ANNULLATA*\n\n` +
            `Il tavolo è stato chiuso.`,
            m
        )
    }

    /* =========================
       PLAYERS
    ========================= */

    if (
        command === 'bj' &&
        ['players', 'giocatori', 'player'].includes(sub)
    ) {
        if (!game) {
            return reply(
                conn,
                chat,
                `❌ Nessuna partita attiva.`,
                m
            )
        }

        let text =
            `👥 *GIOCATORI*\n\n`

        for (const player of activePlayers(game)) {
            text +=
                `👤 *${player.name}*` +
                `${player.done ? ' ✅' : ''}` +
                `\n`
        }

        text +=
            `\n👥 Totale: *${game.players.size}/${MAX_PLAYERS}*`

        if (game.phase === 'waiting') {
            text +=
                `\n\n⏳ Tavolo in attesa di *.bj start*.`
        }

        return reply(
            conn,
            chat,
            text,
            m
        )
    }

    /* =========================
       JOIN
    ========================= */

    if (
        command === 'bj' &&
        ['join', 'entra', 'partecipa'].includes(sub)
    ) {
        if (!game) {
            return reply(
                conn,
                chat,
                `❌ Non c'è ancora una partita.\n\n` +
                `Usa *.blackjack* per creare un tavolo.`,
                m
            )
        }

        if (game.phase !== 'waiting') {
            return reply(
                conn,
                chat,
                `❌ La partita è già iniziata.`,
                m
            )
        }

        if (game.players.size >= MAX_PLAYERS) {
            return reply(
                conn,
                chat,
                `❌ Il tavolo è pieno.\n` +
                `Massimo: *${MAX_PLAYERS} giocatori*.`,
                m
            )
        }

        if (game.players.has(jid)) {
            return reply(
                conn,
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
            return reply(
                conn,
                chat,
                `❌ Puntata non valida.\n\n` +
                `Esempio: *.bj join 100*\n` +
                `Minimo: *${MIN_BET}*\n` +
                `Massimo: *${MAX_BET}*`,
                m
            )
        }

        if (getBalance(jid) < bet) {
            return reply(
                conn,
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

        return reply(
            conn,
            chat,
            `✅ *${name}* è entrato al tavolo!\n\n` +
            `💰 Puntata: *${money(bet)}*\n` +
            `🪙 Saldo restante: *${money(getBalance(jid))}*\n\n` +
            `👥 Giocatori: *${game.players.size}/${MAX_PLAYERS}*\n\n` +
            `▶️ L'host può usare *.bj start* quando siete pronti.`,
            m
        )
    }

    /* =========================
       LEAVE
    ========================= */

    if (
        command === 'bj' &&
        ['leave', 'esci'].includes(sub)
    ) {
        if (!game) {
            return reply(
                conn,
                chat,
                `❌ Non c'è nessuna partita.`,
                m
            )
        }

        if (game.phase !== 'waiting') {
            return reply(
                conn,
                chat,
                `❌ Non puoi uscire durante una mano in corso.`,
                m
            )
        }

        const player = game.players.get(jid)

        if (!player) {
            return reply(
                conn,
                chat,
                `❌ Non sei nella partita.`,
                m
            )
        }

        const refund = player.hands.reduce(
            (sum, hand) => sum + hand.bet,
            0
        )

        addBalance(
            jid,
            refund
        )

        game.players.delete(jid)

        game.turnOrder =
            game.turnOrder.filter(
                x => x !== jid
            )

        return reply(
            conn,
            chat,
            `🚪 *${name}* ha lasciato il tavolo.\n\n` +
            `💰 Restituite: *${money(refund)}*`,
            m
        )
    }

    /* =========================
       START
    ========================= */

    if (
        command === 'bj' &&
        ['start', 'inizia', 'avvia'].includes(sub)
    ) {
        if (!game) {
            return reply(
                conn,
                chat,
                `❌ Nessun tavolo aperto.\n\n` +
                `Usa *.blackjack* per crearne uno.`,
                m
            )
        }

        if (game.host !== jid) {
            return reply(
                conn,
                chat,
                `⛔ Solo chi ha creato il tavolo può avviare la partita.`,
                m
            )
        }

        if (game.phase !== 'waiting') {
            return reply(
                conn,
                chat,
                `❌ La partita è già iniziata.`,
                m
            )
        }

        if (game.players.size < 1) {
            return reply(
                conn,
                chat,
                `❌ Serve almeno un giocatore.\n\n` +
                `Usa *.bj join 100*.`,
                m
            )
        }

        await startGame(
            conn,
            chat,
            game
        )

        return
    }

    /* =========================
       HIT
    ========================= */

    if (
        command === 'bj' &&
        ['hit', 'h', 'carta'].includes(sub)
    ) {
        if (!game) {
            return reply(
                conn,
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

    /* =========================
       STAND
    ========================= */

    if (
        command === 'bj' &&
        ['stand', 's', 'stop'].includes(sub)
    ) {
        if (!game) {
            return reply(
                conn,
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

    /* =========================
       DOUBLE
    ========================= */

    if (
        command === 'bj' &&
        ['double', 'd', 'raddoppia'].includes(sub)
    ) {
        if (!game) {
            return reply(
                conn,
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

    /* =========================
       SPLIT
    ========================= */

    if (
        command === 'bj' &&
        ['split', 'splitto', 'dividi'].includes(sub)
    ) {
        if (!game) {
            return reply(
                conn,
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

    /* =========================
       INSURANCE
    ========================= */

    if (
        command === 'bj' &&
        ['insurance', 'assicurazione', 'ins'].includes(sub)
    ) {
        if (!game) {
            return reply(
                conn,
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

    /* =========================
       NUOVO TAVOLO
    ========================= */

    if (
        command !== 'blackjack' &&
        command !== 'bj'
    ) {
        return
    }

    if (game) {
        return reply(
            conn,
            chat,
            `🃏 *BLACKJACK GIÀ ATTIVO!*\n\n` +
            `👥 Giocatori: *${game.players.size}/${MAX_PLAYERS}*\n\n` +
            `Per entrare:\n` +
            `*.bj join 100*\n\n` +
            `Quando siete pronti:\n` +
            `*.bj start*\n\n` +
            `*.bj help*`,
            m
        )
    }

    /*
     * CREAZIONE TAVOLO
     *
     * L'utente che scrive .blackjack diventa host.
     */
    game = {
        chat,

        phase: 'waiting',
        joinOpen: true,

        host: jid,
        hostName: name,

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

    const sent = await conn.reply(
        chat,
        renderWaiting(game),
        m
    )

    game.lastMessage = sent
    rememberMessage(game, sent)
}

handler.help = [
    'blackjack',
    'bj',
    'bj join <puntata>',
    'bj start',
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
