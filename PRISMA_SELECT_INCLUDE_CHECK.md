# Prisma select/include 동시 사용 오류 확인 결과

## ✅ 확인 완료

전체 코드베이스를 검토한 결과, **동일한 오류는 없습니다.**

## 📋 확인한 파일들

### 1. `backend/src/routes/events.js`

#### ✅ 정상 (245줄)
```javascript
include: {
  user: {
    select: { ... }  // ✅ include 안에서 select 사용은 정상
  },
  team: {
    select: { ... }  // ✅ include 안에서 select 사용은 정상
  }
}
```

#### ✅ 정상 (492줄)
```javascript
include: {
  user: {
    select: { ... }  // ✅ 정상
  },
  team: {
    select: { ... }  // ✅ 정상
  }
}
```

#### ✅ 정상 (702줄)
```javascript
include: {
  user: {
    select: { ... }  // ✅ 정상
  },
  team: {
    select: { ... }  // ✅ 정상
  }
}
```

#### ✅ 수정 완료 (56줄)
```javascript
include: {
  user: {
    select: {
      id: true,
      name: true,
      employeeNumber: true,
      teams: {  // ✅ select 내부에 관계 포함
        select: {
          phone: true,
          teamId: true,
        },
        take: 1,
      },
    },
  },
}
```

### 2. `backend/src/routes/auth.js`

#### ✅ 정상 (413줄)
```javascript
select: {
  id: true,
  name: true,
  teams: {
    select: { ... }  // ✅ select 내부에 관계 포함은 정상
  }
}
```

### 3. `backend/src/routes/teams.js`

#### ✅ 정상 (41줄, 75줄)
```javascript
include: {
  _count: {
    select: { ... }  // ✅ include 안에서 _count.select는 정상
  }
}
```

## 🔍 Prisma 규칙

### ❌ 잘못된 사용 (오류 발생)
```javascript
user: {
  select: { id: true },
  include: { teams: true }  // ❌ 같은 레벨에서 select와 include 동시 사용 불가
}
```

### ✅ 올바른 사용
```javascript
// 방법 1: include 안에서 select 사용
include: {
  user: {
    select: { id: true }  // ✅ 정상
  }
}

// 방법 2: select 안에서 관계 포함
select: {
  id: true,
  user: {
    select: { id: true }  // ✅ 정상
  }
}

// 방법 3: include만 사용
include: {
  user: true  // ✅ 정상
}
```

## ✅ 결론

**모든 Prisma 쿼리가 올바르게 작성되어 있습니다.**

- `events.js` 56줄: 이미 수정 완료 ✅
- 다른 모든 쿼리: 정상 ✅

추가 수정이 필요하지 않습니다.

