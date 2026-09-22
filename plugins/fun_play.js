import yts from 'yt-search'
import { exec } from 'child_process'
import fs from 'fs'
import os from 'os'
import path from 'path'

global.playChoice = global.playChoice || {}

const execPromise = (cmd) => new Promise((resolve, reject) => {
  exec(cmd, { maxBuffer: 1024 * 1024 * 20 }, (err, stdout, stderr) => {
    if (err) reject(new Error(stderr || err.message))
    else resolve(stdout)
  })
})

let handler = async (m, { conn, text }) => {
  if (!text) return m.reply('🎧 Scrivi il titolo della canzone!')

  try {
    const search = await yts(text)
    const video = search.videos?.[0]

    if (!video) return m.reply('❌ Nessun risultato trovato.')

    await m.reply(
      `🎵 *${video.title}*\n\n` +
      `di ${video.author?.name || 'Sconosciuto'}\n` +
      `⏱️ ${video.timestamp || '—'}\n\n`
    )

    const file = path.join(
      os.tmpdir(),
      `play_${Date.now()}.mp3`
    )

    try {
      await execPromise(
        `yt-dlp --no-playlist -x --audio-format mp3 --audio-quality 0 -o "${file}" "${video.url}"`
      )

      if (!fs.existsSync(file)) {
        throw new Error('File audio non creato')
      }

      await conn.sendMessage(
        m.chat,
        {
          audio: fs.readFileSync(file),
          mimetype: 'audio/mpeg',
          fileName: `${video.title}.mp3`
        },
        { quoted: m }
      )

      try {
        fs.unlinkSync(file)
      } catch {}

    } catch (e) {
      console.error('[PLAY AUDIO]', e)

      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file)
        } catch {}
      }

      return m.reply(
        '❌ Errore durante il download dell’audio.\n\n' +
        'Controlla che yt-dlp e ffmpeg siano installati e aggiornati.'
      )
    }

  } catch (e) {
    console.error('[PLAY SEARCH]', e)
    return m.reply('❌ Errore durante la ricerca su YouTube.')
  }
}

handler.command = /^play$/i
handler.help = ['play']
handler.tags = ['fun']

export default handler