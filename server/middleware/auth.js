const jwt = require('jsonwebtoken');

// Authorization: Bearer <token> 헤더를 검증하고 req.userId에 유저 ID를 넣어주는 미들웨어
function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: '로그인이 필요합니다.' });
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.id;
    req.userType = payload.user_type;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: '로그인이 만료되었습니다. 다시 로그인해주세요.' });
    }
    return res.status(401).json({ message: '유효하지 않은 토큰입니다.' });
  }
}

module.exports = auth;
