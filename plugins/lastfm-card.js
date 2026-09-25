import fs from 'fs'
import { PassThrough } from 'stream'
import PImage from 'pureimage'

const FALLBACK_ART =
  'https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png'

let fontsLoaded = false

function loadFonts() {
  if (fontsLoaded) return

  const regularFonts = [
    '/system/fonts/RobotoStatic-Regular.ttf',
    '/system/fonts/RobotoStatic-Regular.ttf'
  ]

  const boldFonts = [
    '/system/fonts/RobotoStatic-Regular.ttf',
    '/system/fonts/RobotoStatic-Regular.ttf'
  ]

  const regular = regularFonts.find(f => fs.existsSync(f))
  const bold = boldFonts.find(f => fs.existsSync(f))

  if (regular) {
    try {
      PImage.registerFont(regular, 'Roboto').loadSync()
    } catch (e) {
      console.error('[lastfm-card] Errore font regular:', e.message)
    }
  }

  if (bold) {
    try {
      PImage.registerFont(bold, 'RobotoStatic-Regular').loadSync()
    } catch (e) {
      console.error('[lastfm-card] Errore font bold:', e.message)
    }
  }

  fontsLoaded = true
}

function escapeText(text) {
  return String(text || '')
}

function truncate(text, max) {
  text = escapeText(text)

  if (text.length <= max) return text

  return text.slice(0, max - 1) + '…'
}

function getAlbumArt(track) {
  const images = track?.image || []

  const preferred = [
    'extralarge',
    'large',
    'medium',
    'small'
  ]

  for (const size of preferred) {
    const image = images.find(
      x => x?.size === size && x?.['#text']
    )

    if (image?.['#text']) {
      return image['#text']
    }
  }

  return FALLBACK_ART
}

async function downloadImage(url) {
  try {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const buffer =
      Buffer.from(await response.arrayBuffer())

    return buffer

  } catch (e) {
    console.error(
      '[lastfm-card] Download immagine:',
      e.message
    )

    return null
  }
}

async function decodeImage(buffer) {
  if (!buffer) return null

  const stream = PassThrough()
  stream.end(buffer)

  /*
   * PNG magic bytes
   */
  const isPNG =
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47

  if (isPNG) {
    return await PImage.decodePNGFromStream(stream)
  }

  /*
   * JPEG
   */
  return await PImage.decodeJPEGFromStream(stream)
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath()

  ctx.moveTo(x + r, y)

  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(
    x + w,
    y,
    x + w,
    y + r
  )

  ctx.lineTo(x + w, y + h - r)

  ctx.quadraticCurveTo(
    x + w,
    y + h,
    x + w - r,
    y + h
  )

  ctx.lineTo(x + r, y + h)

  ctx.quadraticCurveTo(
    x,
    y + h,
    x,
    y + h - r
  )

  ctx.lineTo(x, y + r)

  ctx.quadraticCurveTo(
    x,
    y,
    x + r,
    y
  )

  ctx.closePath()
}

function drawCover(ctx, image, x, y, size) {
  const sourceSize =
    Math.min(image.width, image.height)

  const sx =
    (image.width - sourceSize) / 2

  const sy =
    (image.height - sourceSize) / 2

  ctx.save()

  roundedRect(
    ctx,
    x,
    y,
    size,
    size,
    16
  )

  ctx.clip()

  ctx.drawImage(
    image,
    sx,
    sy,
    sourceSize,
    sourceSize,
    x,
    y,
    size,
    size
  )

  ctx.restore()
}

function drawText(
  ctx,
  text,
  x,
  y,
  size,
  color,
  bold = false
) {
  ctx.fillStyle = color

  ctx.font = bold
    ? `${size}px "Roboto Bold"`
    : `${size}px Roboto`

  ctx.fillText(
    text,
    x,
    y
  )
}

async function encodePNG(image) {
  const stream = new PassThrough()
  const chunks = []

  stream.on('data', chunk => {
    chunks.push(chunk)
  })

  const finished = new Promise(
    (resolve, reject) => {
      stream.on('finish', resolve)
      stream.on('error', reject)
    }
  )

  await PImage.encodePNGToStream(
    image,
    stream
  )

  await finished

  return Buffer.concat(chunks)
}

export async function makeCard(track, username) {
  try {
    loadFonts()

    const albumUrl =
      getAlbumArt(track)

    let imageBuffer =
      await downloadImage(albumUrl)

    if (!imageBuffer) {
      imageBuffer =
        await downloadImage(FALLBACK_ART)
    }

    if (!imageBuffer) {
      throw new Error(
        'Impossibile scaricare la copertina'
      )
    }

    let albumImage

    try {
      albumImage =
        await decodeImage(imageBuffer)
    } catch (e) {
      console.error(
        '[lastfm-card] Errore decodifica album:',
        e.message
      )

      const fallback =
        await downloadImage(FALLBACK_ART)

      if (!fallback) {
        throw e
      }

      albumImage =
        await decodeImage(fallback)
    }

    if (!albumImage) {
      throw new Error(
        'Impossibile decodificare la copertina'
      )
    }

    const width = 800
    const height = 400

    const image =
      PImage.make(width, height)

    const ctx =
      image.getContext('2d')

    /*
     * BACKGROUND
     */

    ctx.fillStyle = '#090909'

    ctx.fillRect(
      0,
      0,
      width,
      height
    )

    /*
     * Pannello laterale
     */

    ctx.fillStyle = '#121212'

    ctx.fillRect(
      385,
      0,
      415,
      400
    )

    /*
     * Album
     */

    drawCover(
      ctx,
      albumImage,
      30,
      30,
      340
    )

    /*
     * Bordo album
     */

    ctx.strokeStyle =
      'rgba(255,255,255,0.10)'

    ctx.lineWidth = 2

    roundedRect(
      ctx,
      30,
      30,
      340,
      340,
      16
    )

    ctx.stroke()

    /*
     * DATI TRACK
     */

    const song =
      track?.name ||
      'Sconosciuto'

    const artist =
      track?.artist?.['#text'] ||
      'Sconosciuto'

    const album =
      track?.album?.['#text'] ||
      'Album sconosciuto'

    const isPlaying =
      track?.['@attr']?.nowplaying === 'true'

    /*
     * Status
     */

    ctx.fillStyle =
      isPlaying
        ? '#1DB954'
        : '#888888'

    ctx.beginPath()

    ctx.arc(
      410,
      60,
      5,
      0,
      Math.PI * 2
    )

    ctx.fill()

    drawText(
      ctx,
      isPlaying
        ? 'IN RIPRODUZIONE'
        : 'ULTIMO BRANO',
      425,
      65,
      12,
      isPlaying
        ? '#1DB954'
        : '#888888',
      true
    )

    /*
     * Titolo
     */

    drawText(
      ctx,
      truncate(song, 32),
      400,
      125,
      song.length > 27 ? 27 : 32,
      '#FFFFFF',
      true
    )

    /*
     * Artista
     */

    drawText(
      ctx,
      truncate(artist, 34),
      400,
      165,
      19,
      '#CCCCCC',
      true
    )

    /*
     * Album
     */

    drawText(
      ctx,
      truncate(album, 36),
      400,
      195,
      14,
      '#777777'
    )

    /*
     * Linea decorativa
     */

    ctx.fillStyle =
      isPlaying
        ? '#1DB954'
        : '#777777'

    ctx.fillRect(
      400,
      220,
      45,
      3
    )

    /*
     * Username
     */

    drawText(
      ctx,
      `🎧 ${truncate(username, 25)}`,
      400,
      350,
      14,
      '#777777'
    )

    /*
     * Last.fm
     */

    drawText(
      ctx,
      'LAST.FM',
      700,
      375,
      11,
      '#E00000',
      true
    )

    return await encodePNG(image)

  } catch (e) {

    console.error(
      '[lastfm-card] makeCard:',
      e
    )

    throw new Error(
      `Errore generazione card: ${e.message}`
    )
  }
}

export async function sendImage(conn, m, buffer, caption = '', buttons = []) {
  const path = await import('path');
  const fs = await import('fs');

  const tmpDir = path.resolve('./tmp');

  if (!fs.existsSync(tmpDir)) {
    fs.mkdirSync(tmpDir, { recursive: true });
  }

  const tmp = path.join(tmpDir, `lastfm_${Date.now()}.png`);

  fs.writeFileSync(tmp, buffer);

  try {
    const base = {
      caption,
      footer: 'Last.fm',
      contextInfo: {
        forwardingScore: 999,
        isForwarded: true
      }
    };

    if (buttons?.length) {
      base.buttons = buttons;
      base.headerType = 4;
    }

    await conn.sendMessage(
      m.chat,
      {
        image: { url: tmp },
        ...base
      },
      { quoted: m }
    );
  } finally {
    try {
      if (fs.existsSync(tmp)) {
        fs.unlinkSync(tmp);
      }
    } catch {}
  }
}
