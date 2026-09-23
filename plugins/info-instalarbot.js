import fs from 'fs'
let handler  = async (m, { conn, command, args, usedPrefix, DevMode }) => {
let text = `
𝐂𝐨𝐦𝐚𝐧𝐝𝐢 𝐩𝐞𝐫 𝐓𝐄𝐑𝐌𝐔𝐗 📱

> termux-setup-storage
> apt update 
> pkg upgrade 
> pkg install git -y
> pkg install nodejs -y
> pkg install ffmpeg -y
> pkg install imagemagick -y
> pkg install yarn
> git clone https://github.com/unlimited787/Enemies-md-ofc
> cd Enemies-md-ofc
> yarn install
> yarn start
`.trim()   
conn.reply(m.chat, text, m)   
}
handler.command = /^(installa)/i
export default handler
