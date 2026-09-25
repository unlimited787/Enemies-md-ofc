const parole = [
    'computer',
    'telefono',
    'internet',
    'whatsapp',
    'tastiera',
    'monitor',
    'programma',
    'javascript',
    'informatica',
    'videogioco',
    'montagna',
    'spiaggia',
    'arcobaleno',
    'temporale',
    'automobile',
    'bicicletta',
    'aeroporto',
    'stazione',
    'ristorante',
    'gelateria',
    'biblioteca',
    'universita',
    'scuola',
    'professore',
    'studente',
    'calcio',
    'pallone',
    'campione',
    'formulauno',
    'tennis',
    'cinema',
    'film',
    'attore',
    'musica',
    'chitarra',
    'pianoforte',
    'concerto',
    'italia',
    'francia',
    'germania',
    'spagna',
    'inghilterra',
    'brasile',
    'canada',
    'australia',
    'giappone',
    'america',
    'africa',
    'europa',
    'oceano',
    'pianeta',
    'galassia',
    'universo',
    'stella',
    'luna',
    'sole',
    'animale',
    'elefante',
    'giraffa',
    'coccodrillo',
    'pinguino',
    'farfalla',
    'leone',
    'tigre',
    'cane',
    'gatto',
    'cavallo',
    'scimmia',
    'serpente',
    'fotografia',
    'videocamera',
    'batteria',
    'caricatore',
    'server',
    'database',
    'software',
    'hardware',
    'processore',
    'memoria',
    'scheda',
    'robot',
    'intelligenza',
    'artificiale',
    'economia',
    'denaro',
    'banca',
    'mercato',
    'azienda',
    'lavoratore',
    'contratto',
    'politica',
    'storia',
    'geografia',
    'scienza',
    'matematica',
    'letteratura',
    'filosofia'
]

const partite = new Map()

const MAX_ERRORI = 6

function normalizza(testo) {
    return testo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z]/g, '')
}

function creaMaschera(parola, lettere) {
    return [...parola]
        .map(lettera =>
            lettere.has(lettera)
                ? lettera.toUpperCase()
                : '⬜'
        )
        .join(' ')
}

function statoPartita(partita) {
    const maschera = creaMaschera(
        partita.parola,
        partita.lettere
    )

    const errori = partita.errori.length
    const rimasti = MAX_ERRORI - errori

    return (
        `🔤 *IMPICCATO*\n\n` +
        `${maschera}\n\n` +
        `❌ Errori: *${errori}/${MAX_ERRORI}*\n` +
        `❤️ Tentativi rimasti: *${rimasti}*\n\n` +
        `🔡 Lettere usate:\n` +
        `${partita.usate.length
            ? partita.usate.map(x => x.toUpperCase()).join(', ')
            : 'Nessuna'}\n\n` +
        `👉 Rispondi citando questo messaggio con una lettera.\n` +
        `💡 Puoi anche provare direttamente la parola.`
    )
}

/*
 * Cancella i vecchi messaggi inviati dal bot
 * relativi a questa partita.
 */
async function eliminaVecchiMessaggi(conn, chat, partita) {
    const vecchi = [...partita.messageKeys]

    partita.messageKeys.clear()

    for (const key of vecchi) {
        try {
            if (!key?.id) continue

            await conn.sendMessage(chat, {
                delete: key
            })
        } catch (e) {
            // Se un messaggio non può essere eliminato,
            // il gioco continua comunque.
        }
    }
}

/*
 * Invia il nuovo messaggio dell'Impiccato,
 * salva la sua key e poi elimina i precedenti.
 */
async function replyGioco(conn, chat, testo, quoted, partita) {

    const vecchieKeys = [...partita.messageKeys]

    const sent = await conn.reply(
        chat,
        testo,
        quoted
    )

    /*
     * Il nuovo messaggio diventa l'unico
     * messaggio attivo dell'Impiccato.
     */
    partita.messageKeys.clear()

    if (sent?.key?.id) {
        partita.messageKeys.add(sent.key)
    }

    /*
     * Ora eliminiamo i messaggi precedenti.
     */
    for (const key of vecchieKeys) {
        try {
            if (!key?.id) continue

            await conn.sendMessage(chat, {
                delete: key
            })
        } catch (e) {
            // Ignora eventuali errori di cancellazione.
        }
    }

    return sent
}

let handler = async (m, { conn }) => {
    const chat = m.chat

    if (partite.has(chat)) {
        const partita = partite.get(chat)

        return replyGioco(
            conn,
            chat,
            `⚠️ *C'È GIÀ UNA PARTITA IN CORSO!*\n\n` +
            statoPartita(partita),
            m,
            partita
        )
    }

    const parola = normalizza(
        parole[Math.floor(Math.random() * parole.length)]
    )

    if (!parola) {
        return conn.reply(
            chat,
            '❌ Errore: impossibile scegliere una parola.',
            m
        )
    }

    const partita = {
        parola,
        lettere: new Set(),
        usate: [],
        errori: [],
        startedBy: m.sender,

        /*
         * Conserviamo le key dei messaggi
         * prodotti dal gioco.
         */
        messageKeys: new Set()
    }

    partite.set(chat, partita)

    await replyGioco(
        conn,
        chat,
        `🎮 *NUOVA PARTITA: IMPICCATO!*\n\n` +
        `Indovina la parola!\n\n` +
        `${'⬜ '.repeat(parola.length).trim()}\n\n` +
        `❌ Hai *${MAX_ERRORI} errori* disponibili.\n\n` +
        `👉 Per giocare devi *rispondere citando questo messaggio*.\n` +
        `🔤 Invia una lettera alla volta.\n` +
        `💡 Oppure prova direttamente a indovinare la parola!`,
        m,
        partita
    )
}

handler.before = async function (m, { conn }) {
    if (!m || m.fromMe) return

    const chat = m.chat
    const partita = partite.get(chat)

    if (!partita) return

    /*
     * Deve essere un messaggio quotato.
     */
    if (!m.quoted) return

    const quotedId =
        m.quoted?.id ||
        m.quoted?.key?.id

    if (!quotedId) return

    /*
     * Recuperiamo l'ID dell'unico messaggio
     * attualmente attivo.
     */
    let messaggioValido = false

    for (const key of partita.messageKeys) {
        if (key?.id === quotedId) {
            messaggioValido = true
            break
        }
    }

    if (!messaggioValido) return

    if (typeof m.text !== 'string') return

    const inputOriginale = m.text.trim()

    if (!inputOriginale) return

    const input = normalizza(inputOriginale)

    if (!input) return

    /*
     * PAROLA COMPLETA
     */

    if (input.length > 1) {

        if (input === partita.parola) {

            partite.delete(chat)

            return replyGioco(
                conn,
                chat,
                `🎉 *HAI VINTO!*\n\n` +
                `🏆 La parola era:\n` +
                `*${partita.parola.toUpperCase()}*\n\n` +
                `👏 Complimenti!`,
                m,
                partita
            )
        }

        partita.errori.push(input)

        if (partita.errori.length >= MAX_ERRORI) {

            partite.delete(chat)

            return replyGioco(
                conn,
                chat,
                `💀 *SEI STATO IMPICCATO!*\n\n` +
                `❌ Hai esaurito i tentativi.\n\n` +
                `✅ La parola era:\n` +
                `*${partita.parola.toUpperCase()}*`,
                m,
                partita
            )
        }

        return replyGioco(
            conn,
            chat,
            `❌ *PAROLA SBAGLIATA!*\n\n` +
            `Hai ancora *${MAX_ERRORI - partita.errori.length} errori* disponibili.\n\n` +
            statoPartita(partita),
            m,
            partita
        )
    }

    /*
     * LETTERA
     */

    const lettera = input

    if (!/^[a-z]$/.test(lettera)) return

    if (partita.usate.includes(lettera)) {

        return replyGioco(
            conn,
            chat,
            `⚠️ La lettera *${lettera.toUpperCase()}* è già stata usata!\n\n` +
            statoPartita(partita),
            m,
            partita
        )
    }

    partita.usate.push(lettera)

    /*
     * LETTERA CORRETTA
     */

    if (partita.parola.includes(lettera)) {

        partita.lettere.add(lettera)

        const completata = [...partita.parola]
            .every(x => partita.lettere.has(x))

        if (completata) {

            partite.delete(chat)

            return replyGioco(
                conn,
                chat,
                `🎉 *PAROLA COMPLETATA!*\n\n` +
                `🏆 *${partita.parola.toUpperCase()}*\n\n` +
                `👏 Complimenti, hai vinto!`,
                m,
                partita
            )
        }

        return replyGioco(
            conn,
            chat,
            `✅ *LETTERA CORRETTA!*\n\n` +
            statoPartita(partita),
            m,
            partita
        )
    }

    /*
     * LETTERA SBAGLIATA
     */

    partita.errori.push(lettera)

    if (partita.errori.length >= MAX_ERRORI) {

        partite.delete(chat)

        return replyGioco(
            conn,
            chat,
            `💀 *GAME OVER!*\n\n` +
            `Hai esaurito i tentativi.\n\n` +
            `✅ La parola era:\n` +
            `*${partita.parola.toUpperCase()}*`,
            m,
            partita
        )
    }

    return replyGioco(
        conn,
        chat,
        `❌ La lettera *${lettera.toUpperCase()}* non c'è!\n\n` +
        statoPartita(partita),
        m,
        partita
    )
}

handler.help = ['impiccato']
handler.tags = ['game']
handler.command = ['impiccato', 'hangman']

export default handler