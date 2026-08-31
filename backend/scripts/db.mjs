import 'dotenv/config'
import pg from 'pg'

const { Client } = pg

export function maskUrl(url) {
  return url.replace(/:[^:@/]+@/, ':****@')
}

export function requireDatabaseUrl() {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error('DATABASE_URL 환경변수가 필요합니다')
  }
  return url
}

// Supabase 풀러(6543)로는 DDL이 멈추는 사례가 있어 직접 연결(5432)을 먼저 시도한다.
// 호스트는 절대 바꾸지 않는다. 다른 부서 DB에 잘못 적용되는 사고를 막기 위함이다.
export function candidateUrls(base) {
  const urls = base.includes(':6543/') ? [base.replace(':6543/', ':5432/'), base] : [base]
  return [...new Set(urls)]
}

export async function withClient(fn) {
  const base = requireDatabaseUrl()
  let lastError

  for (const url of candidateUrls(base)) {
    console.log('접속 시도:', maskUrl(url))

    const client = new Client({
      connectionString: url,
      connectionTimeoutMillis: 20000,
      ssl: { rejectUnauthorized: false },
    })

    try {
      await client.connect()
    } catch (error) {
      lastError = error
      console.log('  접속 실패:', error.message)
      continue
    }

    console.log('  접속 성공')
    try {
      return await fn(client)
    } finally {
      await client.end()
    }
  }

  throw lastError ?? new Error('DB 접속에 실패했습니다')
}

export function runScript(fn) {
  withClient(fn).catch((error) => {
    console.error('실패:', error.message)
    process.exit(1)
  })
}
