// 반응속도(REACTION) 랭킹 데이터를 전부 삭제한다.
// 실수 실행을 막기 위해 CONFIRM=DELETE 환경변수가 있어야 실제로 지운다.
import { runScript } from './db.mjs'

const confirmed = process.env.CONFIRM === 'DELETE'

runScript(async (client) => {
  const { rows: before } = await client.query(
    `SELECT COUNT(*)::int AS n FROM game_scores WHERE "gameType" = 'REACTION'`
  )
  console.log(`삭제 대상 REACTION 기록: ${before[0].n}건`)

  if (!confirmed) {
    console.log('CONFIRM=DELETE 가 없어 실제 삭제는 하지 않았습니다 (미리보기)')
    return
  }

  const result = await client.query(`DELETE FROM game_scores WHERE "gameType" = 'REACTION'`)
  console.log(`삭제 완료: ${result.rowCount}건`)

  const { rows: after } = await client.query(
    `SELECT COUNT(*)::int AS n FROM game_scores WHERE "gameType" = 'REACTION'`
  )
  console.log(`남은 REACTION 기록: ${after[0].n}건`)

  const { rows: others } = await client.query(
    `SELECT "gameType", COUNT(*)::int AS n FROM game_scores GROUP BY "gameType" ORDER BY "gameType"`
  )
  console.log('\n다른 게임 기록은 그대로인지 확인:')
  others.forEach((r) => console.log(`  ${r.gameType.padEnd(20)} ${r.n}건`))
})
