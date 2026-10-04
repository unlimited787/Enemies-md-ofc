/**
 * ANTILINK EDIT
 *
 * Controlla ESCLUSIVAMENTE i messaggi modificati.
 *
 * Non crea listener Baileys.
 * Non modifica messages.upsert.
 * Funziona tramite il normale sistema plugin/before() di Trashcore.
 *
 * Richiede:
 *   chat.antiLink === true
 *
 * Se un utente manda:
 *
 *   "ciao"
 *
 * e successivamente modifica in:
 *
 *   "ciao https://example.com"
 *
 * il messaggio viene eliminato e l'utente rimosso.
 */


const URL_REGEX =
    /(?:(?:https?|ftp):\/\/|www\.)[^\s<>"'`]+|(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}(?:\/[^\s<>"'`]*)?/i


/*
 * ---------------------------------------------------------
 * NORMALIZZAZIONE
 * ---------------------------------------------------------
 */

function normalizeText(text = '') {

    return String(text)
        .normalize('NFKC')
        .replace(/[\u200B-\u200D\uFEFF]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}


/*
 * ---------------------------------------------------------
 * LINK DETECTION
 * ---------------------------------------------------------
 */

function containsLink(text = '') {

    if (!text)
        return false

    const original =
        normalizeText(text)

    URL_REGEX.lastIndex = 0

    if (URL_REGEX.test(original)) {

        URL_REGEX.lastIndex = 0

        return true
    }

    URL_REGEX.lastIndex = 0


    /*
     * Gestisce:
     *
     * example [dot] com
     * example (dot) com
     * example {dot} com
     * example [.] com
     * example (.) com
     * example { . } com
     */

    const obfuscated =
        original
            .replace(/\[\s*dot\s*\]/gi, '.')
            .replace(/\(\s*dot\s*\)/gi, '.')
            .replace(/\{\s*dot\s*\}/gi, '.')
            .replace(/\[\s*\.\s*\]/g, '.')
            .replace(/\(\s*\.\s*\)/g, '.')
            .replace(/\{\s*\.\s*\}/g, '.')
            .replace(/\s*\.\s*/g, '.')


    URL_REGEX.lastIndex = 0

    if (URL_REGEX.test(obfuscated)) {

        URL_REGEX.lastIndex = 0

        return true
    }

    URL_REGEX.lastIndex = 0


    /*
     * Ultimo controllo:
     * rimuove gli spazi per intercettare
     * alcune forme semplici di offuscamento.
     */

    const compact =
        original
            .replace(/[\s\u200B-\u200D\uFEFF]+/g, '')
            .replace(/\[\s*dot\s*\]/gi, '.')
            .replace(/\(\s*dot\s*\)/gi, '.')
            .replace(/\{\s*dot\s*\}/gi, '.')


    URL_REGEX.lastIndex = 0

    const result =
        URL_REGEX.test(compact)

    URL_REGEX.lastIndex = 0

    return result
}


/*
 * ---------------------------------------------------------
 * ESTRAZIONE TESTO
 * ---------------------------------------------------------
 */

function getMessageTexts(message) {

    const texts = []


    const add = value => {

        if (
            typeof value === 'string' &&
            value.trim()
        ) {
            texts.push(value)
        }
    }


    if (!message)
        return texts


    add(message.conversation)


    if (message.extendedTextMessage) {

        add(
            message.extendedTextMessage.text
        )
    }


    if (message.imageMessage) {

        add(
            message.imageMessage.caption
        )
    }


    if (message.videoMessage) {

        add(
            message.videoMessage.caption
        )
    }


    if (message.documentMessage) {

        add(
            message.documentMessage.caption
        )

        add(
            message.documentMessage.fileName
        )
    }


    if (message.audioMessage) {

        add(
            message.audioMessage.fileName
        )
    }


    if (message.stickerMessage) {

        add(
            message.stickerMessage.fileName
        )
    }


    if (message.contactMessage) {

        add(
            message.contactMessage.displayName
        )

        add(
            message.contactMessage.vcard
        )
    }


    if (message.contactsArrayMessage) {

        add(
            message.contactsArrayMessage.displayName
        )


        for (
            const contact
            of message.contactsArrayMessage.contacts || []
        ) {

            add(
                contact?.displayName
            )

            add(
                contact?.vcard
            )
        }
    }


    if (message.buttonsResponseMessage) {

        add(
            message.buttonsResponseMessage.selectedDisplayText
        )

        add(
            message.buttonsResponseMessage.selectedButtonId
        )
    }


    if (message.listResponseMessage) {

        add(
            message.listResponseMessage.title
        )

        add(
            message.listResponseMessage.description
        )

        add(
            message.listResponseMessage.singleSelectReply?.selectedRowId
        )
    }


    if (message.templateButtonReplyMessage) {

        add(
            message.templateButtonReplyMessage.selectedDisplayText
        )

        add(
            message.templateButtonReplyMessage.selectedId
        )
    }


    if (message.interactiveResponseMessage) {

        const nativeFlow =
            message
                .interactiveResponseMessage
                ?.nativeFlowResponseMessage


        if (nativeFlow) {

            add(
                nativeFlow.paramsJson
            )
        }
    }


    return [
        ...new Set(texts)
    ]
}


/*
 * ---------------------------------------------------------
 * ESTRAZIONE DEI MESSAGGI MODIFICATI
 * ---------------------------------------------------------
 *
 * Qui NON cerchiamo il messaggio normale.
 *
 * Cerchiamo esclusivamente strutture che indicano
 * un messaggio modificato.
 * ---------------------------------------------------------
 */

function getEditedMessages(m) {

    const result = []


    const root =
        m?.message ||
        m?.msg ||
        null


    /*
     * Forma principale Baileys:
     *
     * protocolMessage.editedMessage
     */

    const protocol =
        root?.protocolMessage


    if (protocol?.editedMessage) {

        result.push({
            message: protocol.editedMessage,
            key: protocol.key || m?.key || null
        })
    }


    /*
     * Alcuni wrapper possono esporre direttamente
     * editedMessage.
     */

    if (m?.editedMessage) {

        result.push({
            message: m.editedMessage,
            key: m?.key || null
        })
    }


    if (root?.editedMessage) {

        result.push({
            message: root.editedMessage,
            key: m?.key || null
        })
    }


    /*
     * Evita duplicati.
     */

    const unique = []
    const seen = new Set()


    for (const item of result) {

        const serialized =
            JSON.stringify(item.message)


        if (seen.has(serialized))
            continue


        seen.add(serialized)

        unique.push(item)
    }


    return unique
}


/*
 * ---------------------------------------------------------
 * VERIFICA LINK
 * ---------------------------------------------------------
 */

function editedContainsLink(editedMessage) {

    const texts =
        getMessageTexts(editedMessage)


    return texts.some(
        text => containsLink(text)
    )
}


/*
 * ---------------------------------------------------------
 * PUNIZIONE
 * ---------------------------------------------------------
 */

async function antilink1(
    conn,
    chat,
    messageId,
    participant
) {

    if (
        !conn ||
        !chat ||
        !messageId ||
        !participant
    ) {
        return false
    }


    let deleted = false
    let removed = false


    /*
     * DELETE
     */

    try {

        await conn.sendMessage(
            chat,
            {
                delete: {
                    remoteJid: chat,
                    fromMe: false,
                    id: messageId,
                    participant
                }
            }
        )

        deleted = true

    } catch (error) {

        console.error(
            '[ANTILINK-EDIT] Delete error:',
            error
        )
    }


    /*
     * REMOVE
     */

    try {

        await conn.groupParticipantsUpdate(
            chat,
            [participant],
            'remove'
        )

        removed = true

    } catch (error) {

        console.error(
            '[ANTILINK-EDIT] Remove error:',
            error
        )
    }


    return deleted || removed
}


/*
 * ---------------------------------------------------------
 * BEFORE
 * ---------------------------------------------------------
 */

export async function before(
    m,
    {
        conn,
        isAdmin,
        isBotAdmin
    }
) {

    /*
     * Non è un gruppo
     */

    if (!m?.isGroup)
        return false


    /*
     * Anti-link disattivato
     */

    const chat =
        global.db.data.chats[m.chat]


    if (!chat?.antiLink)
        return true


    /*
     * Admin esclusi
     */

    if (isAdmin)
        return true


    /*
     * Il bot deve essere admin per poter
     * cancellare/rimuovere.
     */

    if (!isBotAdmin)
        return true


    /*
     * -----------------------------------------------------
     * CERCA ESCLUSIVAMENTE EDIT
     * -----------------------------------------------------
     */

    const editedMessages =
        getEditedMessages(m)


    /*
     * Se non è una modifica,
     * questo plugin non deve intervenire.
     */

    if (!editedMessages.length)
        return true


    /*
     * -----------------------------------------------------
     * CONTROLLA OGNI POSSIBILE VERSIONE EDITATA
     * -----------------------------------------------------
     */

    for (const edited of editedMessages) {

        const editedMessage =
            edited.message


        if (!editedContainsLink(editedMessage))
            continue


        /*
         * -------------------------------------------------
         * KEY DEL MESSAGGIO ORIGINALE
         * -------------------------------------------------
         */

        const key =
            edited.key ||
            m?.key


        if (!key)
            continue


        const chatId =
            key.remoteJid ||
            m.chat


        const messageId =
            key.id ||
            m?.key?.id


        /*
         * Participant:
         *
         * preferiamo quello della key originale.
         */

        const participant =
            key.participant ||
            m?.key?.participant ||
            m?.sender


        if (!chatId)
            continue


        if (!messageId)
            continue


        if (!participant)
            continue


        console.log(
            '[ANTILINK-EDIT] LINK RILEVATO',
            {
                chat: chatId,
                sender: participant,
                messageId
            }
        )


        /*
         * Punizione.
         */

        await antilink1(
            conn,
            chatId,
            messageId,
            participant
        )


        /*
         * Una volta trovato un link,
         * non serve continuare.
         */

        break
    }


    return true
}