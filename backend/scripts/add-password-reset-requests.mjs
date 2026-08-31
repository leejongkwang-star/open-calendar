import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { runScript } from './db.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sql = fs.readFileSync(path.join(__dirname, '..', 'add_password_reset_requests.sql'), 'utf8')

runScript(async (client) => {
  await client.query(sql)

  const result = await client.query(
    `SELECT to_regclass('public.password_reset_requests') AS table_name`
  )

  console.log('완료. 테이블:', result.rows[0].table_name)
})
