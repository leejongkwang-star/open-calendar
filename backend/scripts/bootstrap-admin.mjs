import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// 신규 부서 DB 를 열 때 최초 관리자 1명만 만든다.
// 팀 생성과 구성원 승인은 requireAdmin 이 필요하므로, 관리자가 없으면 아무도 시작할 수 없다.
// prisma/seed.js 와 달리 기본 비밀번호와 샘플 데이터를 만들지 않는다.

const USAGE = `
사용법:
  ADMIN_EMPLOYEE_NUMBER=ADM001 ADMIN_NAME=관리자 ADMIN_PASSWORD=... npm run bootstrap:admin

  또는

  node scripts/bootstrap-admin.mjs --employee-number ADM001 --name 관리자 --password ...

주의: 대상 DB 는 DATABASE_URL 환경변수로 결정된다. 실행 전에 반드시 확인할 것.
`

function parseArgs(argv) {
  const args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const key = argv[i]
    if (!key.startsWith('--')) continue
    const value = argv[i + 1]
    if (!value || value.startsWith('--')) {
      throw new Error(`${key} 옵션의 값이 없습니다`)
    }
    args[key.slice(2)] = value
    i += 1
  }
  return args
}

function resolveInput(args) {
  const employeeNumber = (args['employee-number'] ?? process.env.ADMIN_EMPLOYEE_NUMBER ?? '').trim()
  const name = (args.name ?? process.env.ADMIN_NAME ?? '').trim()
  const password = args.password ?? process.env.ADMIN_PASSWORD ?? ''

  const errors = []
  if (!/^[A-Za-z0-9]{6}$/.test(employeeNumber)) {
    errors.push('사번(employee-number)은 영문/숫자 6자리여야 합니다')
  }
  if (name.length < 2) {
    errors.push('이름(name)은 2자 이상이어야 합니다')
  }
  if (password.length < 8) {
    errors.push('비밀번호(password)는 8자 이상이어야 합니다')
  }

  if (errors.length > 0) {
    throw new Error(`${errors.join('\n  - ')}${USAGE}`)
  }

  return { employeeNumber, name, password }
}

function maskDatabaseUrl(url) {
  return url ? url.replace(/:[^:@/]+@/, ':****@') : '(미설정)'
}

async function main() {
  const { employeeNumber, name, password } = resolveInput(parseArgs(process.argv.slice(2)))

  if (password.length < 12) {
    console.warn('경고: 비밀번호가 12자 미만입니다. 최초 관리자 계정은 더 긴 값을 권장합니다.')
  }

  console.log('대상 DB:', maskDatabaseUrl(process.env.DATABASE_URL))

  const prisma = new PrismaClient()

  try {
    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
      select: { employeeNumber: true, name: true },
    })

    if (existingAdmin) {
      console.error(
        `중단: 이미 관리자가 있습니다 (${existingAdmin.employeeNumber} ${existingAdmin.name}). ` +
          '추가 관리자는 관리자 화면에서 지정하세요.'
      )
      process.exitCode = 1
      return
    }

    const duplicate = await prisma.user.findUnique({
      where: { employeeNumber },
      select: { id: true },
    })

    if (duplicate) {
      console.error(`중단: 사번 ${employeeNumber} 가 이미 사용 중입니다.`)
      process.exitCode = 1
      return
    }

    const admin = await prisma.user.create({
      data: {
        employeeNumber,
        name,
        password: await bcrypt.hash(password, 10),
        role: 'ADMIN',
        status: 'APPROVED',
        approvedAt: new Date(),
      },
      select: { id: true, employeeNumber: true, name: true },
    })

    console.log(`관리자 생성 완료: id=${admin.id} ${admin.employeeNumber} ${admin.name}`)
    console.log('다음 단계: 로그인 후 팀을 만들고 구성원 가입 요청을 승인하세요.')
  } finally {
    await prisma.$disconnect()
  }
}

main().catch((error) => {
  console.error('실패:', error.message)
  process.exit(1)
})
