import 'dotenv/config'
import pg from 'pg'

const { Client } = pg

const sql = `ALTER TYPE "GameType" ADD VALUE IF NOT EXISTS 'GALAGA'`

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
    const r = await client.query(`
      SELECT e.enumlabel
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'GameType'
      ORDER BY e.enumsortorder
    `)
    console.log('OK labels:', r.rows.map((x) => x.enumlabel).join(','))
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
