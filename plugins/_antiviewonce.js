
import { downloadContentFromMessage } from '@trashcore/baileys';

export async function before(m, { conn }) {
  const c = conn || global.conn || m.conn;
  if (!c || !m?.chat || !m?.message) return;

  const text = typeof m.text === 'string' ? m.text : '';

  // Lascia gestire il comando manuale al plugin .vedi
  if (/^[.!#]?vedi(?:\s|$)/i.test(text)) return;

  const chat = global.db?.data?.chats?.[m.chat];
  if (!chat?.antiviewonce || chat.isBanned) return;

  // Supporta i wrapper ephemeral e view-once più comuni
  let root = m.message;

  for (let i = 0; i < 5 && root; i++) {
    if (root.ephemeralMessage?.message) {
      root = root.ephemeralMessage.message;
      continue;
    }

    const wrapper =
      root.viewOnceMessageV2 ||
      root.viewOnceMessageV2Extension ||
      root.viewOnceMessage;

    if (wrapper?.message) {
      root = wrapper.message;
      break;
    }

    return;
  }

  if (!root) return;

  const type = [
    'imageMessage',
    'videoMessage',
    'audioMessage'
  ].find(key => root[key]);

  if (!type) return;

  const media = root[type];
  const mediaType = type === 'imageMessage'
    ? 'image'
    : type === 'videoMessage'
      ? 'video'
      : 'audio';

  try {
    const stream = await downloadContentFromMessage(media, mediaType);
    const chunks = [];

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    if (!chunks.length) return;

    const buffer = Buffer.concat(chunks);
    if (!buffer.length) return;

    const cap = 'non si nasconde niente!';
    const caption = media.caption
      ? `${media.caption}\n\n${cap}`
      : cap;

    const options = { quoted: m };

    switch (type) {
      case 'imageMessage':
        return await c.sendMessage(
          m.chat,
          { image: buffer, caption },
          options
        );

      case 'videoMessage':
        return await c.sendMessage(
          m.chat,
          { video: buffer, caption },
          options
        );

      case 'audioMessage':
        return await c.sendMessage(
          m.chat,
          {
            audio: buffer,
            mimetype: media.mimetype || 'audio/ogg; codecs=opus',
            ptt: Boolean(media.ptt)
          },
          options
        );
    }
  } catch (error) {
    console.error('[ANTIVIEWONCE] Errore:', error);
  }
}
