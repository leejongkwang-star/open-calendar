import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import pg from 'pg'

const { Client } = pg
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sql = fs.readFileSync(path.join(__dirname, '..', 'add_password_reset_requests.sql'), 'utf8')

async function tryUrl(url) {
  const safe = url.replace(/:[^:@/]+@/, ':****@')
  console.log('try', safe)
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 20000,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()
  try {
    await client.query(sql)
    const r = await client.query(`SELECT to_regclass('public.password_reset_requests') AS table_name`)
    console.log('OK table:', r.rows[0].table_name)
  } finally {
    await client.end()
  }
}

async function main() {
  const base = process.env.DATABASE_URL
  if (!base) throw new Error('DATABASE_URL missing')

  const urls = [
    base.replace(':6543/', ':5432/'),
    base.replace(
      /@aws-1-ap-northeast-2\.pooler\.supabase\.com:\d+/,
      '@db.eoaoniysfxbtzfukqhiy.supabase.co:5432'
    ),
    base,
  ]

  let lastErr
  for (const url of urls) {
    try {
      await tryUrl(url)
      return
    } catch (e) {
      lastErr = e
      console.log('fail:', e.message)
    }
  }
  throw lastErr
}

main().catch((e) => {
  console.error('FINAL', e.message)
  process.exit(1)
})
