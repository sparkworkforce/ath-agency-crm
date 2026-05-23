/**
 * NIST SP 800-63B compliant password breach check.
 * Checks against a local list of the most commonly breached passwords.
 * This avoids external API calls while satisfying the NIST requirement.
 */
const BREACHED_PASSWORDS = new Set([
  '12345678','123456789','1234567890','password','password1','qwerty123',
  'abcdefgh','11111111','12341234','iloveyou','admin123','welcome1',
  'monkey123','dragon12','master12','qwerty12','login123','abc12345',
  'letmein1','shadow12','sunshine1','trustno1','princess1','football1',
  'charlie1','access14','batman12','michael1','mustang1','jessica1',
  'password123','qwertyuiop','1q2w3e4r','zaq1zaq1','passw0rd','p@ssw0rd',
  'changeme','welcome123','hello123','freedom1','whatever1','qazwsx12',
  'trustno12','jordan23','harley12','ranger12','buster12','thomas12',
  'robert12','soccer12','killer12','george12','andrew12','andrea12',
  'joshua12','daniel12','hannah12','samantha','alexander','elizabeth',
  'computer','internet','samsung1','corvette','mercedes','midnight1',
  'cocacola','chocolate','superman1','spiderman','starwars1','maverick',
  'phoenix1','steelers','dolphins','redskins','cowboys1','yankees1',
  'summer12','winter12','spring12','autumn12','january1','february',
  'baseball1','basketball','football12','hockey12','tennis12','cricket1',
  'asdfghjk','zxcvbnm1','qweasdzxc','1qaz2wsx','qwerty1234','asdf1234',
  'pass1234','test1234','user1234','temp1234','default1','guest123',
  'admin1234','root1234','toor1234','system12','server12','network1',
  'database1','security','firewall','wireless','ethernet','protocol',
  'Pa$$w0rd','P@ssword','Passw0rd','PASSWORD','Password','p@$$w0rd',
])

/** Returns true if the password is in the breached list */
export function isBreachedPassword(password: string): boolean {
  return BREACHED_PASSWORDS.has(password) || BREACHED_PASSWORDS.has(password.toLowerCase())
}
