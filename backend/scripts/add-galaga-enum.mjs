import { runScript } from './db.mjs'

const sql = `ALTER TYPE "GameType" ADD VALUE IF NOT EXISTS 'GALAGA'`

runScript(async (client) => {
  await client.query(sql)

  const result = await client.query(`
    SELECT e.enumlabel
    FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'GameType'
    ORDER BY e.enumsortorder
  `)

  console.log('완료. GameType:', result.rows.map((row) => row.enumlabel).join(','))
})
