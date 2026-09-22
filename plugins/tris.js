import TicTacToe from '../tictactoe.js';

const handler = async (m, { conn, usedPrefix, command, text }) => {
  conn.game = conn.game ? conn.game : {};

  // Controlla se il giocatore è già in partita
  if (Object.values(conn.game).find((room) => room.id.startsWith('tictactoe') && [room.game.playerX, room.game.playerO].includes(m.sender))) {
    throw '⚠️ Hai già una partita in corso!';
  }

  if (!text) throw `⚠️ Inserisci un nome per la stanza.\nEsempio: *${usedPrefix + command} stanza1*`;

  let room = Object.values(conn.game).find((room) => room.state === 'WAITING' && room.name === text);

  if (room) {
    // Unisciti alla stanza esistente (Giocatore O)
    await m.reply('🎮 Ti sei unito alla partita!');
    room.o = m.chat;
    room.game.playerO = m.sender;
    room.state = 'PLAYING';

    const arr = room.game.render().map((v) => {
      return { X: '❎', O: '⭕', 1: '1️⃣', 2: '2️⃣', 3: '3️⃣', 4: '4️⃣', 5: '5️⃣', 6: '6️⃣', 7: '7️⃣', 8: '8️⃣', 9: '9️⃣' }[v];
    });

    const str = `
🎮 *TRIS (TIC TAC TOE)* 🎮

❎ = @${room.game.playerX.split('@')[0]}
⭕ = @${room.game.playerO.split('@')[0]}

       ${arr.slice(0, 3).join('')}
       ${arr.slice(3, 6).join('')}
       ${arr.slice(6).join('')}

Turno di: @${room.game.currentTurn.split('@')[0]}
`.trim();

    const mentions = [room.game.playerX, room.game.playerO];
    if (room.x !== room.o) await conn.sendMessage(room.x, { text: str, mentions }, { quoted: m });
    await conn.sendMessage(room.o, { text: str, mentions }, { quoted: m });

  } else {
    // Crea una nuova stanza (Giocatore X)
    room = {
      id: 'tictactoe-' + (+new Date),
      x: m.chat,
      o: '',
      game: new TicTacToe(m.sender, 'x'), // Corretto da 'o' a 'x'
      state: 'WAITING',
      name: text
    };

    conn.reply(
      m.chat, 
      `⏳ *In attesa del secondo giocatore...*\n\nPer unirti digita: *${usedPrefix + command} ${text}*\nPer annullare usa: *${usedPrefix}delttt*`, 
      m
    );

    conn.game[room.id] = room;
  }
};

handler.command = /^(tictactoe|tris|ttt|xo)$/i;
export default handler;