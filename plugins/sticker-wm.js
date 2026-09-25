import { addExif } from '../lib/sticker.js'

let handler = async (m, { conn, text }) => {
    if (!m.quoted) return

    let stiker = false

    try {
        let [packname, ...author] = (text || '').split('|')

        author = author.join('|')

        const mime =
            m.quoted.mimetype ||
            m.quoted.msg?.mimetype ||
            ''

        if (!/webp/i.test(mime)) return

 

        const msg =
            m.quoted.msg ||
            m.quoted

        let img

        try {
            img = await conn.downloadM(
                msg,
                'sticker',
                false
            )
        } catch (e) {
            console.error(
                'WM downloadM ERROR:',
                e?.stack || e
            )
        }

        if (
            !img ||
            !Buffer.isBuffer(img) ||
            !img.length
        ) {
            throw new Error(
                'Impossibile scaricare lo sticker WebP'
            )
        }

        console.log(
            'WM: WebP scaricato:',
            img.length,
            'bytes'
        )

        /*
         * AGGIUNTA EXIF
         */

        stiker = await addExif(
            img,
            packname || '',
            author || ''
        )

    } catch (e) {

        console.error(
            'WM ERROR:',
            e?.stack || e
        )
    }


    if (stiker) {

        try {

            await conn.sendFile(
                m.chat,
                stiker,
                'wm.webp',
                '',
                m,
                false,
                {
                    asSticker: true
                }
            )

        } catch (e) {

            console.error(
                'WM SEND ERROR:',
                e?.stack || e
            )
        }

    } else {

        throw '𝐞𝐫𝐫𝐨𝐫𝐞 ✗'
    }
}

handler.help = [
    'wm <packname>|<author>'
]

handler.tags = [
    'sticker'
]

handler.command =
    /^robar|wm$/i

export default handler
