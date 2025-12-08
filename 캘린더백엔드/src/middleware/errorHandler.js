// 에러 핸들링 미들웨어
export const errorHandler = (err, req, res, next) => {
  console.error('에러 발생:', err)

  // Prisma 에러 처리
  if (err.code === 'P2002') {
    return res.status(409).json({
      message: '이미 존재하는 데이터입니다.',
      field: err.meta?.target?.[0],
    })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      message: '요청한 데이터를 찾을 수 없습니다.',
    })
  }

  // Validation 에러
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: '입력 데이터가 유효하지 않습니다.',
      errors: err.errors,
    })
  }

  // 기본 에러
  const statusCode = err.statusCode || 500
  const message = err.message || '서버 오류가 발생했습니다.'

  res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}

