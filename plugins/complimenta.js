// Plugin by Gab, Lucifero & 333 staff

let handler = async (m, {
  conn, text
}) => {
  if (!m.isGroup)
    throw ''

  let gruppi = global.db.data.chats[m.chat]

  if (gruppi.spacobot === false)
    throw ''

  let menzione = m.mentionedJid[0]
    ? m.mentionedJid[0]
    : m.quoted
      ? m.quoted.sender
      : text

  if (!menzione)
    throw 'Chi vuoi complimentare?'

  conn.reply(
    m.chat,
    `@${menzione.split`@`[0]} ${pickRandom([
      'Hai un talento raro: riesci a rendere interessante anche una conversazione sul nulla.',
      'Sei una di quelle persone che migliorano una stanza semplicemente entrando.',
      'Hai una sicurezza che non ha bisogno di fare rumore.',
      'Il tuo cervello sembra avere sempre qualche idea interessante parcheggiata da qualche parte.',
      'Hai il raro talento di sembrare competente anche quando stai improvvisando.',
      'Sei sorprendentemente bravo a far sembrare normali le cose completamente assurde.',
      'Hai una presenza che si nota senza bisogno di fare casino.',
      'Sei il tipo di persona che potrebbe riuscire simpatico anche a un lunedì mattina.',
      'Hai un modo di ragionare stranamente efficace.',
      'Sei più utile di quanto faccia comodo ammettere.',
      'Hai una capacità notevole di cavartela anche quando il piano originale è morto da tempo.',
      'Sei una persona con un ottimo rapporto qualità/prezzo.',
      'Hai più risorse di un computer con troppe schede aperte.',
      'Sei praticamente la versione umana del “tranquillo, ci penso io”.',
      'Hai una certa eleganza nel riuscire nelle cose senza sembrare disperatamente impegnato.',
      'Sei una delle poche persone capaci di rendere piacevole anche una situazione mediocre.',
      'Hai un’intelligenza che ogni tanto arriva prima della situazione.',
      'Sei talmente affidabile che quasi viene voglia di controllare se è legale.',
      'Hai un ottimo istinto per capire quando parlare e, soprattutto, quando non serve.',
      'Sei il genere di persona che riesce a trovare una soluzione mentre gli altri stanno ancora cercando il problema.',
      'Hai una calma sospettosamente efficace.',
      'Sei più sveglio di quanto lasci intendere, e già questo è un ottimo trucco.',
      'Hai il dono di rendere semplici le cose che sembravano complicate.',
      'Sei una prova vivente che non serve essere rumorosi per essere interessanti.',
      'Hai una creatività che ogni tanto prende strade che nessun navigatore oserebbe suggerire.',
      'Sei riuscito nell’impresa di avere personalità senza trasformarla in un problema pubblico.',
      'Hai un senso dell’umorismo che meriterebbe almeno una connessione Wi-Fi dedicata.',
      'Sei una persona stranamente difficile da sostituire.',
      'Hai quel raro equilibrio tra “so cosa sto facendo” e “vediamo cosa succede”.',
      'Sei il tipo di persona che potrebbe convincere un tostapane ad avere ambizioni.',
      'Hai una capacità quasi inquietante di tirare fuori qualcosa di buono dalle situazioni peggiori.',
      'Sei più brillante di una lampadina nuova, ma almeno non consumi 60 watt.',
      'Hai una presenza che rende le conversazioni meno pesanti.',
      'Sei una delle poche persone che potrebbero ricevere un complimento e trasformarlo in una battuta.',
      'Hai un talento naturale per essere interessante senza provarci troppo.',
      'Sei praticamente una buona idea che ha deciso di diventare una persona.',
      'Hai più potenziale di quanto sarebbe prudente lasciarti avere.',
      'Sei il tipo di persona che anche Google probabilmente ascolterebbe prima di suggerire qualcosa.',
      'Hai un’energia che sembra dire “qualcosa andrà storto, ma ci divertiremo”.',
      'Sei sorprendentemente bravo a non prenderti troppo sul serio senza diventare inconcludente.',
      'Hai una mente abbastanza elastica da sopravvivere alle idee peggiori.',
      'Sei una presenza piacevole, che è un complimento molto più raro di quanto sembri.',
      'Hai una logica tutta tua, ma stranamente funziona.',
      'Sei il genere di persona che può trasformare una figuraccia in un aneddoto decente.',
      'Hai un carisma talmente naturale che sembra quasi non autorizzato.',
      'Sei più interessante di almeno il 73% delle persone incontrate oggi.',
      'Hai una capacità notevole di rendere memorabili anche le cose più banali.',
      'Sei una persona che dà l’impressione di sapere sempre un piccolo dettaglio in più.',
      'Hai un cervello che evidentemente non ama stare senza fare niente.',
      'Sei il tipo di persona che potrebbe trovare parcheggio al primo tentativo.',
      'Hai una fortuna sospetta nel riuscire a uscire bene dalle situazioni.',
      'Sei talmente bravo che quasi sembra preparazione.',
      'Hai una capacità naturale di far sentire gli altri a proprio agio.',
      'Sei una combinazione abbastanza rara di buon senso e follia controllata.',
      'Hai più stile mentale di quanto sia strettamente necessario.',
      'Sei il genere di persona che migliora con l’uso.',
      'Hai un talento per trovare la parte interessante anche nelle cose noiose.',
      'Sei praticamente il DLC che mancava alla conversazione.',
      'Hai una personalità che non avrebbe bisogno di aggiornamenti software.',
      'Sei una delle poche persone per cui “strano” può tranquillamente essere un complimento.',
      'Hai un modo di parlare che fa sembrare le idee più interessanti.',
      'Sei il tipo di persona che potrei affidare a una situazione complicata senza prima chiamare i soccorsi.',
      'Hai un talento raro nel non essere completamente prevedibile.',
      'Sei più prezioso di quanto il tuo livello di caos faccia pensare.',
      'Hai una resilienza degna di un vecchio Nokia.',
      'Sei praticamente indistruttibile, ma con una buona dose di personalità.',
      'Hai il raro pregio di riuscire a essere simpatico senza elemosinare attenzione.',
      'Sei una persona con cui anche il silenzio non sembra imbarazzante.',
      'Hai una certa classe nel fare cose completamente fuori programma.',
      'Sei il genere di persona che potrebbe convincermi che una pessima idea è almeno divertente.',
      'Hai un cervello che sembra lavorare in background anche quando fai finta di niente.',
      'Sei una piccola anomalia statistica, ma fortunatamente in senso positivo.',
      'Hai più carattere di una password con 32 caratteri.',
      'Sei una persona che lascia il segno senza necessariamente lasciare macerie.',
      'Hai una notevole capacità di adattarti senza perdere completamente la dignità.',
      'Sei il tipo di persona che rende un gruppo leggermente più interessante.',
      'Hai un talento naturale per sopravvivere alle conseguenze delle tue stesse idee.',
      'Sei sorprendentemente difficile da ignorare.',
      'Hai abbastanza cervello da capire una battuta e abbastanza follia da farla.',
      'Sei una persona che sembra avere sempre un piano B, anche quando il piano A era già discutibile.',
      'Hai una qualità rara: riesci a essere memorabile senza essere insopportabile.',
      'Sei praticamente una soluzione elegante a un problema che nessuno aveva ancora identificato.',
      'Hai un livello di adattabilità che farebbe invidia a un camaleonte.',
      'Sei una persona con cui probabilmente si può parlare di qualsiasi cosa e finire comunque a ridere.',
      'Hai una presenza che migliora statisticamente il gruppo.',
      'Sei talmente particolare che definirti normale sarebbe quasi offensivo.',
      'Hai un ottimo potenziale per diventare una leggenda locale.',
      'Sei il genere di persona che potrebbe accidentalmente diventare il protagonista della serata.',
      'Hai una capacità sospetta di essere nel posto giusto al momento giusto.',
      'Sei più affidabile di quanto il tuo aspetto da possibile disastro faccia pensare.',
      'Hai un senso dell’umorismo che dovrebbe essere considerato una risorsa naturale.',
      'Sei una persona sorprendentemente ben riuscita.',
      'Hai una certa genialità nascosta. A volte molto nascosta, ma c’è.',
      'Sei il tipo di persona che rende persino una pessima giornata leggermente più sopportabile.',
      'Hai una combinazione di caratteristiche che probabilmente non sarebbe uscita bene da un generatore casuale.',
      'Sei una delle poche persone che riescono a essere contemporaneamente normali e completamente fuori di testa.',
      'Hai più personalità di un gruppo WhatsApp alle tre di notte.',
      'Sei praticamente il motivo per cui qualcuno, prima o poi, racconterà questa storia.',
      'Hai un talento naturale per essere apprezzato senza fare campagna elettorale.',
      'Sei una persona che merita decisamente più credito di quello che riceve.',
      'Hai una qualità molto rara: sembri una buona idea anche dopo averti conosciuto.',
      'Sei ufficialmente troppo interessante per essere considerato arredamento.',
      'Hai una presenza che persino il Wi-Fi sembra voler mantenere connessa.',
      'Sei il genere di persona che potrei incontrare per caso e ricordare per anni.',
      'Hai una certa brillantezza che non si può semplicemente mettere in modalità risparmio energetico.',
      'Sei una persona che, contro ogni previsione, è venuta fuori davvero bene.',
      'Complimenti: statisticamente parlando, sei una scelta eccellente.',
      'Sei talmente particolare che persino un algoritmo avrebbe difficoltà a classificarti.',
      'Hai qualcosa che non si insegna: presenza.',
      'Sei una combinazione di caos e talento sorprendentemente ben calibrata.',
      'Hai un’energia da protagonista, anche quando stai semplicemente aspettando il tuo turno.',
      'Sei il tipo di persona che riesce a rendere interessante persino una notifica.',
      'Non so quale sia il tuo superpotere, ma sospetto che sia cavartela.',
      'Sei una persona che ha decisamente più valore di quanto faccia credere il tuo livello di cazzeggio.',
      'Hai una qualità rarissima: riesci a essere tu senza sembrare una copia di qualcun altro.',
      'Sei praticamente una versione aggiornata di una buona idea.',
      'La tua presenza migliora la conversazione. E non è poco.',
      'Sei una persona talmente particolare che un semplice “bravo” sarebbe quasi riduttivo.',
      'Hai un futuro promettente, soprattutto se continui a non ascoltare i consigli sbagliati.',
      'Sei ufficialmente una delle poche persone che meritano un complimento senza parentesi.'
    ])}`,
    null,
    {
      mentions: [menzione]
    }
  )
}

handler.command = ['complimenta']
handler.help = [' @']
handler.tags = ['fun']

export default handler

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)]
}