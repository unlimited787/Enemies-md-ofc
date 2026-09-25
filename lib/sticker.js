import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import crypto from 'crypto'
import fetch from 'node-fetch'
import webp from 'node-webpmux'
import { fileTypeFromBuffer } from 'file-type'
import fluent_ffmpeg from 'fluent-ffmpeg'

const __dirname = dirname(fileURLToPath(import.meta.url))
const tempDir = join(__dirname, '..', 'temp')

async function fetchBuffer(url) {
    const res = await fetch(url)

    if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.status} ${res.statusText}`)
    }

    return Buffer.from(await res.arrayBuffer())
}

async function sticker6(img, url) {
    if (url) {
        img = await fetchBuffer(url)
    }

    if (!img) {
        throw new Error('Nessuna immagine fornita')
    }

    if (!Buffer.isBuffer(img)) {
        img = Buffer.from(img)
    }

    const type = await fileTypeFromBuffer(img) || {
        mime: 'image/jpeg',
        ext: 'jpg'
    }

    const uid = crypto.randomBytes(8).toString('hex')

    const inp = join(tempDir, `in_${uid}.${type.ext}`)
    const out = join(tempDir, `out_${uid}.webp`)

    await fs.mkdir(tempDir, { recursive: true })
    await fs.writeFile(inp, img)

    return new Promise((resolve, reject) => {
        const isVideo = /^video\//i.test(type.mime)

        const ff = fluent_ffmpeg(inp)

        if (isVideo && type.ext) {
            ff.inputFormat(type.ext)
        }

        ff
            .on('error', async (err) => {
                await fs.unlink(inp).catch(() => {})
                await fs.unlink(out).catch(() => {})

                reject(
                    new Error(
                        `FFmpeg sticker error: ${err?.message || err}`
                    )
                )
            })

            .on('end', async () => {
                try {
                    const buffer = await fs.readFile(out)

                    await fs.unlink(inp).catch(() => {})
                    await fs.unlink(out).catch(() => {})

                    resolve(buffer)
                } catch (err) {
                    await fs.unlink(inp).catch(() => {})
                    await fs.unlink(out).catch(() => {})

                    reject(err)
                }
            })

            .addOutputOptions([
                '-vcodec',
                'libwebp',

                '-vf',
                "scale='min(512,iw)':'min(512,ih)':force_original_aspect_ratio=decrease,fps=60,pad=512:512:(ow-iw)/2:(oh-ih)/2:color=white@0.0,split[a][b];[a]palettegen=reserve_transparent=on:transparency_color=ffffff[p];[b][p]paletteuse",

                '-lossless',
                '1',

                '-loop',
                '0',

                '-preset',
                'default',

                '-an',

                '-vsync',
                '0'
            ])

            .toFormat('webp')

            .save(out)
    })
}

async function addExif(
    webpSticker,
    packname,
    author,
    categories = [''],
    extra = {}
) {
    if (!webpSticker) {
        throw new Error('Sticker WebP vuoto')
    }

    if (!Buffer.isBuffer(webpSticker)) {
        webpSticker = Buffer.from(webpSticker)
    }

    const img = new webp.Image()

    const json = {
        'sticker-pack-id': crypto.randomBytes(32).toString('hex'),
        'sticker-pack-name': packname || '',
        'sticker-pack-publisher': author || '',
        'emojis': categories,
        ...extra
    }

    const exifAttr = Buffer.from([
        0x49, 0x49,
        0x2A, 0x00,
        0x08, 0x00,
        0x00, 0x00,
        0x01, 0x00,
        0x41, 0x57,
        0x07, 0x00,
        0x00, 0x00,
        0x00, 0x00,
        0x16, 0x00,
        0x00, 0x00
    ])

    const jsonBuffer = Buffer.from(
        JSON.stringify(json),
        'utf8'
    )

    const exif = Buffer.concat([
        exifAttr,
        jsonBuffer
    ])

    exif.writeUIntLE(
        jsonBuffer.length,
        14,
        4
    )

    await img.load(webpSticker)

    img.exif = exif

    return await img.save(null)
}

async function sticker(
    img,
    url,
    packname,
    author,
    ...args
) {
    const errors = []

    /*
     * METODO 1
     * wa-sticker-formatter
     */

    try {
        const { Sticker } = await import(
            'wa-sticker-formatter'
        )

        const input = img || url

        if (!input) {
            throw new Error(
                'Nessun input immagine/video'
            )
        }

        const s = new Sticker(input, {
            pack: packname || '',
            author: author || '',
            type: 'full'
        })

        const stiker = await s.toBuffer()

        if (!stiker || !stiker.length) {
            throw new Error(
                'wa-sticker-formatter ha restituito un buffer vuoto'
            )
        }

        return await addExif(
            stiker,
            packname,
            author,
            ...args
        )

    } catch (e) {
        errors.push(
            `wa-sticker-formatter:\n${e?.stack || e}`
        )
    }

    /*
     * METODO 2
     * FFmpeg
     */

    try {
        const stiker = await sticker6(
            img,
            url
        )

        if (!stiker || !stiker.length) {
            throw new Error(
                'sticker6 ha restituito un buffer vuoto'
            )
        }

        return await addExif(
            stiker,
            packname,
            author,
            ...args
        )

    } catch (e) {
        errors.push(
            `sticker6 / FFmpeg:\n${e?.stack || e}`
        )
    }

    /*
     * SE FALLISCONO ENTRAMBI
     */

    throw new Error(
        'Errore nella creazione dello sticker:\n\n' +
        errors.join('\n\n')
    )
}

export const support = {
    ffmpeg: true,
    ffprobe: true,
    ffmpegWebp: true,
    convert: true,
    magick: false,
    gm: false,
    find: false
}

export {
    sticker,
    sticker6,
    addExif
}
