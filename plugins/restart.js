const handler = async (m, {conn, isROwner, text}) => {
  if (!process.send) throw 'Dont: node main.js\nDo: node index.js';
    await m.reply('Arresto in corso. . .');
    process.send('reset');
};
handler.help = ['restart'];
handler.tags = ['owner'];
handler.command = ['spegnimento', 'spegni'];
handler.rowner = true;
export default handler;