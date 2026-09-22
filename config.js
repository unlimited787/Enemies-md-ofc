import { watchFile, unwatchFile } from 'fs'
import { fileURLToPath, pathToFileURL } from 'url'
import chalk from 'chalk'
import fs from 'fs'
import * as cheerio from 'cheerio'
import fetch from 'node-fetch'
import axios from 'axios'
import moment from 'moment-timezone'
import NodeCache from 'node-cache'

const pkg = JSON.parse(await fs.promises.readFile(new URL('./package.json', import.meta.url), 'utf-8'))
const moduleCache = new NodeCache({ stdTTL: 300 });

	
global.owner = [
  ['393312171655', 'unly', true],
  ['436703015930', 'unli', true],
  ['393242512165', 'unl', true],
  ['4367858216347', 'unlg', true],
]


global.nomepack = 'Enemies'
global.nomebot = 'Enemies 3.0'
global.wm = 'Enemies'
global.autore = 'Unlimited'
global.dev = 'Unlimited'
global.testobot = `Enemies`
global.versione = pkg.version
global.errore = 'err'


global.repobot = 'https://github.com/unlimited787/Enemies-md-ofc'
global.canale = 'https://whatsapp.com/channel/'
global.gruppo = 'https://chat.whatsapp.com' 


global.cheerio = cheerio
global.fs = fs
global.fetch = fetch
global.axios = axios
global.moment = moment


global.APIKeys = { 
    spotifyclientid: 'Enemies',
    spotifysecret: 'Enemies',
    browserless: 'Enemies',
    screenshotone: 'Enemies',
    screenshotone_default: 'Enemies',
    tmdb: 'Enemies',
    gemini:'Enemies',
    ocrspace: 'Enemies',
    assemblyai: 'Enemies',
    google: 'Enemies',
    googlex: 'Enemies',
    googleCX: 'Enemies',
    genius: 'Enemies',
    unsplash: 'Enemies',
    removebg: 'FEx4CYmYN1QRQWD1mbZp87jV',
    openrouter: 'Enemies',
    lastfm: '36f859a1fc4121e7f0e931806507d5f9',
}


let filePath = fileURLToPath(import.meta.url)
let fileUrl = pathToFileURL(filePath).href
const reloadConfig = async () => {
  const cached = moduleCache.get(fileUrl);
  if (cached) return cached;
  unwatchFile(filePath)
  console.log(chalk.bgHex('#ff0000')(chalk.white.bold("File: 'config.js' Aggiornato")))
  const module = await import(`${fileUrl}?update=${Date.now()}`)
  moduleCache.set(fileUrl, module, { ttl: 300 });
  return module;
}
watchFile(filePath, reloadConfig)
