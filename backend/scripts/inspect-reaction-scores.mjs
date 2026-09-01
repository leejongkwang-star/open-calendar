// 반응속도(REACTION) 랭킹 데이터를 조회만 한다. 아무것도 변경하지 않는다.
import { runScript } from './db.mjs'

// 사람의 단순 반응 속도 하한은 대략 0.15초로 알려져 있다.
// 그보다 빠른 기록은 대기 화면에서 연타해 얻은 값으로 본다.
const HUMAN_FLOOR = 0.15

runScript(async (client) => {
  const { rows } = await client.query(`
    SELECT g.id, g.score, g."createdAt", u.name, u."employeeNumber"
    FROM game_scores g
    JOIN users u ON u.id = g."userId"
    WHERE g."gameType" = 'REACTION'
    ORDER BY g.score ASC
  `)

  if (rows.length === 0) {
    console.log('REACTION 기록 없음')
    return
  }

  console.log(`REACTION 기록 ${rows.length}건\n`)
  console.log('순위  점수(초)  판정        직원번호  이름        기록일시')
  rows.forEach((r, i) => {
    const score = Number(r.score)
    const verdict = score < HUMAN_FLOOR ? '비정상' : '정상'
    console.log(
      `${String(i + 1).padStart(3)}   ${score.toFixed(3).padStart(7)}  ${verdict.padEnd(10)}  ${String(r.employeeNumber).padEnd(8)}  ${String(r.name).padEnd(10)}  ${new Date(r.createdAt).toISOString()}`
    )
  })

  const suspicious = rows.filter((r) => Number(r.score) < HUMAN_FLOOR).length
  console.log(`\n합계 ${rows.length}건 중 ${HUMAN_FLOOR}초 미만 ${suspicious}건`)
})
