import path from 'path';
import { toAudio } from './converter.js';
import chalk from 'chalk';
import fetch from 'node-fetch';
import PhoneNumber from 'awesome-phonenumber';
import fs from 'fs';
import crypto from 'crypto';
import util from 'util';
import { fileTypeFromBuffer } from 'file-type';
import { format } from 'util';
import { fileURLToPath } from 'url';
import { EventEmitter } from 'events';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const S_WHATSAPP_NET = 's.whatsapp.net';

const PROTECTED_PLUGIN_KEY = 'crediti.js';
const PROTECTED_PLUGIN_HASH = '50c20ba36331429abffe758db08d5326d9a397862fcde4494046c0fcffbdb9fb';
const PROTECTED_FOLDER_PATH = path.join(__dirname, '..', '.protected_plugins');
const PROTECTED_PLUGIN_PATH = path.join(__dirname, '..', 'plugins', PROTECTED_PLUGIN_KEY);
const PROTECTED_PLUGIN_HIDDEN_PATH = path.join(PROTECTED_FOLDER_PATH, PROTECTED_PLUGIN_KEY);

function normalizeSource(source) {
  return source
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map(line => line.replace(/[ \t]+$/u, ''))
    .join('\n')
    .replace(/\n+$/u, '');
}

function computeNormalizedHash(buffer) {
  return crypto.createHash('sha256').update(normalizeSource(buffer.toString('utf8')), 'utf8').digest('hex');
}

function verifyProtectedPluginIntegrity() {
  
  return true;
}



const {
  makeWASocket: _makeWASocket,
  makeWALegacySocket,
  proto,
  WAProto,
  downloadContentFromMessage,
  jidDecode,
  areJidsSameUser,
  generateWAMessage,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  WAMessageStubType,
  extractMessageContent,
  WA_DEFAULT_EPHEMERAL,
  prepareWAMessageMedia,
  jidNormalizedUser,
  isLidUser,
  isPnUser
} = await import('@whiskeysockets/baileys');
const WebMessageInfo =
  proto?.WebMessageInfo ||
  WAProto?.WebMessageInfo ||
  WAProto?.proto?.WebMessageInfo;

if (!WebMessageInfo) {
  throw new Error(
    'Vkazee Baileys: WebMessageInfo non trovato in proto/WAProto'
  );
}






function cacheLidMappings(conn, metadata) {
  if (!conn.lidMap) conn.lidMap = new Map();
  if (!conn.pnMap) conn.pnMap = new Map();

  for (const participant of metadata?.participants || []) {
    try {
      const lid =
        typeof participant?.id === 'string' && participant.id.endsWith('@lid')
          ? participant.id
          : typeof participant?.lid === 'string' && participant.lid.endsWith('@lid')
            ? participant.lid
            : null;

      const pn =
        typeof participant?.jid === 'string' && participant.jid.endsWith('@s.whatsapp.net')
          ? participant.jid
          : typeof participant?.phoneNumber === 'string' && participant.phoneNumber.endsWith('@s.whatsapp.net')
            ? participant.phoneNumber
            : typeof participant?.id === 'string' && participant.id.endsWith('@s.whatsapp.net')
              ? participant.id
              : null;

      if (!lid || !pn) continue;

      const normalizedLid = jidNormalizedUser(lid);
      const normalizedPn = jidNormalizedUser(pn);

      conn.lidMap.set(normalizedLid, normalizedPn);
      conn.pnMap.set(normalizedPn, normalizedLid);
    } catch (e) {
      console.error('[LID CACHE ERROR]', e);
    }
  }
}

function normalizeJid(jid, conn) {
  if (typeof jid !== 'string' || !jid) return null;

  let decoded;

  try {
    decoded = conn.decodeJid(jid);
  } catch {
    decoded = jid;
  }

  if (typeof decoded !== 'string' || !decoded) {
    decoded = jid;
  }

  if (isLidUser(decoded)) {
    const mapped = conn.lidMap?.get(decoded);

    if (typeof mapped === 'string' && mapped) {
      return mapped;
    }

    return decoded;
  }

  try {
    const normalized = jidNormalizedUser(decoded);

    return typeof normalized === 'string' && normalized
      ? normalized
      : decoded;
  } catch {
    return decoded;
  }
}

function resolveMessageSender(message, conn) {
  if (!message?.key) return null;

  
  if (message.key.fromMe) {
    return normalizeJid(conn.user?.id || conn.user?.jid, conn);
  }

  
  
  
  
  const candidate =
    message.key.participantAlt ||
    message.key.participantPn ||
    message.key.participant ||
    message.participant ||
    message.key.remoteJid;

  return normalizeJid(candidate, conn);
}

function toPlainMessage(message) {
  if (!message || typeof message !== 'object') return message;

  try {
    if (typeof WebMessageInfo?.toObject === 'function') {
      return WebMessageInfo.toObject(message);
    }
  } catch {}

  try {
    if (typeof message.toJSON === 'function') {
      return message.toJSON();
    }
  } catch {}

  return {
    ...message,
    key: message.key ? { ...message.key } : message.key,
  };
}

function cloneMessage(message) {
  const plain = toPlainMessage(message);

  try {
    if (typeof structuredClone === 'function') {
      return structuredClone(plain);
    }
  } catch {}

  if (!plain || typeof plain !== 'object') return plain;

  return {
    ...plain,
    key: plain.key ? { ...plain.key } : plain.key,
    message: plain.message,
  };
}

function fromPlainMessage(message) {
  if (!message) return message;

  try {
    if (typeof WebMessageInfo?.fromObject === 'function') {
      return WebMessageInfo.fromObject(message);
    }
  } catch {}

  return message;
}

export function makeWASocket(connectionOptions, options = {}) {
  
  const conn = (global.opts['legacy'] ? makeWALegacySocket : _makeWASocket)(connectionOptions);

  if (!conn.ev) conn.ev = new EventEmitter();

    
conn.lidMap = new Map();

conn.ev.on('lid-mapping.update', (mapping) => {
  if (!mapping) return;

  const mappings = Array.isArray(mapping) ? mapping : [mapping];

  for (const item of mappings) {
    if (
      typeof item?.lid === 'string' &&
      typeof item?.pn === 'string'
    ) {
      conn.lidMap.set(
        item.lid,
        jidNormalizedUser(item.pn)
      );
    }
  }
});

  conn.ev.on('messages.upsert', ({ messages, type }) => {

    for (const m of messages) {
        console.dir({
            fromMe: m.key?.fromMe,
            remoteJid: m.key?.remoteJid,
            participant: m.key?.participant,
            id: m.key?.id,
            hasMessage: !!m.message
        }, { depth: null })
    }
})

  

  const sock = Object.defineProperties(conn, {
    
    chats: {
      value: { ...(options.chats || {}) },
      writable: true,
    },
    decodeJid: {
  value(jid) {
    if (typeof jid !== 'string' || !jid) return null;

    try {
      const decoded = jidDecode(jid);

      if (!decoded?.user || !decoded?.server) {
        return jid.trim();
      }

      return `${decoded.user}@${decoded.server}`;
    } catch {
      return jid.trim();
    }
  },
},
    logger: {
      get() {
        return {
          info(...args) {
            console.log(
                chalk.bold.bgRgb(51, 204, 51)('INFO '),
                `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                chalk.cyan(format(...args)),
            );
          },
          error(...args) {
            console.log(
                chalk.bold.bgRgb(247, 38, 33)('ERROR '),
                `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                chalk.rgb(255, 38, 0)(format(...args)),
            );
          },
          warn(...args) {
            console.log(
                chalk.bold.bgRgb(255, 153, 0)('WARNING '),
                `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                chalk.redBright(format(...args)),
            );
          },
          trace(...args) {
            console.log(
                chalk.grey('TRACE '),
                `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                chalk.white(format(...args)),
            );
          },
          debug(...args) {
            console.log(
                chalk.bold.bgRgb(66, 167, 245)('DEBUG '),
                `[${chalk.rgb(255, 255, 255)(new Date().toUTCString())}]:`,
                chalk.white(format(...args)),
            );
          },
        };
      },
      enumerable: true,
    },
    sendNyanCat: {
      async value(jid, text = '', buffer, title, body, url, quoted, options) {
        if (buffer) {
          try {
            (type = await conn.getFile(buffer), buffer = type.data);
          } catch {
            buffer = buffer;
          }
        }
         const prep = generateWAMessageFromContent(jid, {extendedTextMessage: {text: text, contextInfo: {externalAdReply: {title: title, body: body, thumbnail: buffer, sourceUrl: url}, mentionedJid: await conn.parseMention(text)}}}, {quoted: quoted});
        return conn.relayMessage(jid, prep.message, {messageId: prep.key.id});
      },
    },
    sendPayment: {
      async value(jid, amount, text, quoted, options) {
        conn.relayMessage(jid, {
          requestPaymentMessage: {
            currencyCodeIso4217: 'PEN',
            amount1000: amount,
            requestFrom: null,
            noteMessage: {
              extendedTextMessage: {
                text: text,
                contextInfo: {
                  externalAdReply: {
                    showAdAttribution: true,
                  }, mentionedJid: conn.parseMention(text)}}}}}, {});
      },
    },
    getFile: {
      




      async value(PATH, saveToFile = false) {
        let res; let filename;
        const data = Buffer.isBuffer(PATH) ? PATH : PATH instanceof ArrayBuffer ? PATH.toBuffer() : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? Buffer.from(await (res = await fetch(PATH)).arrayBuffer()) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0);
        if (!Buffer.isBuffer(data)) throw new TypeError('Result is not a buffer');
        const type = await fileTypeFromBuffer(data) || {
          mime: 'application/octet-stream',
          ext: '.bin',
        };
        if (data && saveToFile && !filename) (filename = path.join(__dirname, '../temp/' + new Date * 1 + '.' + type.ext), await fs.promises.writeFile(filename, data));
        return {
          res,
          filename,
          ...type,
          data,
          deleteFile() {
            return filename && fs.promises.unlink(filename);
          },
        };
      },
      enumerable: true,
    },
    waitEvent: {
      





      value(eventName, is = () => true, maxTries = 25) { 
        return new Promise((resolve, reject) => {
          let tries = 0;
          const on = (...args) => {
            if (++tries > maxTries) reject('Max tries reached');
            else if (is()) {
              conn.ev.off(eventName, on);
              resolve(...args);
            }
          };
          conn.ev.on(eventName, on);
        });
      },
    },
    relayWAMessage: {
      async value(pesanfull) {
        if (pesanfull.message.audioMessage) {
          await conn.sendPresenceUpdate('recording', pesanfull.key.remoteJid);
        } else {
          await conn.sendPresenceUpdate('composing', pesanfull.key.remoteJid);
        }
        const mekirim = await conn.relayMessage(pesanfull.key.remoteJid, pesanfull.message, {messageId: pesanfull.key.id});
        conn.ev.emit('messages.upsert', {messages: [pesanfull], type: 'append'});
        return mekirim;
      },
    },
    sendFile: {
      









      async value(jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) {
        const type = await conn.getFile(path, true);
        let {res, data: file, filename: pathFile} = type;
        if (res && res.status !== 200 || file.length <= 65536) {
          try {
            throw {json: JSON.parse(file.toString())};
          } catch (e) {
            if (e.json) throw e.json;
          }
        }
        const opt = {};
        if (quoted) opt.quoted = quoted;
        if (!type) options.asDocument = true;
        let mtype = ''; let mimetype = options.mimetype || type.mime; let convert;
        if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
        else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
        else if (/video/.test(type.mime)) mtype = 'video';
        else if (/audio/.test(type.mime)) {
          (
            convert = await toAudio(file, type.ext),
            file = convert.data,
            pathFile = convert.filename,
            mtype = 'audio',
            mimetype = options.mimetype || 'audio/mpeg; codecs=opus'
          );
        } else mtype = 'document';
        if (options.asDocument) mtype = 'document';
        delete options.asSticker;
        delete options.asLocation;
        delete options.asVideo;
        delete options.asDocument;
        delete options.asImage;

        const message = {
          ...options,
          caption,
          ptt,
          [mtype]: {url: pathFile},
          mimetype,
          fileName: filename || pathFile.split('/').pop(),
        };
        let m;
        try {
          m = await conn.sendMessage(jid, message, {...opt, ...options});
        } catch (e) {
          console.error(e);
          m = null;
        } finally {
          if (!m) m = await conn.sendMessage(jid, {...message, [mtype]: file}, {...opt, ...options});
          file = null; 
          return m;
        }
      },
      enumerable: true,
    },
    sendContact: {
      






      async value(jid, data, quoted, options) {
        if (!Array.isArray(data[0]) && typeof data[0] === 'string') data = [data];
        const contacts = [];
        for (let [number, name] of data) {
          number = number.replace(/[^0-9]/g, '');
          const njid = number + '@s.whatsapp.net';
          const biz = await conn.getBusinessProfile(njid).catch((_) => null) || {};
          const vcard = `
BEGIN:VCARD
VERSION:3.0
N:;${name.replace(/\n/g, '\\n')};;;
FN:${name.replace(/\n/g, '\\n')}
TEL;type=CELL;type=VOICE;waid=${number}:${PhoneNumber('+' + number).getNumber('international')}${biz.description ? `
X-WA-BIZ-NAME:${(conn.chats[njid]?.vname || conn.getName(njid) || name).replace(/\n/, '\\n')}
X-WA-BIZ-DESCRIPTION:${biz.description.replace(/\n/g, '\\n')}
`.trim() : ''}
END:VCARD
        `.trim();
          contacts.push({vcard, displayName: name});
        }
        return await conn.sendMessage(jid, {
          ...options,
          contacts: {
            ...options,
            displayName: (contacts.length >= 2 ? `${contacts.length} kontak` : contacts[0].displayName) || null,
            contacts,
          },
        }, {quoted, ...options});
      },
      enumerable: true,
    },
reply: {
            






            value(jid, text = '', quoted, options) {
             
                return Buffer.isBuffer(text) ? conn.sendFile(jid, text, 'file', '', quoted, false, options) : conn.sendMessage(jid, { ...options, text }, { quoted, ...options })
            }
        },
                 
            









 


































        
                
        
sendButton: {
    async value(jid, text = '', footer = '', buffer, buttons, copy, urls, list, quoted, options) {
        let img, video;

        if (/^https?:\/\//i.test(buffer)) {
            try {
                const response = await fetch(buffer);
                const contentType = response.headers.get('content-type');
                const data = await response.buffer();  
                if (/^image\//i.test(contentType)) {
                    img = await prepareWAMessageMedia({ image: data }, { upload: conn.waUploadToServer });
                } else if (/^video\//i.test(contentType)) {
                    video = await prepareWAMessageMedia({ video: data }, { upload: conn.waUploadToServer });
                } else {
                    console.error("Tipo MIME non compatibile:", contentType);
                }
            } catch (error) {
                console.error("Errore nell'ottenere il tipo MIME o il buffer:", error);
            }
        } else {
            try {
                const type = await conn.getFile(buffer);
                if (/^image\//i.test(type.mime)) {
                    img = await prepareWAMessageMedia({ image: type.data }, { upload: conn.waUploadToServer });
                } else if (/^video\//i.test(type.mime)) {
                    video = await prepareWAMessageMedia({ video: type.data }, { upload: conn.waUploadToServer });
                }
            } catch (error) {
                console.error("Errore nell'ottenere il tipo di file:", error);
            }
        }

        const dynamicButtons = [];

        
        if (buttons && Array.isArray(buttons)) {
            dynamicButtons.push(...buttons.map(btn => ({
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                    display_text: btn[0],
                    id: btn[1]
                })
            })));
        }

        
        if (copy && Array.isArray(copy)) {
            dynamicButtons.push(...copy.map(copyBtn => ({
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                    display_text: copyBtn[0] || 'Copy', 
                    copy_code: copyBtn[1] 
                })
            })));
        }

        
        if (urls && Array.isArray(urls)) {
            urls.forEach(url => {
                dynamicButtons.push({
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: url[0],
                        url: url[1],
                        merchant_url: url[1]
                    })
                });
            });
        }

        
        if (list && Array.isArray(list)) {
            list.forEach(lister => {
                dynamicButtons.push({
                    name: 'single_select',
                    buttonParamsJson: JSON.stringify({
                        title: lister[0], 
                        sections: lister[1]
                    })
                });
            });
        }

        const interactiveMessage = {
            body: { text: text },
            footer: { text: footer },
            header: {
                hasMediaAttachment: false,
                imageMessage: img ? img.imageMessage : null,
                videoMessage: video ? video.videoMessage : null
            },
            nativeFlowMessage: {
                buttons: dynamicButtons,
                messageParamsJson: ''
            }
        };

        let msgL = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    interactiveMessage
                }
            }
        }, { userJid: conn.user.jid, quoted });

        conn.relayMessage(jid, msgL.message, { messageId: msgL.key.id, ...options });
    }
},

sendAlbumMessage: {
    async value(jid, medias, caption = "", quoted = null) {
        let img, video;
        
        const album = generateWAMessageFromContent(jid, {
            albumMessage: {
                expectedImageCount: medias.filter(media => media.type === "image").length,
                expectedVideoCount: medias.filter(media => media.type === "video").length,
                ...(quoted ? {
                    contextInfo: {
                        remoteJid: quoted.key.remoteJid,
                        fromMe: quoted.key.fromMe,
                        stanzaId: quoted.key.id,
                        participant: quoted.key.participant || quoted.key.remoteJid,
                        quotedMessage: quoted.message
                    }
                } : {})
            }
        }, { quoted: quoted });
        
        await conn.relayMessage(album.key.remoteJid, album.message, {
            messageId: album.key.id
        });

        for (const media of medias) {
            const { type, data } = media;
            
            if (/^https?:\/\//i.test(data.url)) {
                try {
                    const response = await fetch(data.url);
                    const contentType = response.headers.get('content-type');
                    
                    if (/^image\//i.test(contentType)) {
                        img = await prepareWAMessageMedia({ image: { url: data.url } }, { upload: conn.waUploadToServer });
                    } else if (/^video\//i.test(contentType)) {
                        video = await prepareWAMessageMedia({ video: { url: data.url } }, { upload: conn.waUploadToServer });
                    }
                } catch (error) {
                    console.error("Errore nell'ottenere il tipo MIME:", error);
                }
            }
            
            const mediaMessage = await generateWAMessage(album.key.remoteJid, {
                [type]: data,
                ...(media === medias[0] ? { caption } : {})
            }, {
                upload: conn.waUploadToServer
            });

            mediaMessage.message.messageContextInfo = {
                messageAssociation: {
                    associationType: 1,
                    parentMessageKey: album.key
                }
            };

            await conn.relayMessage(mediaMessage.key.remoteJid, mediaMessage.message, {
                messageId: mediaMessage.key.id
            });
        }

        return album;
    }
},




    sendNCarousel: {
      async value(jid, text = '', footer = '', buffer, buttons, copy, urls, list, quoted, options) {
        let img, video;
        if (buffer) {
          if (/^https?:\/\//i.test(buffer)) {
            try {
              const response = await fetch(buffer);
              const contentType = response.headers.get('content-type');
              if (/^image\//i.test(contentType)) {
                img = await prepareWAMessageMedia({
                  image: {
                    url: buffer
                  }
                }, {
                  upload: conn.waUploadToServer,
                  ...options
                });
              } else if (/^video\//i.test(contentType)) {
                video = await prepareWAMessageMedia({
                  video: {
                    url: buffer
                  }
                }, {
                  upload: conn.waUploadToServer,
                  ...options
                });
              } else {
                console.error("Tipo MIME non compatibile:", contentType);
              }
            } catch (error) {
              console.error("Errore nell'ottenere il tipo MIME:", error);
            }
          } else {
            try {
              const type = await conn.getFile(buffer);
              if (/^image\//i.test(type.mime)) {
                img = await prepareWAMessageMedia({
                  image: (/^https?:\/\//i.test(buffer)) ? {
                    url: buffer
                  } : (type && type?.data)
                }, {
                  upload: conn.waUploadToServer,
                  ...options
                });
              } else if (/^video\//i.test(type.mime)) {
                video = await prepareWAMessageMedia({
                  video: (/^https?:\/\//i.test(buffer)) ? {
                    url: buffer
                  } : (type && type?.data)
                }, {
                  upload: conn.waUploadToServer,
                  ...options
                });
              }
            } catch (error) {
              console.error("Errore nell'ottenere il tipo di file:", error);
            }
          }
        }
        const dynamicButtons = (buttons || []).map(btn => ({
          name: 'quick_reply',
          buttonParamsJson: JSON.stringify({
            display_text: btn[0],
            id: btn[1]
          }),
        }));
        dynamicButtons.push(
          (copy && (typeof copy === 'string' || typeof copy === 'number')) ? {
            name: 'cta_copy',
            buttonParamsJson: JSON.stringify({
              display_text: 'Copy',
              copy_code: copy
            })
          } : null)
          
        urls?.forEach(url => {
          dynamicButtons.push({
            name: 'cta_url',
            buttonParamsJson: JSON.stringify({
              display_text: url[0],
              url: url[1],
              merchant_url: url[1]
            })
          });
        });
        list?.forEach(lister => {
          dynamicButtons.push({
            name: 'single_select',
            buttonParamsJson: JSON.stringify({
              title: lister[0],
              sections: lister[1]
            })
          });
        })
        const interactiveMessage = {
          body: {
            text: text || ''
          },
          footer: {
            text: footer || ''
          },
          header: {
            hasMediaAttachment: img?.imageMessage || video?.videoMessage ? true : false,
            imageMessage: img?.imageMessage || null,
            videoMessage: video?.videoMessage || null
          },
          nativeFlowMessage: {
            buttons: dynamicButtons.filter(Boolean),
            messageParamsJson: ''
          },
          ...Object.assign({
            mentions: typeof text === 'string' ? conn.parseMention(text || '@0') : [],
            contextInfo: {
              mentionedJid: typeof text === 'string' ? conn.parseMention(text || '@0') : [],
            }
          }, {
            ...(options || {}),
            ...(conn.temareply?.contextInfo && {
              contextInfo: {
                ...(options?.contextInfo || {}),
                ...conn.temareply?.contextInfo,
                externalAdReply: {
                  ...(options?.contextInfo?.externalAdReply || {}),
                  ...conn.temareply?.contextInfo?.externalAdReply,
                },
              },
            })
          })
        };
        const messageContent = proto.Message.fromObject({
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2
              },
              interactiveMessage
            }
          }
        });
        const msgs = await generateWAMessageFromContent(jid, messageContent, {
          userJid: conn.user.jid,
          quoted: quoted,
          upload: conn.waUploadToServer,
          ephemeralExpiration: WA_DEFAULT_EPHEMERAL
        });
        await conn.relayMessage(jid, msgs.message, {
          messageId: msgs.key.id
        });
      }
    }, 




    sendCarousel: {
  async value(jid, text = '', footer = '', messages, quoted, options = {}) {
    try {
      if (messages.length > 1) {
        const cards = await Promise.all(messages.map(async ([text = '', footer = '', buffer, buttons, copy, urls, list]) => {
          let img, video;

          if (/^https?:\/\//i.test(buffer)) {
            try {
              const response = await fetch(buffer);
              const contentType = response.headers.get('content-type');
              if (/^image\//i.test(contentType)) {
                img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: conn.waUploadToServer, ...options });
              } else if (/^video\//i.test(contentType)) {
                video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: conn.waUploadToServer, ...options });
              } else {
                console.error("Tipo MIME non compatibile:", contentType);
              }
            } catch (error) {
              console.error("Errore nell'ottenere il tipo MIME:", error);
            }
          } else {
            try {
              const type = await conn.getFile(buffer);
              if (/^image\//i.test(type.mime)) {
                img = await prepareWAMessageMedia({ image: type.data }, { upload: conn.waUploadToServer, ...options });
              } else if (/^video\//i.test(type.mime)) {
                video = await prepareWAMessageMedia({ video: type.data }, { upload: conn.waUploadToServer, ...options });
              }
            } catch (error) {
              console.error("Errore nell'ottenere il tipo di file:", error);
            }
          }

          const dynamicButtons = [];
          if (buttons && Array.isArray(buttons)) {
            buttons.forEach(btn => {
              dynamicButtons.push({
                name: 'quick_reply',
                buttonParamsJson: JSON.stringify({
                  display_text: btn[0],
                  id: btn[1]
                })
              });
            });
          }

          if (copy && Array.isArray(copy)) {
            copy.forEach(copyBtn => {
              dynamicButtons.push({
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                  display_text: copyBtn[0] || 'Copy',
                  copy_code: copyBtn[1]
                })
              });
            });
          }

          if (urls && Array.isArray(urls)) {
            urls.forEach(url => {
              dynamicButtons.push({
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                  display_text: url[0],
                  url: url[1],
                  merchant_url: url[1]
                })
              });
            });
          }

          if (list && Array.isArray(list)) {
            list.forEach(lister => {
              dynamicButtons.push({
                name: 'single_select',
                buttonParamsJson: JSON.stringify({
                  title: lister[0],
                  sections: lister[1]
                })
              });
            });
          }

          return {
            body: proto.Message.InteractiveMessage.Body.fromObject({
              text: footer || ''
            }),
            footer: proto.Message.InteractiveMessage.Footer.fromObject({
              text: ''
            }),
            header: proto.Message.InteractiveMessage.Header.fromObject({
              title: text || '',
              subtitle: '',
              hasMediaAttachment: !!(img?.imageMessage || video?.videoMessage),
              imageMessage: img?.imageMessage || null,
              videoMessage: video?.videoMessage || null
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.fromObject({
              buttons: dynamicButtons.filter(Boolean),
              messageParamsJson: ''
            })
          };
        }));

        const interactiveMessage =
          typeof proto?.Message?.InteractiveMessage?.fromObject === 'function'
            ? proto.Message.InteractiveMessage.fromObject({
          body: proto.Message.InteractiveMessage.Body.fromObject({
            text: text || ''
          }),
          footer: proto.Message.InteractiveMessage.Footer.fromObject({
            text: footer || ''
          }),
          header: proto.Message.InteractiveMessage.Header.fromObject({
            title: text || '',
            subtitle: text || '',
            hasMediaAttachment: false
          }),
          carouselMessage: proto.Message.InteractiveMessage.CarouselMessage.fromObject({
            cards: cards
          })
        })
            : {
                body: {
                  text: text || ''
                },
                footer: {
                  text: footer || ''
                },
                header: {
                  title: text || '',
                  subtitle: text || '',
                  hasMediaAttachment: false
                },
                carouselMessage: {
                  cards
                }
              };

        const messageContent = proto.Message.fromObject({
          viewOnceMessage: {
            message: {
              messageContextInfo: {
                deviceListMetadata: {},
                deviceListMetadataVersion: 2
              },
              interactiveMessage
            }
          }
        });

        const msgs = await generateWAMessageFromContent(jid, messageContent, {
          userJid: conn.user.jid,
          quoted: quoted,
          upload: conn.waUploadToServer,
          ephemeralExpiration: WA_DEFAULT_EPHEMERAL
        });

        await conn.relayMessage(jid, msgs.message, { messageId: msgs.key.id });
      } else {
        await conn.sendNCarousel(jid, ...messages[0], quoted, options);
      }
    } catch (error) {
      console.error("Errore in sendCarousel:", error);
      throw error;
    }
  }
},
        
sendButton2: {
    async value(jid, text = '', footer = '', buffer, buttons, copy, urls, quoted, options) {
        let img, video

    
        if (/^https?:\/\//i.test(buffer)) {
            try {
                
                const response = await fetch(buffer)
                const contentType = response.headers.get('content-type')
                if (/^image\//i.test(contentType)) {
                    img = await prepareWAMessageMedia({ image: { url: buffer } }, { upload: conn.waUploadToServer })
                } else if (/^video\//i.test(contentType)) {
                    video = await prepareWAMessageMedia({ video: { url: buffer } }, { upload: conn.waUploadToServer })
                } else {
                    console.error("Tipo MIME non compatibile:", contentType)
                }
            } catch (error) {
                console.error("Errore nell'ottenere il tipo MIME:", error)
            }
        } else {

            try {
                const type = await conn.getFile(buffer)
               if (/^image\//i.test(type.mime)) {
                    img = await prepareWAMessageMedia({ image: type.data }, { upload: conn.waUploadToServer })
                } else if (/^video\//i.test(type.mime)) {
                    video = await prepareWAMessageMedia({ video: type.data }, { upload: conn.waUploadToServer })
                }
            } catch (error) {
                console.error("Errore nell'ottenere il tipo di file:", error);
            }
        }

        const dynamicButtons = (buttons || []).map(btn => ({
            name: 'quick_reply',
            buttonParamsJson: JSON.stringify({
                display_text: btn[0],
                id: btn[1]
            }),
        }));

       
        if (copy && (typeof copy === 'string' || typeof copy === 'number')) {
            
            dynamicButtons.push({
                name: 'cta_copy',
                buttonParamsJson: JSON.stringify({
                    display_text: 'Copy',
                    copy_code: copy
                })
            });
        }

        
        if (urls && Array.isArray(urls)) {
            urls.forEach(url => {
                dynamicButtons.push({
                    name: 'cta_url',
                    buttonParamsJson: JSON.stringify({
                        display_text: url[0],
                        url: url[1],
                        merchant_url: url[1]
                    })
                })
            })
        }


        const interactiveMessage = {
            body: { text: text },
            footer: { text: footer },
            header: {
                hasMediaAttachment: false,
                imageMessage: img ? img.imageMessage : null,
                videoMessage: video ? video.videoMessage : null
            },
            nativeFlowMessage: {
                buttons: dynamicButtons,
                messageParamsJson: ''
            }
        }

              
        let msgL = generateWAMessageFromContent(jid, {
            viewOnceMessage: {
                message: {
                    interactiveMessage } } }, { userJid: conn.user.jid, quoted })
        
       conn.relayMessage(jid, msgL.message, { messageId: msgL.key.id, ...options })
            
    }
}, 

        
        
sendList: {
  async value(jid, placeholder, caption, title, imageUrl, sections, quoted, options = {}) {
    let imageMessage = null;
    if (imageUrl) {
      try {
        const response = await fetch(imageUrl);
        const buffer = await response.buffer();
        const type = await fileTypeFromBuffer(buffer) || { mime: 'image/jpeg' };
        if (type.mime.startsWith('image/')) {
          const prepared = await prepareWAMessageMedia({ image: buffer, jpegThumbnail: buffer }, { upload: conn.waUploadToServer });
          imageMessage = prepared.imageMessage;
        } else {
          console.error("Invalid image type:", type.mime);
        }
      } catch (error) {
        console.error("Error fetching or preparing image:", error);
      }
    }

    const listSections = sections.map(section => ({
      title: section.title || (section.highlight_label ? `${section.title} (${section.highlight_label})` : 'Section'),
      rows: section.rows.map(row => ({
        rowId: row.id || row.rowId,
        title: (row.header ? row.header + ' ' : '') + row.title,
        description: row.description
      }))
    }));

    const dynamicButtons = [{
      name: 'single_select',
      buttonParamsJson: JSON.stringify({
        title: title || 'Seleziona',
        sections: listSections
      })
    }];

    const interactiveMessage = {
      body: { text: caption },
      footer: { text: placeholder },
      header: {
        hasMediaAttachment: !!imageMessage,
        imageMessage: imageMessage || null
      },
      nativeFlowMessage: {
        buttons: dynamicButtons,
        messageParamsJson: ''
      }
    };

    const msg = generateWAMessageFromContent(jid, {
      viewOnceMessage: {
        message: {
          interactiveMessage
        }
      }
    }, { userJid: this.user.jid, quoted });

    return this.relayMessage(jid, msg.message, { messageId: msg.key.id, ...options });
  },
  enumerable: true
},

    sendPoll: {
      async value(jid, name = '', optiPoll, options) {
        if (!Array.isArray(optiPoll[0]) && typeof optiPoll[0] === 'string') optiPoll = [optiPoll];
        if (!options) options = {};
        const pollMessage = {
          name: name,
          options: optiPoll.map((btn) => ({
            optionName: !nullish(btn[0]) && btn[0] || '',
          })),
          selectableOptionsCount: 1,
        };
        return conn.relayMessage(jid, {pollCreationMessage: pollMessage}, {...options});
      },
    },
    sendHydrated: {
      













      async value(jid, text = '', footer = '', buffer, url, urlText, call, callText, buttons, quoted, options) {
        let type;
        if (buffer) {
          try {
            (type = await conn.getFile(buffer), buffer = type.data);
          } catch {
            buffer = buffer;
          }
        }
        if (buffer && !Buffer.isBuffer(buffer) && (typeof buffer === 'string' || Array.isArray(buffer))) (options = quoted, quoted = buttons, buttons = callText, callText = call, call = urlText, urlText = url, url = buffer, buffer = null);
        if (!options) options = {};
        const templateButtons = [];
        if (url || urlText) {
          if (!Array.isArray(url)) url = [url];
          if (!Array.isArray(urlText)) urlText = [urlText];
          templateButtons.push(...(
            url.map((v, i) => [v, urlText[i]])
                .map(([url, urlText], i) => ({
                  index: templateButtons.length + i + 1,
                  urlButton: {
                    displayText: !nullish(urlText) && urlText || !nullish(url) && url || '',
                    url: !nullish(url) && url || !nullish(urlText) && urlText || '',
                  },
                })) || []
          ));
        }
        if (call || callText) {
          if (!Array.isArray(call)) call = [call];
          if (!Array.isArray(callText)) callText = [callText];
          templateButtons.push(...(
            call.map((v, i) => [v, callText[i]])
                .map(([call, callText], i) => ({
                  index: templateButtons.length + i + 1,
                  callButton: {
                    displayText: !nullish(callText) && callText || !nullish(call) && call || '',
                    phoneNumber: !nullish(call) && call || !nullish(callText) && callText || '',
                  },
                })) || []
          ));
        }
        if (Array.isArray(buttons) && buttons.length) {
          if (!Array.isArray(buttons[0])) buttons = [buttons];
          templateButtons.push(...(
            buttons.map(([text, id], index) => ({
              index: templateButtons.length + index + 1,
              quickReplyButton: {
                displayText: !nullish(text) && text || !nullish(id) && id || '',
                id: !nullish(id) && id || !nullish(text) && text || '',
              },
            })) || []
          ));
        }
        const message = {
          ...options,
          [buffer ? 'caption' : 'text']: text || '',
          footer,
          templateButtons,
          ...(buffer ?
                        options.asLocation && /image/.test(type.mime) ? {
                          location: {
                            ...options,
                            jpegThumbnail: buffer,
                          },
                        } : {
                          [/video/.test(type.mime) ? 'video' : /image/.test(type.mime) ? 'image' : 'document']: buffer,
                        } : {}),
        };
        return await conn.sendMessage(jid, message, {
          quoted,
          upload: conn.waUploadToServer,
          ...options,
        });
      },
      enumerable: true,
    },
    sendHydrated2: {
      













      async value(jid, text = '', footer = '', buffer, url, urlText, url2, urlText2, buttons, quoted, options) {
        let type;
        if (buffer) {
          try {
            (type = await conn.getFile(buffer), buffer = type.data);
          } catch {
            buffer = buffer;
          }
        }
        if (buffer && !Buffer.isBuffer(buffer) && (typeof buffer === 'string' || Array.isArray(buffer))) (options = quoted, quoted = buttons, buttons = callText, callText = call, call = urlText, urlText = url, url = buffer, buffer = null);
        if (!options) options = {};
        const templateButtons = [];
        if (url || urlText) {
          if (!Array.isArray(url)) url = [url];
          if (!Array.isArray(urlText)) urlText = [urlText];
          templateButtons.push(...(
            url.map((v, i) => [v, urlText[i]])
                .map(([url, urlText], i) => ({
                  index: templateButtons.length + i + 1,
                  urlButton: {
                    displayText: !nullish(urlText) && urlText || !nullish(url) && url || '',
                    url: !nullish(url) && url || !nullish(urlText) && urlText || '',
                  },
                })) || []
          ));
        }
        if (url2 || urlText2) {
          if (!Array.isArray(url2)) url2 = [url2];
          if (!Array.isArray(urlText2)) urlText2 = [urlText2];
          templateButtons.push(...(
            url2.map((v, i) => [v, urlText2[i]])
                .map(([url2, urlText2], i) => ({
                  index: templateButtons.length + i + 1,
                  urlButton: {
                    displayText: !nullish(urlText2) && urlText2 || !nullish(url2) && url2 || '',
                    url: !nullish(url2) && url2 || !nullish(urlText2) && urlText2 || '',
                  },
                })) || []
          ));
        }
        if (Array.isArray(buttons) && buttons.length) {
          if (!Array.isArray(buttons[0])) buttons = [buttons];
          templateButtons.push(...(
            buttons.map(([text, id], index) => ({
              index: templateButtons.length + index + 1,
              quickReplyButton: {
                displayText: !nullish(text) && text || !nullish(id) && id || '',
                id: !nullish(id) && id || !nullish(text) && text || '',
              },
            })) || []
          ));
        }
        const message = {
          ...options,
          [buffer ? 'caption' : 'text']: text || '',
          footer,
          templateButtons,
          ...(buffer ?
                        options.asLocation && /image/.test(type.mime) ? {
                          location: {
                            ...options,
                            jpegThumbnail: buffer,
                          },
                        } : {
                          [/video/.test(type.mime) ? 'video' : /image/.test(type.mime) ? 'image' : 'document']: buffer,
                        } : {}),
        };
        return await conn.sendMessage(jid, message, {
          quoted,
          upload: conn.waUploadToServer,
          ...options,
        });
      },
      enumerable: true,
    },
    cMod: {
      








      value(jid, message, text = '', sender = conn.user.jid, options = {}) {
        if (options.mentions && !Array.isArray(options.mentions)) options.mentions = [options.mentions];
        const copy = message.toJSON();
        delete copy.message.messageContextInfo;
        delete copy.message.senderKeyDistributionMessage;
        const mtype = Object.keys(copy.message)[0];
        const msg = copy.message;
        const content = msg[mtype];
        if (typeof content === 'string') msg[mtype] = text || content;
        else if (content.caption) content.caption = text || content.caption;
        else if (content.text) content.text = text || content.text;
        if (typeof content !== 'string') {
          msg[mtype] = {...content, ...options};
          msg[mtype].contextInfo = {
            ...(content.contextInfo || {}),
            mentionedJid: options.mentions || content.contextInfo?.mentionedJid || [],
          };
        }
        if (copy.participant) sender = copy.participant = sender || copy.participant;
        else if (copy.key.participant) sender = copy.key.participant = sender || copy.key.participant;
        if (copy.key.remoteJid.includes('@s.whatsapp.net')) sender = sender || copy.key.remoteJid;
        else if (copy.key.remoteJid.includes('@broadcast')) sender = sender || copy.key.remoteJid;
        copy.key.remoteJid = jid;
        copy.key.fromMe = areJidsSameUser(sender, conn.user.id) || false;
        return (copy);
      },
      enumerable: true,
    },
    copyNForward: {
      






      async value(jid, message, forwardingScore = true, options = {}) {
        let vtype;
        if (options.readViewOnce && message.message.viewOnceMessage?.message) {
          vtype = Object.keys(message.message.viewOnceMessage.message)[0];
          delete message.message.viewOnceMessage.message[vtype].viewOnce;
          message.message = proto.Message.fromObject(
              cloneMessage(message.message.viewOnceMessage.message),
          );
          message.message[vtype].contextInfo = message.message.viewOnceMessage.contextInfo;
        }
        const mtype = Object.keys(message.message)[0];
        let m = generateForwardMessageContent(message, !!forwardingScore);
        const ctype = Object.keys(m)[0];
        if (forwardingScore && typeof forwardingScore === 'number' && forwardingScore > 1) m[ctype].contextInfo.forwardingScore += forwardingScore;
        m[ctype].contextInfo = {
          ...(message.message[mtype].contextInfo || {}),
          ...(m[ctype].contextInfo || {}),
        };
        m = generateWAMessageFromContent(jid, m, {
          ...options,
          userJid: conn.user.jid,
        });
        await conn.relayMessage(jid, m.message, {messageId: m.key.id, additionalAttributes: {...options}});
        return m;
      },
      enumerable: true,
    },
    fakeReply: {
      








      value(jid, text = '', fakeJid = this.user.jid, fakeText = '', fakeGroupJid, options) {
        return conn.reply(jid, text, {key: {fromMe: areJidsSameUser(fakeJid, conn.user.id), participant: fakeJid, ...(fakeGroupJid ? {remoteJid: fakeGroupJid} : {})}, message: {conversation: fakeText}, ...options});
      },
    },
    downloadM: {
      






      async value(m, type, saveToFile) {
        let filename;
        if (!m || !(m.url || m.directPath)) return Buffer.alloc(0);
        const stream = await downloadContentFromMessage(m, type);
        let buffer = Buffer.from([]);
        for await (const chunk of stream) {
          buffer = Buffer.concat([buffer, chunk]);
        }
        if (saveToFile) ({filename} = await conn.getFile(buffer, true));
        return saveToFile && fs.existsSync(filename) ? filename : buffer;
      },
      enumerable: true,
    },
    parseMention: {
      




      value(text = '') {
        return [...text.matchAll(/@([0-9]{5,16}|0)/g)].map((v) => v[1] + '@s.whatsapp.net');
      },
      enumerable: true,
    },
    getName: {
      




      value(jid = '', withoutContact = false) {
        jid = conn.decodeJid(jid);
        if (typeof jid !== 'string') jid = jid && jid.id ? conn.decodeJid(jid.id) : String(jid || '');
        withoutContact = conn.withoutContact || withoutContact;
        let v;
        if (typeof jid === 'string' && jid.endsWith('@g.us')) {
          return new Promise(async (resolve) => {
            v = conn.chats[jid] || {};
            if (!(v.name || v.subject)) v = await conn.groupMetadata(jid) || {};
            resolve(v.name || v.subject || PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international'));
          });
        } else {
          v = jid === '0@s.whatsapp.net' ? {
            jid,
            vname: 'WhatsApp',
          } : areJidsSameUser(jid, conn.user.id) ?
                    conn.user :
                    (conn.chats[jid] || {});
        }
        const fallback = typeof jid === 'string' && jid.includes('@s.whatsapp.net')
          ? PhoneNumber('+' + jid.replace('@s.whatsapp.net', '')).getNumber('international')
          : jid;
        return (withoutContact ? '' : v.name) || v.subject || v.vname || v.notify || v.verifiedName || fallback;
      },
      enumerable: true,
    },
    loadMessage: {
      




      value(messageID) {
        return Object.entries(conn.chats)
            .filter(([_, {messages}]) => typeof messages === 'object')
            .find(([_, {messages}]) => Object.entries(messages)
                .find(([k, v]) => (k === messageID || v.key?.id === messageID)))
            ?.[1].messages?.[messageID];
      },
      enumerable: true,
    },
    sendGroupV4Invite: {
      










      async value(jid, participant, inviteCode, inviteExpiration, groupName = 'unknown subject', caption = 'Invitation to join my WhatsApp group', jpegThumbnail, options = {}) {
        const msg = proto.Message.fromObject({
          groupInviteMessage: proto.GroupInviteMessage.fromObject({
            inviteCode,
            inviteExpiration: parseInt(inviteExpiration) || + new Date(new Date + (3 * 86400000)),
            groupJid: jid,
            groupName: (groupName ? groupName : await conn.getName(jid)) || null,
            jpegThumbnail: Buffer.isBuffer(jpegThumbnail) ? jpegThumbnail : null,
            caption,
          }),
        });
        const message = generateWAMessageFromContent(participant, msg, options);
        await conn.relayMessage(participant, message.message, {messageId: message.key.id, additionalAttributes: {...options}});
        return message;
      },
      enumerable: true,
    },
    processMessageStubType: {
      



      async value(m) {
    if (!m.messageStubType) return;
    const chat = conn.decodeJid(m.key.remoteJid || m.message?.senderKeyDistributionMessage?.groupId || '');
    if (!chat || chat === 'status@broadcast') return;

    
    if (Array.isArray(m.messageStubParameters)) {
      m.messageStubParameters = m.messageStubParameters.map(p => 
        typeof p === 'string' && p.endsWith('@lid') ? conn.decodeJid(p) : p
      );
    }
    
    const emitGroupUpdate = (update) => {
        conn.ev.emit('groups.update', [{ id: chat, ...update }]);
    };

    switch (m.messageStubType) {
        case WAMessageStubType.REVOKE:
        case WAMessageStubType.GROUP_CHANGE_INVITE_LINK:
            if (Array.isArray(m.messageStubParameters) && m.messageStubParameters.length > 0) {
                emitGroupUpdate({ revoke: m.messageStubParameters[0] });
            }
            break;
        case WAMessageStubType.GROUP_CHANGE_ICON:
            if (Array.isArray(m.messageStubParameters) && m.messageStubParameters.length > 0) {
                emitGroupUpdate({ icon: m.messageStubParameters[0] });
            }
            break;
        default: {
            console.log({
                messageStubType: m.messageStubType,
                messageStubParameters: m.messageStubParameters || [],
                type: WAMessageStubType[m.messageStubType]
            });
            break;
        }
    }

    const isGroup = chat.endsWith('@g.us');
    if (!isGroup) return;

    let chats = conn.chats[chat];
    if (!chats) chats = conn.chats[chat] = { id: chat };
    chats.isChats = true;

    const metadata = await conn.groupMetadata(chat).catch(() => null);
    if (!metadata) return;

    chats.subject = metadata.subject;
    chats.metadata = metadata;
}
},
    insertAllGroup: {
      async value() {
        const groups = await conn.groupFetchAllParticipating().catch((_) => null) || {};
        for (const group in groups) conn.chats[group] = {...(conn.chats[group] || {}), id: group, subject: groups[group].subject, isChats: true, metadata: groups[group]};
        return conn.chats;
      },
    },
    
    pushMessage: {
      



      async value(m) {
        if (!m) return;
        if (!Array.isArray(m)) m = [m];
        for (const message of m) {
          try {
            
            if (!message) continue;
            
            const mentionedLids = [
  ...(message.message?.extendedTextMessage?.contextInfo?.mentionedJid || []),
  ...(message.message?.imageMessage?.contextInfo?.mentionedJid || []),
  ...(message.message?.videoMessage?.contextInfo?.mentionedJid || []),
  ...(message.message?.conversation?.contextInfo?.mentionedJid || [])
].filter(jid => typeof jid === 'string' && jid.endsWith('@lid'));

for (const lid of mentionedLids) {
  try {
    const pn = await conn.signalRepository?.lidMapping?.getPNForLID?.(lid);

    console.log('[DIRECT LID LOOKUP]', {
      lid,
      pn
    });

    if (typeof pn === 'string' && pn) {
      conn.lidMap ??= new Map();
      conn.lidMap.set(lid, jidNormalizedUser(pn));
    }
  } catch (e) {
    console.log('[DIRECT LID LOOKUP ERROR]', e?.message || e);
  }
}
            if (message.messageStubType && message.messageStubType != WAMessageStubType.CIPHERTEXT) conn.processMessageStubType(message).catch(console.error);
            const _mtype = Object.keys(message.message || {});
            const mtype = (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(_mtype[0]) && _mtype[0]) ||
                            (_mtype.length >= 3 && _mtype[1] !== 'messageContextInfo' && _mtype[1]) ||
                            _mtype[_mtype.length - 1];
            const chat = conn.decodeJid(message.key.remoteJid || message.message?.senderKeyDistributionMessage?.groupId || '');
            if (message.message?.[mtype]?.contextInfo?.quotedMessage) {
              


              const context = message.message[mtype].contextInfo;
              let participant = normalizeJid(
  context.participantAlt ||
  context.participantPn ||
  context.participant,
  conn
);
              const remoteJid = normalizeJid(
                context.remoteJid || participant,
                conn
              );
              



              const quoted = message.message[mtype].contextInfo.quotedMessage;
              if ((remoteJid && remoteJid !== 'status@broadcast') && quoted) {
                let qMtype = Object.keys(quoted)[0];
                if (qMtype == 'conversation') {
                  quoted.extendedTextMessage = {text: quoted[qMtype]};
                  delete quoted.conversation;
                  qMtype = 'extendedTextMessage';
                }
                if (!quoted[qMtype].contextInfo) quoted[qMtype].contextInfo = {};
                
                quoted[qMtype].contextInfo.mentionedJid = (context.mentionedJid || quoted[qMtype].contextInfo.mentionedJid || [])
                  .map(jid => normalizeJid(jid, conn))
                  .filter(Boolean);
                
                const isGroup = remoteJid.endsWith('g.us');
                if (isGroup && !participant) participant = remoteJid;
                
                
                const qM = {
                  key: {
                    remoteJid: normalizeJid(remoteJid, conn),
                    fromMe: areJidsSameUser(conn.user.jid, remoteJid),
                    id: context.stanzaId,
                    participant: normalizeJid(participant, conn),
                  },
                  message: JSON.parse(JSON.stringify(quoted)),
                  ...(isGroup ? {participant: normalizeJid(participant, conn)} : {}),
                };
                let qChats = conn.chats[participant];
                if (!qChats) qChats = conn.chats[participant] = {id: participant, isChats: !isGroup};
                if (!qChats.messages) qChats.messages = {};
                if (!qChats.messages[context.stanzaId] && !qM.key.fromMe) qChats.messages[context.stanzaId] = qM;
                let qChatsMessages;
                if ((qChatsMessages = Object.entries(qChats.messages)).length > 40) qChats.messages = Object.fromEntries(qChatsMessages.slice(30, qChatsMessages.length)); 
              }
            }
            if (!chat || chat === 'status@broadcast') continue;
            const isGroup = chat.endsWith('@g.us');
            let chats = conn.chats[chat];
            if (!chats) {
              if (isGroup) await conn.insertAllGroup().catch(console.error);
              chats = conn.chats[chat] = {id: chat, isChats: true, ...(conn.chats[chat] || {})};
            }
            let metadata; let sender;
            if (isGroup) {
              if (!chats.subject || !chats.metadata) {
                metadata = await conn.groupMetadata(chat).catch((_) => ({})) || {};
                if (!chats.subject) chats.subject = metadata.subject || '';
                if (!chats.metadata) chats.metadata = metadata;
              }
              sender = resolveMessageSender(message, conn);
              if (sender !== chat) {
                let chats = conn.chats[sender];
                if (!chats) chats = conn.chats[sender] = {id: sender};
                if (!chats.name) chats.name = message.pushName || chats.name || '';
              }
            } else if (!chats.name) chats.name = message.pushName || chats.name || '';
            if (['senderKeyDistributionMessage', 'messageContextInfo'].includes(mtype)) continue;
            chats.isChats = true;
            if (!chats.messages) chats.messages = {};
            const fromMe = message.key.fromMe || areJidsSameUser(sender || chat, conn.user.id);
            if (!['protocolMessage'].includes(mtype) && !fromMe && message.messageStubType != WAMessageStubType.CIPHERTEXT && message.message) {
              delete message.message.messageContextInfo;
              delete message.message.senderKeyDistributionMessage;
              chats.messages[message.key.id] = cloneMessage(message);
              let chatsMessages;
              if ((chatsMessages = Object.entries(chats.messages)).length > 40) chats.messages = Object.fromEntries(chatsMessages.slice(30, chatsMessages.length));
            }
          } catch (e) {
            console.error(e);
          }
        }
      },
    },
    serializeM: {
      



      value(m) {
        return smsg(conn, m);
      },
    },
    ...(typeof conn.chatRead !== 'function' ? {
      chatRead: {
        





        value(jid, participant = conn.user.jid, messageID) {
          return conn.sendReadReceipt(jid, participant, [messageID]);
        },
        enumerable: true,
      },
    } : {}),
    ...(typeof conn.setStatus !== 'function' ? {
      setStatus: {
        



        value(status) {
          return conn.query({
            tag: 'iq',
            attrs: {
              to: S_WHATSAPP_NET,
              type: 'set',
              xmlns: 'status',
            },
            content: [
              {
                tag: 'status',
                attrs: {},
                content: Buffer.from(status, 'utf-8'),
              },
            ],
          });
        },
        enumerable: true,
      },
    } : {}),
  });
  if (sock.user?.id) sock.user.jid = sock.decodeJid(sock.user.id);
  
  try {
    const _origGroupMetadata = conn.groupMetadata && conn.groupMetadata.bind(conn)
    if (_origGroupMetadata) {
      conn.groupMetadata = async function (jid) {
        const meta = await _origGroupMetadata(jid).catch(() => null)
        if (!meta) return meta

        cacheLidMappings(conn, meta);
        if (Array.isArray(meta.participants)) {
  meta.participants = meta.participants.map(participant => {
    const originalId = participant?.id;

    if (
      typeof originalId === 'string' &&
      originalId.endsWith('@lid')
    ) {
      const pn =
        participant?.jid?.endsWith('@s.whatsapp.net')
          ? participant.jid
          : conn.lidMap?.get(jidNormalizedUser(originalId));

      if (pn) {
        return {
          ...participant,
          id: jidNormalizedUser(pn),
          lid: jidNormalizedUser(originalId),
          jid: jidNormalizedUser(pn)
        };
      }
    }

    return participant;
  });
}
        try {
          
          if (meta.id) meta.id = jidNormalizedUser(conn.decodeJid(meta.id))
          
          if (Array.isArray(meta.participants)) {
  meta.participants = await Promise.all(
  meta.participants.map(async p => {
    try {
      const rawId =
        typeof p.id === 'string'
          ? p.id
          : null;

      const rawLid =
        typeof p.lid === 'string'
          ? p.lid
          : (rawId && isLidUser(rawId) ? rawId : null);

      const rawPn =
        typeof p.phoneNumber === 'string'
          ? p.phoneNumber
          : (rawId && isPnUser(rawId) ? rawId : null);

      const normalize = jid => {
        if (typeof jid !== 'string' || !jid) return null;
        try {
          return jidNormalizedUser(jid);
        } catch {
          return jid;
        }
      };

      let lid = normalize(rawLid);
      let pn = normalize(rawPn);

      /*
       * Se abbiamo il LID ma non il PN,
       * chiediamo direttamente a Baileys la corrispondenza.
       */
      if (lid && !pn) {
        try {
          const resolved =
            await conn.signalRepository?.lidMapping?.getPNForLID?.(lid);

          if (typeof resolved === 'string' && resolved) {
            pn = normalize(resolved);
          }
        } catch {}
      }

      /*
       * Se abbiamo entrambi, aggiorniamo sempre la .
       */
      if (lid && pn) {
        conn.lidMap ??= new Map();

        conn.lidMap.set(lid, pn);

        /*
         * Manteniamo anche la relazione inversa.
         */
        conn.pnMap ??= new Map();
        conn.pnMap.set(pn, lid);
      }

      return {
        ...p,

        /*
         * Per compatibilità con i vecchi plugin,
         * id deve essere il PN quando disponibile.
         */
        id:
          pn ||
          lid ||
          normalize(rawId) ||
          p.id ||
          null,

        ...(lid ? { lid } : {}),
        ...(pn ? { phoneNumber: pn } : {}),
      };

    } catch (e) {
      console.error(
        '[simple.js] Errore normalizzazione partecipante:',
        e
      );

      return p;
    }
  })
);
}
        } catch (e) {
          console.error('[simple.js] Errore nella normalizzazione groupMetadata:', e)
        }
        return meta
      }
    }
  } catch (e) {
    console.error('[simple.js] Fallito avvolgimento groupMetadata:', e)
  }
  return sock;
}






export function smsg(conn, m) {
  if (!m || typeof m !== 'object') return m;

  
  
  m = {
    ...m,
    key: m.key ? { ...m.key } : m.key,
    message: m.message || undefined,
  };

  m.conn = conn;

  let protocolMessageKey;

  
  if (m.message) {
    let message = m.message;
    let mtype = Object.keys(message || {})[0];

    while (
      message &&
      mtype &&
      ['ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension'].includes(mtype) &&
      message[mtype]?.message
    ) {
      message = message[mtype].message;
      mtype = Object.keys(message || {})[0];
    }

    m.message = message;
    m.mtype = mtype || '';
    m.msg = m.mtype ? m.message?.[m.mtype] : null;
  } else {
    m.mtype = '';
    m.msg = null;
  }

  const rawRemoteJid = m.key.remoteJid;

const remoteJid =
  normalizeJid(rawRemoteJid, conn) ||
  (typeof rawRemoteJid === 'string' ? rawRemoteJid : null);

Object.defineProperties(m, {
  from: { value: remoteJid, enumerable: true },
  chat: { value: remoteJid, enumerable: true },
  id: { value: m.key.id, enumerable: true },
  fromMe: { value: m.key.fromMe, enumerable: true },
  isGroup: {
    value: typeof remoteJid === 'string' && remoteJid.endsWith('@g.us'),
    enumerable: true
  },
  sender: {
    value: resolveMessageSender(m, conn),
    enumerable: true
  }
});

  const msg = m.msg;

  
  
  let text = '';

  if (typeof msg === 'string') {
    text = msg;
  } else if (msg && typeof msg === 'object') {
    text =
      msg.text ||
      msg.caption ||
      msg.conversation ||
      msg.selectedButtonId ||
      msg.selectedId ||
      msg.singleSelectReply?.selectedRowId ||
      msg.templateButtonReplyMessage?.selectedId ||
      msg.listResponseMessage?.singleSelectReply?.selectedRowId ||
      msg.selectedDisplayText ||
      msg.hydratedTemplate?.hydratedContentText ||
      '';
  }

  if (!text && typeof m.message?.conversation === 'string') {
    text = m.message.conversation;
  }

  m.text = typeof text === 'string' ? text : String(text || '');
  m.body = m.text;

  
  m.type = m.mtype;
  m.mentionedJid = Array.isArray(m.msg?.contextInfo?.mentionedJid)
  ? m.msg.contextInfo.mentionedJid
      .map(jid => {
        const raw = typeof jid === 'string' ? jid.trim() : '';
        if (!raw) return null;

        const normalized = normalizeJid(raw, conn);

        if (normalized && normalized.endsWith('@s.whatsapp.net')) {
          return normalized;
        }

        if (raw.endsWith('@lid')) {
          const mapped =
            conn.lidMap?.get(raw) ||
            conn.lidMap?.get(jidNormalizedUser(raw));

          if (mapped) return mapped;
        }

        return normalized;
      })
      .filter(Boolean)
  : [];

  if (m.mtype === 'protocolMessage' && m.msg?.key) {
    protocolMessageKey = { ...m.msg.key };

    if (protocolMessageKey.remoteJid === 'status@broadcast') {
      protocolMessageKey.remoteJid = m.chat;
    }

    if (!protocolMessageKey.participant || protocolMessageKey.participant === 'status_me') {
      protocolMessageKey.participant = m.sender;
    }

    protocolMessageKey.fromMe =
      normalizeJid(protocolMessageKey.participant, conn) ===
      normalizeJid(conn.user?.id || conn.user?.jid, conn);

    if (
      !protocolMessageKey.fromMe &&
      normalizeJid(protocolMessageKey.remoteJid, conn) ===
        normalizeJid(conn.user?.id || conn.user?.jid, conn)
    ) {
      protocolMessageKey.remoteJid = m.sender;
    }
  }

  if (Array.isArray(m.messageStubParameters)) {
    m.messageStubParameters = m.messageStubParameters.map(param => {
      if (typeof param === 'string' && isLidUser(param)) {
        return normalizeJid(param, conn);
      }
      return param;
    });
  }

  
  const contextInfo = m.msg?.contextInfo;
  const quotedMessage = contextInfo?.quotedMessage;

  if (contextInfo && quotedMessage) {
    let quoted = quotedMessage;
    let qType = Object.keys(quoted || {})[0];

    while (
      quoted &&
      qType &&
      ['ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2', 'viewOnceMessageV2Extension'].includes(qType) &&
      quoted[qType]?.message
    ) {
      quoted = quoted[qType].message;
      qType = Object.keys(quoted || {})[0];
    }

    if (quoted && qType) {
      const qMsg = quoted[qType];
      const quotedChat = normalizeJid(contextInfo.remoteJid || m.chat, conn);
      const quotedSender = normalizeJid(
        contextInfo.participantAlt ||
        contextInfo.participantPn ||
        contextInfo.participant ||
        quotedChat,
        conn
      );

      const qValue = {
        key: {
          remoteJid: quotedChat,
          fromMe:
            typeof contextInfo.fromMe === 'boolean'
              ? contextInfo.fromMe
              : areJidsSameUser(quotedSender, conn.user?.id || conn.user?.jid),
          id: contextInfo.stanzaId,
          participant: quotedSender,
        },
        message: quoted,
        mtype: qType,
        msg: qMsg,
        sender: quotedSender,
        text:
          (typeof qMsg === 'string' ? qMsg : qMsg?.text || qMsg?.caption) ||
          quoted?.conversation ||
          '',
        mentionedJid: Array.isArray(qMsg?.contextInfo?.mentionedJid)
          ? qMsg.contextInfo.mentionedJid.map(jid => normalizeJid(jid, conn)).filter(Boolean)
          : [],
      };

      qValue.vM = {
        key: { ...qValue.key },
        message: qValue.message,
      };

      qValue.fakeObj = qValue.vM;

      qValue.reply = (text, chatId, options = {}) =>
        conn.reply(chatId || qValue.key.remoteJid, text, qValue.vM, options);

      qValue.delete = () =>
        conn.sendMessage(qValue.key.remoteJid, { delete: qValue.key });

      qValue.react = text =>
        conn.sendMessage(qValue.key.remoteJid, {
          react: { text, key: qValue.key },
        });

      qValue.copy = () => smsg(conn, cloneMessage(qValue.vM));

      qValue.forward = (jid, force = false, options = {}) =>
        conn.sendMessage(jid, { forward: qValue.vM, force, ...options }, options);

      qValue.copyNForward = (jid, forceForward = false, options = {}) =>
        conn.copyNForward(jid, qValue.vM, forceForward, options);

      Object.defineProperty(qValue, 'name', {
        enumerable: true,
        get() {
          return qValue.sender ? conn.getName(qValue.sender) : '';
        },
      });

      Object.defineProperty(qValue, 'isGroup', {
        enumerable: true,
        get() {
          return !!qValue.key.remoteJid?.endsWith('@g.us');
        },
      });

      m.quoted = qValue;
    } else {
      m.quoted = null;
    }
  } else {
    m.quoted = null;
  }

  const compatMediaType = MediaTypeForCompat(m);
  if (compatMediaType) {
    m.mediaType = compatMediaType;
    m.mediaMessage = { [m.mtype]: m.msg };
  } else {
    m.mediaType = null;
    m.mediaMessage = null;
  }

  m.reply = (text, chatId, options = {}) => {
  const targetJid = (chatId === null || chatId === undefined) ? m.chat : chatId;
  return Buffer.isBuffer(text)
    ? conn.sendFile(targetJid, text, 'file', '', m, false, options)
    : conn.sendMessage(targetJid, { text, ...options }, { quoted: m, ...options });
};

  try {
    if (protocolMessageKey && m.mtype === 'protocolMessage') {
      conn.ev.emit('message.delete', protocolMessageKey);
    }
  } catch (e) {
    console.error(e);
  }

  return m;
}

function MediaTypeForCompat(m) {
  const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'];
  return mediaTypes.includes(m?.mtype) ? m.mtype.replace(/Message$/i, '') : null;
}



export function serialize() {
  const MediaType = ['imageMessage', 'videoMessage', 'audioMessage', 'stickerMessage', 'documentMessage'];
  return Object.defineProperties(WebMessageInfo.prototype, {
    conn: {
      value: undefined,
      enumerable: false,
      writable: true,
    },
    id: {
      get() {
        return this.key?.id;
      },
    },
    isBaileys: {
      get() {
      const id = this?.id || '';
      return !!((this?.fromMe || areJidsSameUser(this.conn?.user?.id, this.sender)) &&
        id.startsWith('3EB0') &&
        (id.length === 20 || id.length === 22 || id.length === 12));
    },
    }, 
    chat: {
      get() {
        const senderKeyDistributionMessage = this.message?.senderKeyDistributionMessage?.groupId;
        const jid = this.key?.remoteJid ||
        (senderKeyDistributionMessage &&
          senderKeyDistributionMessage !== 'status@broadcast'
            ? senderKeyDistributionMessage
            : '') ||
        '';
      return this.conn?.decodeJid ? this.conn.decodeJid(jid) : jid;
      },
    },
    isGroup: {
      get() {
        return !!this.chat?.endsWith('@g.us');
      },
      enumerable: true,
    },
        sender: {
  get() {
    if (this._sender) return this._sender;

    return resolveMessageSender({
      key: this.key,
      participant: this.participant
    }, this.conn);
  },
  set(value) {
    this._sender = value;
  },
  enumerable: true
},
        fromMe: {
            get() {
                return !!(this.key?.fromMe || areJidsSameUser(this.conn?.user?.id, this.sender));
            }
    },
    mtype: {
      get() {
        if (!this.message) return '';
        const type = Object.keys(this.message);
        return (!['senderKeyDistributionMessage', 'messageContextInfo'].includes(type[0]) && type[0]) || 
                    (type.length >= 3 && type[1] !== 'messageContextInfo' && type[1]) || 
                    type[type.length - 1]; 
      },
      enumerable: true,
    },
    msg: {
      get() {
        if (!this.message) return null;
        return this.message[this.mtype];
      },
    },
    mediaMessage: {
      get() {
        if (!this.message) return null;
        const Message = ((this.msg?.url || this.msg?.directPath) ? {...this.message} : extractMessageContent(this.message)) || null;
        if (!Message) return null;
        const mtype = Object.keys(Message)[0];
        return MediaType.includes(mtype) ? Message : null;
      },
      enumerable: true,
    },
    mediaType: {
      get() {
        let message;
        if (!(message = this.mediaMessage)) return null;
        return Object.keys(message)[0];
      },
      enumerable: true,
    },
    quoted: {
      get() {
        const self = this;
        const msg = self.msg;
        const contextInfo = msg?.contextInfo;
        const quoted = contextInfo?.quotedMessage;
        if (!msg || !contextInfo || !quoted) return null;
        const type = Object.keys(quoted || {})[0];
        if (!type) return null;
        const q = quoted[type];
        const text = typeof q === 'string' ? q : (q?.text || q?.caption || '');
        return Object.defineProperties(cloneMessage(typeof q === 'string' ? {text: q} : q), {
          mtype: {
            get() {
              return type;
            },
            enumerable: true,
          },
          mediaMessage: {
            get() {
              const Message = ((q?.url || q?.directPath) ? {...quoted} : extractMessageContent(quoted)) || null;
              if (!Message) return null;
              const mtype = Object.keys(Message)[0];
              return MediaType.includes(mtype) ? Message : null;
            },
            enumerable: true,
          },
          mediaType: {
            get() {
              let message;
              if (!(message = this.mediaMessage)) return null;
              return Object.keys(message)[0];
            },
            enumerable: true,
          },
          id: {
            get() {
              return contextInfo.stanzaId;
            },
            enumerable: true,
          },
          chat: {
            get() {
              return contextInfo.remoteJid || self.chat;
            },
            enumerable: true,
          },
          isBaileys: {
            get() {
            const id = this?.id || '';
      return !!((this?.fromMe || areJidsSameUser(this.conn?.user?.id, this.sender)) &&
        id.startsWith('3EB0') &&
        (id.length === 20 || id.length === 22 || id.length === 12));
                       },
            enumerable: true,
          },
          sender: {
  get() {
    if (this._sender) return this._sender;

    const quotedParticipant =
      contextInfo.participantAlt ||
      contextInfo.participantPn ||
      contextInfo.participant ||
      this.chat ||
      '';

    return normalizeJid(quotedParticipant, self.conn);
  },
  set(value) {
    this._sender = value;
  },
  enumerable: true,
},
          text: {
            get() {
              return text || this.caption || this.contentText || this.selectedDisplayText || '';
            },
            enumerable: true,
          },
          mentionedJid: {
            get() {
              return q.contextInfo?.mentionedJid || self.getQuotedObj()?.mentionedJid || [];
            },
            enumerable: true,
          },
          name: {
            get() {
              const sender = this.sender;
              return sender ? self.conn?.getName(sender) : null;
            },
            enumerable: true,

          },
          vM: {
  get() {
    const obj = {
      key: {
        fromMe: this.fromMe,
        remoteJid: this.chat,
        id: this.id
      },
      message: quoted
    }

    if (self.isGroup) {
      obj.key.participant = this.sender
    }

    return obj
  }
},
          fakeObj: {
            get() {
              return this.vM;
            },
          },
          download: {
            value(saveToFile = false) {
              const mtype = this.mediaType;
              return self.conn?.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ''), saveToFile);
            },
            enumerable: true,
            configurable: true,
          },
          reply: {
            value(text, chatId, options) {
              return self.conn?.reply(chatId ? chatId : this.chat, text, this.vM, options);
            },
            enumerable: true,
          },
          copy: {
            value() {
              const M = WebMessageInfo;
              return smsg(conn, fromPlainMessage(toPlainMessage(this.vM)));
            },
            enumerable: true,
          },
          forward: {
            value(jid, force = false, options) {
              return self.conn?.sendMessage(jid, {
                forward: this.vM, force, ...options,
              }, {...options});
            },
            enumerable: true,

          },
          copyNForward: {
            value(jid, forceForward = false, options) {
              return self.conn?.copyNForward(jid, this.vM, forceForward, options);
            },
            enumerable: true,

          },
          cMod: {
            value(jid, text = '', sender = this.sender, options = {}) {
              return self.conn?.cMod(jid, this.vM, text, sender, options)
            },
            enumerable: true,
            
          },
          delete: {
            value() {
              return self.conn?.sendMessage(this.chat, { delete: this.vM.key })
            },
            enumerable: true,
            
          }, 
          
            react: {
              value(text) {
                return self.conn?.sendMessage(this.chat, {
                  react: {
                    text,
                    key: this.vM.key
                  }
                })
              },
              enumerable: true,
          }
          
        })
      },
      enumerable: true
    },
    _text: {
      value: null,
      writable: true,
    },
    text: {
      get() {
        if (typeof this._text === 'string') return this._text;

        const msg = this.msg;
        const text =
          (typeof msg === 'string'
            ? msg
            : msg?.text ||
              msg?.conversation ||
              msg?.caption ||
              msg?.selectedButtonId ||
              msg?.selectedId ||
              msg?.singleSelectReply?.selectedRowId ||
              msg?.templateButtonReplyMessage?.selectedId ||
              msg?.listResponseMessage?.singleSelectReply?.selectedRowId ||
              msg?.selectedDisplayText ||
              msg?.hydratedTemplate?.hydratedContentText ||
              '') || '';

        return typeof text === 'string' ? text : String(text || '');
      },
      set(str) {
        return this._text = typeof str === 'string' ? str : String(str || '');
      },
      enumerable: true
    },
    mentionedJid: {
      get() {
        return this.msg?.contextInfo?.mentionedJid?.length && this.msg.contextInfo.mentionedJid || []
      },
      enumerable: true
    },
    name: {
      get() {
        return !nullish(this.pushName) && this.pushName || this.conn?.getName(this.sender)
      },
      enumerable: true
    },
    download: {
      value(saveToFile = false) {
        const mtype = this.mediaType
        return this.conn?.downloadM(this.mediaMessage[mtype], mtype.replace(/message/i, ''), saveToFile)
      },
      enumerable: true,
      configurable: true
    },
    reply: {
      value(text, chatId, options) {
        return this.conn?.reply(chatId ? chatId : this.chat, text, this, options)
      }
    },
    copy: {
      value() {
        const M = WebMessageInfo
        return smsg(this.conn, fromPlainMessage(toPlainMessage(this)))
      },
      enumerable: true
    },
    forward: {
      value(jid, force = false, options = {}) {
        return this.conn?.sendMessage(jid, {
          forward: this, force, ...options
        }, { ...options })
      },
      enumerable: true
    },
    copyNForward: {
      value(jid, forceForward = false, options = {}) {
        return this.conn?.copyNForward(jid, this, forceForward, options)
      },
      enumerable: true
    },
    cMod: {
      value(jid, text = '', sender = this.sender, options = {}) {
        return this.conn?.cMod(jid, this, text, sender, options)
      },
      enumerable: true
    },
    getQuotedObj: {
      value() {
        if (!this.quoted?.id) return null
        const q = (this.conn?.loadMessage(this.quoted.id) || this.quoted.vM)
        return smsg(this.conn, q)
      },
      enumerable: true
    },
    getQuotedMessage: {
      get() {
        return this.getQuotedObj
      }
    },
    delete: {
      value() {
        return this.conn?.sendMessage(this.chat, { delete: this.key })
      },
      enumerable: true
    }, 
    
      react: {
        value(text) {
          return this.conn?.sendMessage(this.chat, {
            react: {
              text,
              key: this.key
            }
          })
        },
        enumerable: true
    }
    
  })
}

export function logic(check, inp, out) {
  if (inp.length !== out.length) throw new Error('Input e Output devono avere la stessa lunghezza');
  for (const i in inp) if (util.isDeepStrictEqual(check, inp[i])) return out[i];
  return null;
}

export function protoType() {
  Buffer.prototype.toArrayBuffer = function toArrayBufferV2() {
    const ab = new ArrayBuffer(this.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < this.length; ++i) {
      view[i] = this[i];
    }
    return ab;
  };
  


  Buffer.prototype.toArrayBufferV2 = function toArrayBuffer() {
    return this.buffer.slice(this.byteOffset, this.byteOffset + this.byteLength);
  };
  


  ArrayBuffer.prototype.toBuffer = function toBuffer() {
    return Buffer.from(new Uint8Array(this));
  };
  
  
  
  
  
  
  Uint8Array.prototype.getFileType = ArrayBuffer.prototype.getFileType = Buffer.prototype.getFileType = async function getFileType() {
    return await fileTypeFromBuffer(this);
  };
  


  String.prototype.isNumber = Number.prototype.isNumber = isNumber;
  



  String.prototype.capitalize = function capitalize() {
    return this.charAt(0).toUpperCase() + this.slice(1, this.length);
  };
  


  String.prototype.capitalizeV2 = function capitalizeV2() {
    const str = this.split(' ');
    return str.map((v) => v.capitalize()).join(' ');
  };
  String.prototype.decodeJid = function decodeJid() {
  const value = String(this || '').trim();

  if (!value) return '';

  try {
    const decode = jidDecode(value);

    if (!decode?.user || !decode?.server) {
      return value;
    }

    return `${decode.user}@${decode.server}`;
  } catch {
    return value;
  }
};
  



  Number.prototype.toTimeString = function() {
    
    const seconds = Math.floor((this / 1000) % 60);
    const minutes = Math.floor((this / (60 * 1000)) % 60);
    const hours = Math.floor((this / (60 * 60 * 1000)) % 24);
    const days = Math.floor((this / (24 * 60 * 60 * 1000)));
    return (
      (days ? `${days} giorno/i ` : '') +
            (hours ? `${hours} ora/e ` : '') +
            (minutes ? `${minutes} minuto/i ` : '') +
            (seconds ? `${seconds} secondo/i` : '')
    ).trim();
  };
  Number.prototype.getRandom = String.prototype.getRandom = Array.prototype.getRandom = getRandom;
}


function isNumber() {
  const int = parseInt(this);
  return typeof int === 'number' && !isNaN(int);
}

function getRandom() {
  if (Array.isArray(this) || this instanceof String) return this[Math.floor(Math.random() * this.length)];
  return Math.floor(Math.random() * this);
}







function nullish(args) {
  return !(args !== null && args !== undefined);
}