import { downloadMediaMessage } from '@whiskeysockets/baileys';

const handler = async (m, { conn }) => {
  if (!m.quoted) throw '*Rispondi a un messaggio impostato su View Once.*';

  // Ottiene il tipo di messaggio contenuto nella citazione
  const mtype = m.quoted.mtype || m.quoted.mediaType || Object.keys(m.quoted.message || {})[0] || '';

  // Verifica che si tratti di un'immagine, video o audio
  const isImage = /image/i.test(mtype);
  const isVideo = /video/i.test(mtype);
  const isAudio = /audio/i.test(mtype);

  if (!isImage && !isVideo && !isAudio) {
    throw '*Rispondi a un'immagine, video o nota vocale View Once.*';
  }

  try {
    // Scarica direttamente il media citato usando l'helper nativo di Baileys
    const buffer = await downloadMediaMessage(
      { message: m.quoted.message || m.quoted },
      'buffer',
      {},
      { 
        reconnect: conn.ws,
        logger: conn.logger
      }
    );

    if (!buffer) throw 'Impossibile scaricare il file.';

    // Recovers the caption if present
    const caption = m.quoted.caption || m.quoted.text || '';

    if (isVideo) {
      return await conn.sendMessage(m.chat, { video: buffer, caption, mimetype: 'video/mp4' }, { quoted: m });
    } else if (isImage) {
      return await conn.sendMessage(m.chat, { image: buffer, caption, mimetype: 'image/jpeg' }, { quoted: m });
    } else if (isAudio) {
      return await conn.sendMessage(m.chat, { audio: buffer, ptt: true, mimetype: 'audio/ogg; codecs=opus' }, { quoted: m });
    }
  } catch (error) {
    console.error('Errore nel download del ViewOnce:', error);
    throw '*Errore durante l\'estrazione del file View Once.*';
  }
};

handler.help = ['readvo'];
handler.tags = ['tools'];
handler.command = /^(readviewonce|read|revelar|readvo)$/i;

export default handler;