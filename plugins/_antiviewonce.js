const { downloadContentFromMessage } = (await import('@trashcore/baileys'));

export async function before(m, { isAdmin, isBotAdmin, conn }) {
  // conn può arrivare dal loader o stare nel global: fallback per sicurezza
  const c = conn || global.conn || m.conn;
  if (!c || !m.chat) return;

  // se l'utente sta lanciando il comando manuale, lascia fare a quello
  if (/^[.!#]?vedi/i.test(m.text || '')) return;

  const chat = db.data.chats[m.chat];
  if (!chat?.antiviewonce || chat?.isBanned) return;

  // srotola eventuale ephemeral e prendi il wrapper view-once in qualunque variante
  const root = m.message?.ephemeralMessage?.message || m.message;
  const wrapper = root?.viewOnceMessageV2
    || root?.viewOnceMessageV2Extension
    || root?.viewOnceMessage;

  const msg = wrapper?.message;
  if (!msg) return;

  try {
    // stessa selezione robusta del .vedi
    const type = Object.keys(msg).find(k =>
      /^(imageMessage|videoMessage|audioMessage)$/.test(k)
    );

    if (!type) return;

    const media = msg[type];

    let mediaType;
    if (type === 'imageMessage') {
      mediaType = 'image';
    } else if (type === 'videoMessage') {
      mediaType = 'video';
    } else {
      mediaType = 'audio';
    }

    const stream = await downloadContentFromMessage(media, mediaType);

    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    const buffer = Buffer.concat(chunks);

    if (!buffer.length) return;

    const cap = 'non si nasconde niente!';
    const caption = media.caption ? `${media.caption}\n\n${cap}` : cap;

    // stesso identico invio del .vedi, niente sendFile
    if (type === 'imageMessage') {
      return c.sendMessage(
        m.chat,
        { image: buffer, caption },
        { quoted: m }
      );
    }

    if (type === 'videoMessage') {
      return c.sendMessage(
        m.chat,
        { video: buffer, caption },
        { quoted: m }
      );
    }

    if (type === 'audioMessage') {
      return c.sendMessage(
        m.chat,
        {
          audio: buffer,
          mimetype: media.mimetype || 'audio/ogg; codecs=opus',
          ptt: media.ptt || false
        },
        { quoted: m }
      );
    }
  } catch (e) {
    console.error('ANTIVIEWONCE:', e);
  }
}
