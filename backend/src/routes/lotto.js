import express from 'express'
import https from 'https'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 캐시 파일 경로 (backend/data/lotto-history.json)
const DATA_DIR = path.join(__dirname, '..', '..', 'data')
const CACHE_FILE = path.join(DATA_DIR, 'lotto-history.json')

// 데이터를 다시 받아올 최소 간격 (6시간) - 매 요청마다 외부 호출 방지
const REFRESH_INTERVAL_MS = 6 * 60 * 60 * 1000

// 1차 소스: 전체 회차를 한 번에 제공하는 공개 데이터셋 (GitHub Pages)
const ALL_RESULTS_URL = 'https://smok95.github.io/lotto/results/all.json'

// 메모리 캐시
let memoryCache = {
  draws: [], // [{ drwNo, date, numbers: [n1..n6], bonus }]
  updatedAt: 0,
}

// 통계 재계산 결과 캐시 (회차 수 기준 무효화)
let statsCache = null

/** 단순 HTTPS GET (문자열 응답) */
function httpsGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        timeout: 15000,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CalendarApp/1.0)', ...headers },
      },
      (res) => {
        // 리다이렉트 처리 (최대 1회)
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location &&
          !headers._redirected
        ) {
          res.resume()
          httpsGet(res.headers.location, { ...headers, _redirected: true })
            .then(resolve)
            .catch(reject)
          return
        }
        if (res.statusCode !== 200) {
          res.resume()
          reject(new Error(`HTTP ${res.statusCode}`))
          return
        }
        let data = ''
        res.on('data', (chunk) => {
          data += chunk
        })
        res.on('end', () => resolve(data))
      }
    )
    req.on('error', reject)
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('timeout'))
    })
  })
}

/** 공개 데이터셋(all.json)에서 전체 회차 수집 */
async function fetchFromPublicDataset() {
  const raw = await httpsGet(ALL_RESULTS_URL)
  const parsed = JSON.parse(raw)
  if (!Array.isArray(parsed)) throw new Error('invalid dataset')

  const draws = parsed
    .filter((d) => Array.isArray(d.numbers) && d.numbers.length === 6)
    .map((d) => ({
      drwNo: d.draw_no,
      date: typeof d.date === 'string' ? d.date.slice(0, 10) : '',
      numbers: [...d.numbers].sort((a, b) => a - b),
      bonus: d.bonus_no,
    }))
    .sort((a, b) => a.drwNo - b.drwNo)

  return draws
}

/** 보조(폴백) 소스: 동행복권 공식 단일 회차 조회 */
function fetchDrawFromDhlottery(drwNo) {
  const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${drwNo}`
  return httpsGet(url)
    .then((raw) => {
      const json = JSON.parse(raw)
      if (json.returnValue !== 'success') return null
      return {
        drwNo: json.drwNo,
        date: json.drwNoDate,
        numbers: [
          json.drwtNo1,
          json.drwtNo2,
          json.drwtNo3,
          json.drwtNo4,
          json.drwtNo5,
          json.drwtNo6,
        ].sort((a, b) => a - b),
        bonus: json.bnusNo,
      }
    })
    .catch(() => null)
}

function loadCacheFromDisk() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const raw = fs.readFileSync(CACHE_FILE, 'utf-8')
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed.draws)) {
        memoryCache = parsed
      }
    }
  } catch (err) {
    console.error('로또 캐시 로드 실패:', err.message)
  }
}

function saveCacheToDisk() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    fs.writeFileSync(CACHE_FILE, JSON.stringify(memoryCache), 'utf-8')
  } catch (err) {
    console.error('로또 캐시 저장 실패:', err.message)
  }
}

let isUpdating = false

/**
 * 최신 데이터로 캐시를 갱신
 * - 1차: 공개 데이터셋(all.json) 전체 수집
 * - 2차: 실패 시 동행복권으로 최신 회차만 보강 (기존 캐시 유지)
 */
async function ensureUpToDate() {
  if (memoryCache.draws.length === 0) {
    loadCacheFromDisk()
  }

  const isFresh = Date.now() - memoryCache.updatedAt < REFRESH_INTERVAL_MS
  if (isFresh && memoryCache.draws.length > 0) return
  if (isUpdating) return

  isUpdating = true
  try {
    let draws = null
    try {
      draws = await fetchFromPublicDataset()
    } catch (err) {
      console.error('공개 데이터셋 수집 실패, 폴백 시도:', err.message)
    }

    if (draws && draws.length > 0) {
      memoryCache.draws = draws
      memoryCache.updatedAt = Date.now()
      statsCache = null
      saveCacheToDisk()
      return
    }

    // 폴백: 동행복권으로 캐시 이후 회차들을 순차 보강
    if (memoryCache.draws.length > 0) {
      const have = new Set(memoryCache.draws.map((d) => d.drwNo))
      let next = Math.max(...have) + 1
      const additions = []
      // 최대 10회까지만 시도 (무한 루프 방지)
      for (let i = 0; i < 10; i++) {
        const draw = await fetchDrawFromDhlottery(next)
        if (!draw) break
        additions.push(draw)
        next += 1
      }
      if (additions.length > 0) {
        memoryCache.draws = [...memoryCache.draws, ...additions].sort((a, b) => a.drwNo - b.drwNo)
        memoryCache.updatedAt = Date.now()
        statsCache = null
        saveCacheToDisk()
      }
    }
  } catch (err) {
    console.error('로또 데이터 갱신 실패:', err.message)
  } finally {
    isUpdating = false
  }
}

/** 수집된 전체 회차로 통계 계산 */
function computeStats() {
  const draws = memoryCache.draws
  if (statsCache && statsCache._drawCount === draws.length) {
    return statsCache
  }

  const total = draws.length
  const frequency = Array.from({ length: 46 }, () => 0)
  const lastSeenDrawNo = Array.from({ length: 46 }, () => 0)
  const RECENT_WINDOW = 50
  const recentFrequency = Array.from({ length: 46 }, () => 0)

  const sums = []
  let oddTotal = 0
  let evenTotal = 0

  const latestDrawNo = total > 0 ? draws[draws.length - 1].drwNo : 0

  for (const d of draws) {
    let sum = 0
    for (const num of d.numbers) {
      frequency[num] += 1
      lastSeenDrawNo[num] = d.drwNo
      sum += num
      if (num % 2 === 0) evenTotal += 1
      else oddTotal += 1
    }
    sums.push(sum)
    if (d.drwNo > latestDrawNo - RECENT_WINDOW) {
      for (const num of d.numbers) recentFrequency[num] += 1
    }
  }

  const numberStats = []
  for (let n = 1; n <= 45; n++) {
    numberStats.push({
      number: n,
      count: frequency[n],
      recentCount: recentFrequency[n],
      // 마지막 출현 이후 경과한 회차 수 (미출현 기간)
      gap: lastSeenDrawNo[n] > 0 ? latestDrawNo - lastSeenDrawNo[n] : latestDrawNo,
      lastSeenDrawNo: lastSeenDrawNo[n],
    })
  }

  const avgSum = sums.length > 0 ? sums.reduce((a, b) => a + b, 0) / sums.length : 0

  statsCache = {
    _drawCount: total,
    totalDraws: total,
    latestDraw: total > 0 ? draws[draws.length - 1] : null,
    numberStats,
    oddEven: { odd: oddTotal, even: evenTotal },
    sum: {
      avg: Math.round(avgSum * 10) / 10,
      min: sums.length ? Math.min(...sums) : 0,
      max: sums.length ? Math.max(...sums) : 0,
    },
    updatedAt: memoryCache.updatedAt,
  }
  return statsCache
}

// GET /api/lotto/stats - 통계 데이터 (번호 생성에 필요한 모든 정보)
router.get('/stats', async (req, res, next) => {
  try {
    await ensureUpToDate()
    const stats = computeStats()
    if (stats.totalDraws === 0) {
      return res.status(503).json({
        message: '로또 당첨 데이터를 아직 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
      })
    }
    res.json(stats)
  } catch (err) {
    next(err)
  }
})

// GET /api/lotto/latest - 최신 회차 정보
router.get('/latest', async (req, res, next) => {
  try {
    await ensureUpToDate()
    const draws = memoryCache.draws
    if (draws.length === 0) {
      return res.status(503).json({ message: '데이터를 불러오는 중입니다.' })
    }
    res.json(draws[draws.length - 1])
  } catch (err) {
    next(err)
  }
})

// 서버 시작 시 백그라운드로 데이터 미리 수집
loadCacheFromDisk()
ensureUpToDate()

export default router
