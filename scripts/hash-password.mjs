import { randomBytes, scrypt } from 'node:crypto'
import { promisify } from 'node:util'

const password = process.argv[2]
if (!password || password.length < 12) {
  console.error('Provide a password of at least 12 characters.')
  process.exitCode = 1
} else {
  const salt = randomBytes(16).toString('hex')
  const derived = await promisify(scrypt)(password, salt, 64)
  console.log(`scrypt$${salt}$${derived.toString('hex')}`)
}
