const handler = async (m, { conn }) => {
    if (!m.quoted) {
        throw '*Rispondi a un messaggio per verificarne la veridicità.*'
    }

    const verita = Math.random() >= 0.5

    await conn.sendMessage(m.chat, {
        text: `MACCHINA DELLA VERITÀ RANDOMS\n\n📩 Messaggio: "${m.quoted.text || 'Contenuto multimediale'}"\n\n${verita ? '✅ *VERO*' : '❌ *FALSO*'}`
    }, { quoted: m })
}

handler.help = ['vero']
handler.tags = ['fun']
handler.command = /^vero$/i

export default handler
