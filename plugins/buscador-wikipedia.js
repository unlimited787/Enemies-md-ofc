import axios from 'axios'

async function wikipedia(query) {
    try {
        const title = encodeURIComponent(query.trim())

        const { data } = await axios.get(
            `https://it.wikipedia.org/api/rest_v1/page/summary/${title}`,
            {
                headers: {
                    'User-Agent': 'EnemiesBot/1.0'
                },
                timeout: 10000
            }
        )

        if (!data || data.type === 'https://mediawiki.org/wiki/HyperSwitch/errors/bad_request') {
            throw new Error('Pagina Wikipedia non trovata')
        }

        return {
            status: 200,
            result: {
                judul: data.title || query,
                thumb:
                    data.thumbnail?.source ||
                    'https://i.ibb.co/nzqPBpC/http-error-404-not-found.png',
                isi:
                    data.extract ||
                    'Nessuna descrizione disponibile.'
            }
        }

    } catch (err) {
        throw new Error(
            err?.response?.data?.detail ||
            err?.message ||
            'Errore durante la ricerca su Wikipedia'
        )
    }
}

let handler = async (m, { conn, text }) => {
    if (!text) return

    try {
        const res = await wikipedia(text)

        await m.reply(
            `📚 *Wikipedia*\n\n` +
            `*${res.result.judul}*\n\n` +
            res.result.isi
        )

    } catch (e) {
        return
        )
    }
}

handler.help = [
    'wiki <ricerca>',
    'wikipedia <ricerca>'
]

handler.tags = ['internet']

handler.command = /^(wiki|wikipedia)$/i

export default handler
