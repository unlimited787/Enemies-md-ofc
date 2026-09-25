import { sticker } from '../lib/sticker.js'
import uploadFile from '../lib/uploadFile.js'
import uploadImage from '../lib/uploadImage.js'
import { createCanvas } from '@napi-rs/canvas'

const isUrl = (text) => {
    return text.match(
        new RegExp(
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)(jpe?g|gif|png)/,
            'gi'
        )
    )
}

const createTextImage = async (text, packname, author) => {
    try {
        const canvas = createCanvas(500, 300)
        const ctx = canvas.getContext('2d')

        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, 500, 300)

        ctx.fillStyle = '#000000'
        ctx.font = 'bold 40px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'

        const maxWidth = 450
        const lineHeight = 50
        const lines = []
        let line = ''

        const words = text.split(' ')

        for (const word of words) {
            const testLine = line + (line ? ' ' : '') + word
            const metrics = ctx.measureText(testLine)

            if (metrics.width > maxWidth && line) {
                lines.push(line)
                line = word
            } else {
                line = testLine
            }
        }

        if (line) {
            lines.push(line)
        }

        const totalHeight = lines.length * lineHeight
        let startY = (300 - totalHeight) / 2

        for (const textLine of lines) {
            ctx.fillText(textLine, 250, startY)
            startY += lineHeight
        }

        ctx.font = 'bold 14px Arial'
        ctx.fillStyle = '#666666'
        ctx.textAlign = 'right'
        ctx.fillText(`By: ${author}`, 480, 285)

        return canvas.toBuffer('image/png')

    } catch (e) {
        console.error('Errore canvas:', e?.stack || e)
        return null
    }
}

let handler = async (m, { conn, args }) => {
    let stiker = null

    try {
        const q = m.quoted ? m.quoted : m

        const mime =
            (q.msg || q).mimetype ||
            q.mediaType ||
            ''

        const text =
            q.text ||
            q.body ||
            q.caption ||
            ''

        const senderName =
            m.pushName ||
            m.sender?.split('@')[0] ||
            'Utente'

        const packname = senderName
        const author = '𝐄ИΞM𝕀Ξ𝐒 𝐁Ꮻ𝐓'

     

        if (
            args[0] &&
            global.screenStickerMap &&
            global.screenStickerMap[args[0]]
        ) {
           

            const img =
                global.screenStickerMap[args[0]]

            delete global.screenStickerMap[args[0]]

            stiker = await sticker(
                img,
                false,
                packname,
                author
            )
        }

        /*
         * IMMAGINE / VIDEO / WEBP
         */

        else if (/webp|image|video/i.test(mime)) {

            const msg = q.msg || q

            if (
                /video/i.test(mime) &&
                msg.seconds > 9
            ) {
                return
            }

           

            let type

            if (/image/i.test(mime)) {
                type = 'image'
            } else if (/video/i.test(mime)) {
                type = 'video'
            } else if (/webp/i.test(mime)) {
                type = 'sticker'
            }

            console.log(
                'STICKER DOWNLOAD:',
                {
                    mime,
                    type,
                    hasMsg: !!msg,
                    hasUrl: !!msg?.url,
                    hasDirectPath: !!msg?.directPath
                }
            )

            /*
             * DOWNLOAD CON IL SISTEMA DEL TUO BOT
             */

            let img

            try {
                img = await conn.downloadM(
                    msg,
                    type,
                    false
                )
            } catch (e) {
                console.error(
                    'conn.downloadM ERROR:',
                    e?.stack || e
                )
            }

            if (
                !img ||
                !Buffer.isBuffer(img) ||
                !img.length
            ) {
                throw new Error(
                    'Impossibile scaricare il media con conn.downloadM'
                )
            }

            console.log(
                'STICKER MEDIA SCARICATO:',
                img.length,
                'bytes'
            )

        
            try {
                stiker = await sticker(
                    img,
                    false,
                    packname,
                    author
                )

            } catch (directError) {

                console.error(
                    'Sticker diretto fallito:',
                    directError?.stack ||
                    directError
                )

         

                let out = null

                try {
                    if (/image|webp/i.test(mime)) {
                        out = await uploadImage(img)
                    } else if (/video/i.test(mime)) {
                        out = await uploadFile(img)
                    }
                } catch (uploadError) {
                    console.error(
                        'Upload fallito:',
                        uploadError?.stack ||
                        uploadError
                    )
                }

                if (
                    typeof out !== 'string' ||
                    !out
                ) {
                    try {
                        out = await uploadImage(img)
                    } catch (uploadError) {
                        console.error(
                            'UploadImage fallback fallito:',
                            uploadError?.stack ||
                            uploadError
                        )
                    }
                }

                if (!out) {
                    throw new Error(
                        'Upload del media fallito'
                    )
                }

                stiker = await sticker(
                    false,
                    out,
                    packname,
                    author
                )
            }
        }

        /*
         * TESTO
         */

        else if (text && !mime) {

          
            const textImage =
                await createTextImage(
                    text,
                    packname,
                    author
                )

            if (!textImage) {
                throw new Error(
                    'Creazione immagine testo fallita'
                )
            }

            stiker = await sticker(
                textImage,
                false,
                packname,
                author
            )
        }

        /*
         * URL
         */

        else if (args[0]) {

            if (isUrl(args[0])) {

                stiker = await sticker(
                    false,
                    args[0],
                    packname,
                    author
                )

            } else {
                return
            }
        }

    } catch (e) {

        console.error(
            'ERRORE STICKER:',
            e?.stack || e
        )
    }

    /*
     * INVIO STICKER
     */

    if (!stiker) {
        console.error(
            'Sticker non generato'
        )
        return
    }

    try {

        await conn.sendFile(
            m.chat,
            stiker,
            'sticker.webp',
            '',
            m
        )

    } catch (e) {

        console.error(
            'ERRORE INVIO STICKER:',
            e?.stack || e
        )
    }
}

handler.help = [
    'stiker (caption|reply media)',
    'stiker <url>',
    'stikergif (caption|reply media)',
    'stikergif <url>'
]

handler.tags = ['sticker']

handler.command =
    /^s(tic?ker)?(gif)?(wm)?$/i

export default handler
