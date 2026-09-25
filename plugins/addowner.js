import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let handler = async (m, { text, conn, isOwner, isROwner }) => {


    const senderNumber =
        m.sender
            ?.split('@')[0]
            ?.replace(/[^0-9]/g, '')

    const botNumber =
        conn.user?.id
            ?.split(':')[0]
            ?.replace(/[^0-9]/g, '')

    const isBot =
        !!senderNumber &&
        !!botNumber &&
        senderNumber === botNumber

    const isGlobalOwner =
        Array.isArray(global.owner) &&
        global.owner.some(([num]) =>
            String(num)
                .replace(/[^0-9]/g, '') === senderNumber
        )


    if (
        !isROwner &&
        !isOwner &&
        !isGlobalOwner &&
        !isBot
    ) {
        return
    }

  

    let number

    if (m.quoted) {

        number =
            m.quoted.sender
                ?.split('@')[0]
                ?.replace(/[^0-9]/g, '')

    } else if (text) {

        number =
            text
                .replace(/[^0-9]/g, '')

    } else {

        return m.reply(
            'Scrivi un numero o rispondi a un messaggio'
        )
    }

    if (!number) return

  

    const configPath =
        path.join(__dirname, '../config.js')

    let config

    try {

        config =
            fs.readFileSync(
                configPath,
                'utf8'
            )

    } catch (e) {

        console.error(
            'Errore lettura config.js:',
            e?.stack || e
        )

        return m.reply(
            'Errore nella lettura di config.js'
        )
    }

  

    const escapedNumber =
        number.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&'
        )

    const alreadyInConfig =
        new RegExp(
            `\\[['"]${escapedNumber}['"]\\s*,`
        ).test(config)

    const alreadyInGlobal =
        Array.isArray(global.owner) &&
        global.owner.some(([num]) =>
            String(num)
                .replace(/[^0-9]/g, '') === number
        )

    if (
        alreadyInConfig ||
        alreadyInGlobal
    ) {
        return m.reply(
            `${number} è già owner`
        )
    }



    const ownerBlockRegex =
        /global\.owner\s*=\s*\[\s*([\s\S]*?)\s*\]/

    const match =
        config.match(ownerBlockRegex)

    if (!match) {

        return m.reply(
            'Non riesco a trovare global.owner nel config.js'
        )
    }

    const oldBlock =
        match[0]


    const newEntry =
        `  ['${number}', 'Co-Owner', true],`

    const newBlock =
        oldBlock.replace(
            /\s*\]\s*$/,
            `\n${newEntry}\n]`
        )

 

    try {

        const newConfig =
            config.replace(
                oldBlock,
                newBlock
            )

        fs.writeFileSync(
            configPath,
            newConfig,
            'utf8'
        )

    } catch (e) {

        console.error(
            'Errore scrittura config.js:',
            e?.stack || e
        )

        return m.reply(
            'Errore durante il salvataggio di config.js'
        )
    }

  

    if (!Array.isArray(global.owner)) {
        global.owner = []
    }

    global.owner.push([
        number,
        'Co-Owner',
        true
    ])

    await m.reply(
        `${number} aggiunto come owner ✓`
    )
}

handler.help = [
    'setowner <numero>'
]

handler.tags = [
    'owner'
]

handler.command =
    /^setowner$/i

export default handler
