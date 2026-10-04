/**
 * ============================================================
 * ANTIBOT / BLACKLIST ONLY
 * ============================================================
 *
 * Il plugin si attiva SOLO se:
 *
 *   global.db.data.chats[m.chat].antibot === true
 *
 * Regola:
 *
 *   BLOCKED_TYPES -> BLOCCA
 *   qualsiasi altro tipo -> PASSA
 *
 * ============================================================
 */


const BLOCKED_TYPES = new Set([

    // Bottoni
    'buttonsMessage',
    'buttonsResponseMessage',

    // Liste
    'listMessage',
    'listResponseMessage',

    // Template
    'templateMessage',
    'templateButtonReplyMessage',

    // Interactive
    'interactiveMessage',
    'interactiveResponseMessage',

    // Native Flow
    'nativeFlowMessage',
    'nativeFlowResponseMessage',

    // Pagamenti
    'requestPaymentMessage',
    'sendPaymentMessage',
    'paymentInviteMessage',

    // Catalogo / prodotti
    'productMessage',
    'productButtonReplyMessage',
    'catalogMessage',
    'orderMessage',

    // Inviti speciali
    'groupInviteMessage',
    'groupInviteMessageV4',

    // Call
    'callLogMessage',

    // Eventi
    'eventMessage',

    // Status / mention
    'statusMentionMessage',

    // Device
    'deviceSentMessage'

])


function getMessageType(m) {

    if (
        typeof m?.mtype === 'string' &&
        m.mtype.trim()
    ) {
        return m.mtype
    }


    const message =
        m?.message ||
        m?.msg ||
        null


    if (!message)
        return null


    const knownTypes = [

        // Testo
        'conversation',
        'extendedTextMessage',

        // Media
        'imageMessage',
        'videoMessage',
        'audioMessage',
        'documentMessage',
        'stickerMessage',

        // Contatti
        'contactMessage',
        'contactsArrayMessage',

        // Posizione
        'locationMessage',
        'liveLocationMessage',

        // Sondaggi
        'pollCreationMessage',
        'pollCreationMessageV2',
        'pollCreationMessageV3',
        'pollUpdateMessage',

        // View once
        'viewOnceMessage',
        'viewOnceMessageV2',
        'viewOnceMessageV2Extension',

        // Effimeri
        'ephemeralMessage',

        // Modifiche
        'editedMessage',

        // Reazioni
        'reactionMessage',

        // Blacklist
        ...BLOCKED_TYPES,

        // Tipi tecnici NON bloccati
        'protocolMessage',
        'senderKeyDistributionMessage',
        'secretEncryptedMessage',
        'messageHistoryNotice'
    ]


    for (const type of knownTypes) {

        if (
            Object.prototype.hasOwnProperty.call(
                message,
                type
            )
        ) {
            return type
        }
    }


    /*
     * Tipo sconosciuto:
     * passa.
     */

    return null
}


function getInnerMessageType(m) {

    const message =
        m?.message ||
        m?.msg ||
        null


    if (!message)
        return null


    let inner = null


    if (message.viewOnceMessage) {

        inner =
            message.viewOnceMessage.message

    } else if (message.viewOnceMessageV2) {

        inner =
            message.viewOnceMessageV2.message

    } else if (message.viewOnceMessageV2Extension) {

        inner =
            message.viewOnceMessageV2Extension.message

    } else if (message.ephemeralMessage) {

        inner =
            message.ephemeralMessage.message

    } else if (message.editedMessage) {

        inner =
            message.editedMessage.message
    }


    if (!inner)
        return null


    const knownTypes = [

        'conversation',
        'extendedTextMessage',

        'imageMessage',
        'videoMessage',
        'audioMessage',
        'documentMessage',
        'stickerMessage',

        'contactMessage',
        'contactsArrayMessage',

        'locationMessage',
        'liveLocationMessage',

        'pollCreationMessage',
        'pollCreationMessageV2',
        'pollCreationMessageV3',
        'pollUpdateMessage',

        'viewOnceMessage',
        'viewOnceMessageV2',
        'viewOnceMessageV2Extension',

        'ephemeralMessage',
        'editedMessage',

        'reactionMessage',

        ...BLOCKED_TYPES,

        'protocolMessage',
        'senderKeyDistributionMessage',
        'secretEncryptedMessage',
        'messageHistoryNotice'
    ]


    for (const type of knownTypes) {

        if (
            Object.prototype.hasOwnProperty.call(
                inner,
                type
            )
        ) {
            return type
        }
    }


    return null
}


function shouldBlockMessage(m) {

    const type =
        getMessageType(m)


    /*
     * Nessun tipo:
     * NON bloccare.
     */

    if (!type)
        return false


    /*
     * Tipo direttamente nella blacklist.
     */

    if (
        BLOCKED_TYPES.has(type)
    ) {
        return true
    }


    /*
     * Controllo wrapper.
     */

    if (
        type === 'viewOnceMessage' ||
        type === 'viewOnceMessageV2' ||
        type === 'viewOnceMessageV2Extension' ||
        type === 'ephemeralMessage' ||
        type === 'editedMessage'
    ) {

        const innerType =
            getInnerMessageType(m)


        /*
         * Contenuto sconosciuto:
         * NON bloccare.
         */

        if (!innerType)
            return false


        /*
         * Blocca solo se il contenuto
         * è esplicitamente blacklistato.
         */

        return BLOCKED_TYPES.has(
            innerType
        )
    }


    /*
     * Qualsiasi altro tipo:
     * PASSA.
     */

    return false
}


/*
 * ============================================================
 * BEFORE
 * ============================================================
 */

export async function before(
    m,
    {
        isAdmin,
        isBotAdmin
    }
) {

    /*
     * Messaggi del bot.
     */

    if (
        m?.isBaileys &&
        m?.fromMe
    ) {
        return true
    }


    /*
     * Solo gruppi.
     */

    if (!m?.isGroup)
        return false


    /*
     * ========================================================
     * CONTROLLO ANTIBOT
     * ========================================================
     *
     * IMPORTANTE:
     *
     * Se antibot non è esattamente true,
     * il plugin si ferma immediatamente.
     */

    const chat =
        global.db?.data?.chats?.[m.chat]


    if (!chat)
        return true


    if (chat.antibot !== true)
        return true


    /*
     * Admin esclusi.
     */

    if (isAdmin)
        return true


    /*
     * Controlliamo la blacklist.
     */

    const shouldBlock =
        shouldBlockMessage(m)


    /*
     * Non è blacklist:
     * nessuna azione.
     */

    if (!shouldBlock)
        return true


    /*
     * Tipo per il log.
     */

    const type =
        getMessageType(m)


    console.log(
        '[ANTIBOT] Messaggio bloccato:',
        type
    )


    /*
     * Bot non admin:
     * non può intervenire.
     */

    if (!isBotAdmin)
        return true


    /*
     * Participant.
     */

    const participant =
        m?.key?.participant ||
        m?.sender


    /*
     * ID messaggio.
     */

    const messageId =
        m?.key?.id


    if (
        !participant ||
        !messageId
    ) {

        console.error(
            '[ANTIBOT] Impossibile punire: key incompleta',
            {
                participant,
                messageId,
                type
            }
        )

        return true
    }


    /*
     * ========================================================
     * DELETE
     * ========================================================
     */

    try {

        await this.sendMessage(
            m.chat,
            {
                delete: {
                    remoteJid: m.chat,
                    fromMe: false,
                    id: messageId,
                    participant
                }
            }
        )

    } catch (error) {

        console.error(
            '[ANTIBOT] Errore eliminazione:',
            error
        )
    }


    /*
     * ========================================================
     * REMOVE
     * ========================================================
     */

    try {

        if (m.sender) {

            await this.groupParticipantsUpdate(
                m.chat,
                [m.sender],
                'remove'
            )
        }

    } catch (error) {

        console.error(
            '[ANTIBOT] Errore rimozione:',
            error
        )
    }


    return true
}