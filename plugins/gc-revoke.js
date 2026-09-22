

let handler = async(m, { conn }) => {
let revoke = conn.groupRevokeInvite(m.chat)}
handler.command = ['reimposta', 'revoke']
handler.botAdmin = true
handler.admin = true
handler.group = true
export default handler
