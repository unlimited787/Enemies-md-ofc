/**
 * ============================================================
 * ANTIBOT / BLACKLIST ONLY
 * ============================================================
 *
 * Questo plugin NON usa una whitelist per decidere cosa bloccare.
 *
 * REGOLA:
 *
 *   BLOCKED_TYPES  -> BLOCCA
 *   qualsiasi altro tipo -> PASSA
 *
 * Questo evita espulsioni accidentali per:
 *
 *   - null
 *   - undefined
 *   - tipi sconosciuti
 *   - eventi tecnici
 *   - nuovi tipi introdotti da WhatsApp/Baileys
 *
 * ============================================================
 */


/*
 * ============================================================
 * TIPI ESPLICITAMENTE BLOCCATI
 * ============================================================
 */

const BLOCKED_TYPES = new Set([

    // --------------------------------------------------------
    // Bottoni
    // --------------------------------------------------------

    'buttonsMessage',
    'buttonsResponseMessage',


    // --------------------------------------------------------
    // Liste
    // --------------------------------------------------------

    'listMessage',
    'listResponseMessage',


    // --------------------------------------------------------
    // Template
    // --------------------------------------------------------

    'templateMessage',
    'templateButtonReplyMessage',


    // --------------------------------------------------------
    // Interactive
    // --------------------------------------------------------

    'interactiveMessage',
    'interactiveResponseMessage',


    // --------------------------------------------------------
    // Native Flow
    // --------------------------------------------------------

    'nativeFlowMessage',
    'nativeFlowResponseMessage',


    // --------------------------------------------------------
    // Pagamenti
    // --------------------------------------------------------

    'requestPaymentMessage',
    'sendPaymentMessage',
    'paymentInviteMessage',


    // --------------------------------------------------------
    // Catalogo / prodotti
    // --------------------------------------------------------

    'productMessage',
    'productButtonReplyMessage',
    'catalogMessage',
    'orderMessage',


    // --------------------------------------------------------
    // Inviti speciali
    // --------------------------------------------------------

    'groupInviteMessage',
    'groupInviteMessageV4',


    // --------------------------------------------------------
    // Call
    // --------------------------------------------------------

    'callLogMessage',


    // --------------------------------------------------------
    // Eventi
    // --------------------------------------------------------

    'eventMessage',


    // --------------------------------------------------------
    // Status / mention
    // --------------------------------------------------------

    'statusMentionMessage',


    // --------------------------------------------------------
    // Device
    // --------------------------------------------------------

    'deviceSentMessage'

])


/*
 * ============================================================
 * OTTIENE IL TIPO DEL MESSAGGIO
 * ============================================================
 *
 * NON prende semplicemente Object.keys()[0].
 *
 * Prima cerchiamo m.mtype.
 *
 * Poi cerchiamo solamente tipi conosciuti.
 *
 * Se non troviamo nulla:
 *
 *     return null
 *
 * E null PASSA.
 *
 * ============================================================
 */

function getMessageType(m) {

    /*
     * Alcuni handler lo forniscono già.
     */

    if (
        typeof m?.mtype === 'string' &&
        m.mtype.trim()
    ) {
        return m.mtype
    }


    /*
     * Recuperiamo il contenitore del messaggio.
     */

    const message =
        m?.message ||
        m?.msg ||
        null


    if (!message)
        return null


    /*
     * Tipi che ci interessa riconoscere.
     *
     * NON significa che siano consentiti.
     *
     * Servono solamente per identificare
     * correttamente i tipi.
     */

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

        // Altri tipi tecnici che NON vogliamo
        // trattare come blacklist automaticamente
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
     * Tipo sconosciuto.
     *
     * PASSERÀ.
     */

    return null
}


/*
 * ============================================================
 * TIPO INTERNO DEI WRAPPER
 * ============================================================
 *
 * Esempio:
 *
 * viewOnceMessage
 *      +-- imageMessage
 *
 *              -> PASSA
 *
 *
 * viewOnceMessage
 *      +-- interactiveMessage
 *
 *              -> BLOCCA
 *
 * ============================================================
 */

function getInnerMessageType(m) {

    const message =
        m?.message ||
        m?.msg ||
        null


    if (!message)
        return null


    let inner = null


    /*
     * View Once
     */

    if (message.viewOnceMessage) {

        inner =
            message.viewOnceMessage.message
    }


    /*
     * View Once V2
     */

    else if (message.viewOnceMessageV2) {

        inner =
            message.viewOnceMessageV2.message
    }


    /*
     * View Once V2 Extension
     */

    else if (message.viewOnceMessageV2Extension) {

        inner =
            message.viewOnceMessageV2Extension.message
    }


    /*
     * Ephemeral
     */

    else if (message.ephemeralMessage) {

        inner =
            message.ephemeralMessage.message
    }


    /*
     * Edited
     */

    else if (message.editedMessage) {

        inner =
            message.editedMessage.message
    }


    /*
     * Nessun contenuto interno.
     */

    if (!inner)
        return null


    /*
     * Cerchiamo solamente tipi realmente noti.
     */

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


    /*
     * Sconosciuto.
     */

    return null
}


/*
 * ============================================================
 * CONTROLLA SE DEVE ESSERE BLOCCATO
 * ============================================================
 *
 * Questa è la parte importante.
 *
 * NON esiste una whitelist decisionale.
 *
 * Se BLOCKED_TYPES contiene il tipo:
 *
 *     false
 *
 * Altrimenti:
 *
 *     true
 *
 * ============================================================
 */

function shouldBlockMessage(m) {

    const type =
        getMessageType(m)


    /*
     * Nessun tipo riconosciuto:
     *
     * PASSA.
     */

    if (!type)
        return false


    /*
     * Tipo direttamente bloccato.
     */

    if (
        BLOCKED_TYPES.has(type)
    ) {
        return true
    }


    /*
     * Wrapper.
     *
     * Controlliamo il contenuto interno.
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
         * Non sappiamo cosa c'è dentro:
         *
         * PASSA.
         */

        if (!innerType)
            return false


        /*
         * Blocchiamo SOLO se il contenuto interno
         * è esplicitamente nella blacklist.
         */

        return BLOCKED_TYPES.has(
            innerType
        )
    }


    /*
     * Qualsiasi altra cosa:
     *
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
     * Messaggi del bot:
     * ignorati.
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
     * Admin:
     * esclusi.
     */

    if (isAdmin)
        return true


    /*
     * Controlliamo SOLO la blacklist.
     */

    const shouldBlock =
        shouldBlockMessage(m)


    /*
     * Se non è nella blacklist:
     *
     * NON FACCIAMO NULLA.
     */

    if (!shouldBlock)
        return true


    /*
     * Recuperiamo il tipo solamente
     * per il log.
     */

    const type =
        getMessageType(m)


    console.log(
        '[ANTIBOT] Messaggio bloccato:',
        type
    )


    /*
     * Se il bot non è admin,
     * non può cancellare/rimuovere.
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
     * --------------------------------------------------------
     * DELETE
     * --------------------------------------------------------
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
     * --------------------------------------------------------
     * REMOVE
     * --------------------------------------------------------
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