let handler = async (m, { conn, usedPrefix, text }) => {
    let user = null;

    if (m.quoted?.sender) {
        user = m.quoted.sender;
    } else if (Array.isArray(m.mentionedJid) && m.mentionedJid.length) {
        user = m.mentionedJid[0];
    } else if (text) {
        let number = text.replace(/[^0-9]/g, '');

        if (number.length >= 11 && number.length <= 13) {
            user = number + '@s.whatsapp.net';
        }
    }

    if (!user) return;

    try {
        await conn.groupParticipantsUpdate(
            m.chat,
            [user],
            'promote'
        );
    } catch (e) {
        console.error('[PROMOTE ERROR]', e);
    }
};

handler.help = ['*593xxx*', '*@usuario*', '*risponder chat*']
    .map(v => 'promote ' + v);

handler.tags = ['group'];
handler.command = /^(promote|promuovi|mettiadmin)$/i;
handler.group = true;
handler.admin = true;
handler.botAdmin = true;
handler.fail = null;

export default handler;