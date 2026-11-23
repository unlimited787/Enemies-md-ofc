
const handler = async (m, { conn }) => {
    const user = m.mentionedJid?.[0] || m.quoted?.sender

    if (!user) {
        throw '*Tagga un utente oppure rispondi a un suo messaggio!*'
    }

    const percentuale = Math.floor(Math.random() * 101)

    const fasce = [
        {
            max: 10,
            commenti: [
                '🥶 Pare che sia finita prima ancora di cominciare.',
                '💀 L\'atmosfera era più fredda del Polo Nord.',
                '🪦 Un minuto di silenzio per le aspettative.',
                '🚫 Accesso negato. La passione non si è presentata.'
            ]
        },
        {
            max: 25,
            commenti: [
                '😬 Tanto entusiasmo, ma poca sostanza.',
                '😂 Ci ha provato, ma il risultato non è stato memorabile.',
                '🥱 Qualche scintilla, ma niente incendio.',
                '📉 Le aspettative erano decisamente più alte.'
            ]
        },
        {
            max: 40,
            commenti: [
                '😏 Qualcosa si è mosso, ma manca ancora la magia.',
                '🔥 Un inizio interessante, finale da migliorare.',
                '😉 Non è stato un disastro, ma nemmeno una leggenda.',
                '🫣 C\'è del potenziale nascosto.'
            ]
        },
        {
            max: 60,
            commenti: [
                '😈 Una serata abbastanza movimentata!',
                '🔥 Qualche momento decisamente interessante.',
                '🥵 Non male, qualcuno si è divertito.',
                '😉 Buona intesa, ma si può fare ancora meglio.'
            ]
        },
        {
            max: 80,
            commenti: [
                '🥵 Le temperature sono salite parecchio!',
                '😏 Una prestazione che lascia il segno.',
                '🔥 Pare che nessuno avesse fretta di andare a dormire.',
                '💋 Intesa notevole e atmosfera decisamente piccante.'
            ]
        },
        {
            max: 95,
            commenti: [
                '🚀 Prestazione da campionato mondiale!',
                '🥵 Qui è servito il ventilatore.',
                '😈 Una notte che difficilmente verrà dimenticata.',
                '👑 Professionalità, tecnica e passione: livello altissimo.'
            ]
        },
        {
            max: 100,
            commenti: [
                '🏆 RECORD MONDIALE! Gli arbitri chiedono spiegazioni.',
                '💀 WhatsApp ha dovuto abbassare la temperatura.',
                '🔥🔥 Leggenda assoluta. Nessun commento necessario.',
                '👑 Il manuale delle prestazioni porta il suo nome.'
            ]
        }
    ]

    const fascia = fasce.find(f => percentuale <= f.max)
    const commento = fascia.commenti[
        Math.floor(Math.random() * fascia.commenti.length)
    ]

    const tag = `@${user.split('@')[0]}`

    await conn.sendMessage(m.chat, {
        text: `🔞 *MACCHINA DEL SESSO*\n\n👤 *Protagonista:* ${tag}\n📊 *Indice di prestazione:* ${percentuale}%\n\n📝 *IL VERDETTO*\n${commento}\n\n🤫 _Risultato generato dalla macchina. Nessuna testimonianza verificata._`,
        mentions: [user]
    }, { quoted: m })
}

handler.help = ['sesso @utente']
handler.tags = ['fun']
handler.command = /^sesso$/i

export default handler
