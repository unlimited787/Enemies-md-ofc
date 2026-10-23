const { downloadContentFromMessage } = (await import('@trashcore/baileys'));

export async function before(m, { isAdmin, isBotAdmin, conn }) {
  if (!m.chat) return;
  if (/^[.!#]?vedi/i.test(m.text || '')) return;

  const chat = db.data.chats[m.chat];
  if (!chat?.antiviewonce || chat?.isBanned) return;

  // srotola eventuale ephemeral e prendi il wrapper view-once qualunque sia la variante
  const root = m.message?.ephemeralMessage?.message || m.message;
  const wrapper = root?.viewOnceMessageV2
    || root?.viewOnceMessageV2Extension
    || root?.viewOnceMessage;
  if (!wrapper) return;

  const msg = wrapper.message;
  const type = Object.keys(msg || {}).find(k =>
    /^(imageMessage|videoMessage|audioMessage)$/.test(k)
  );
  if (!type) return;

  const mediaType = type === 'imageMessage' ? 'image'
                  : type === 'videoMessage' ? 'video'
                  : 'audio';

  try {
    const stream = await downloadContentFromMessage(msg[type], mediaType);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
    if (!buffer.length) return;

    const cap = 'non si nasconde niente!';
    const caption = msg[type].caption ? `${msg[type].caption}\n\n${cap}` : cap;
    const ext = mediaType === 'image' ? 'jpg' : mediaType === 'video' ? 'mp4' : 'ogg';

    return conn.sendFile(m.chat, buffer, `error.${ext}`, caption, m);
  } catch (e) {
    console.error('ANTIVIEWONCE:', e);
  }
}
