export async function before(m) {
  this.game = this.game ? this.game : {};
  let room = Object.values(this.game).find(
    (room) =>
      room.id.startsWith('tictactoe') &&
      [room.game.playerX, room.game.playerO].includes(m.sender) &&
      room.state === 'PLAYING'
  );

  if (!room) return true;

  // Intercetta i numeri da 1 a 9
  if (/^[1-9]$/.test(m.text)) {
    // Il turno richiede 0 per il giocatore X e 1 per il giocatore O
    const playerIndex = m.sender === room.game.playerX ? 0 : 1;
    const pos = parseInt(m.text) - 1; // Converte da 1-9 a 0-8

    // Esegue la mossa
    const ok = room.game.turn(playerIndex, pos);

    // Gestione degli errori ritornati dalla classe TicTacToe
    if (ok === -2) {
      await m.reply('⚠️ Non è il tuo turno!');
      return true;
    }
    if (ok === 0) {
      await m.reply('⚠️ Casella già occupata!');
      return true;
    }
    if (ok === -1) {
      await m.reply('⚠️ Posizione non valida!');
      return true;
    }
    if (ok === -3) {
      await m.reply('⚠️ La partita è già terminata!');
      return true;
    }

    // Se ok === 1, la mossa è andata a buon fine
    const isWin = room.game.winner;
    const isTie = room.game.board === 511;

    const arr = room.game.render().map((v) => {
      return {
        X: '❎',
        O: '⭕',
        1: '1️⃣',
        2: '2️⃣',
        3: '3️⃣',
        4: '4️⃣',
        5: '5️⃣',
        6: '6️⃣',
        7: '7️⃣',
        8: '8️⃣',
        9: '9️⃣',
      }[v];
    });

    let str = `
🎮 *TRIS (TIC TAC TOE)* 🎮

❎ = @${room.game.playerX.split('@')[0]}
⭕ = @${room.game.playerO.split('@')[0]}

       ${arr.slice(0, 3).join('')}
       ${arr.slice(3, 6).join('')}
       ${arr.slice(6).join('')}

${isWin ? `🎉 VINCITORE: @${room.game.winner.split('@')[0]}!` : isTie ? `🤝 PAREGGIO!` : `Turno di: @${room.game.currentTurn.split('@')[0]}`}
`.trim();

    const mentions = [room.game.playerX, room.game.playerO];
    await this.sendMessage(m.chat, { text: str, mentions }, { quoted: m });

    // Rimuove la stanza se la partita è finita o c'è un vincitore
    if (isWin || isTie) {
      delete this.game[room.id];
    }
  }
  return true;
}