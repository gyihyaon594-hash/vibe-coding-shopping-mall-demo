const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 유효하지 않은 ObjectId로 조회 시 500 대신 400을 주기 위한 헬퍼
function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// 유저 생성 — POST /api/users
async function createUser(req, res) {
  try {
    const { email, name, password, user_type, address } = req.body;
    const user = await User.create({ email, name, password, user_type, address });

    const result = user.toObject();
    delete result.password;
    res.status(201).json(result);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
}

// 로그인 — POST /api/users/login
async function loginUser(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: '이메일과 비밀번호를 입력해주세요.' });
  }

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });

  // 이메일이 틀렸는지 비밀번호가 틀렸는지 알려주지 않는 것이 보안상 안전
  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ message: '이메일 또는 비밀번호가 올바르지 않습니다.' });
  }

  // 토큰에는 민감 정보 없이 식별에 필요한 최소 정보만 담는다
  const token = jwt.sign(
    { id: user._id, user_type: user.user_type },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  const result = user.toObject();
  delete result.password;
  res.json({ message: '로그인 성공', token, user: result });
}

// 내 정보 조회 — GET /api/users/me (auth 미들웨어가 토큰을 검증해 req.userId를 넣어줌)
async function getMe(req, res) {
  const user = await User.findById(req.userId).select('-password');
  if (!user) {
    return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
  }
  res.json(user);
}

// 유저 목록 조회 — GET /api/users
async function getUsers(req, res) {
  const users = await User.find().select('-password').sort({ createdAt: -1 });
  res.json(users);
}

// 유저 단건 조회 — GET /api/users/:id
async function getUserById(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: '유효하지 않은 ID입니다.' });
  }

  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
  }
  res.json(user);
}

// 유저 수정 — PUT /api/users/:id
async function updateUser(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: '유효하지 않은 ID입니다.' });
  }

  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
    }

    // 전달된 필드만 반영 후 save() — 비밀번호 해싱 훅과 스키마 검증이 함께 실행됨
    const { email, name, password, user_type, address } = req.body;
    if (email !== undefined) user.email = email;
    if (name !== undefined) user.name = name;
    if (password !== undefined) user.password = password;
    if (user_type !== undefined) user.user_type = user_type;
    if (address !== undefined) user.address = address;
    await user.save();

    const result = user.toObject();
    delete result.password;
    res.json(result);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: '이미 사용 중인 이메일입니다.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
}

// 유저 삭제 — DELETE /api/users/:id
async function deleteUser(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: '유효하지 않은 ID입니다.' });
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    return res.status(404).json({ message: '유저를 찾을 수 없습니다.' });
  }
  res.json({ message: '삭제되었습니다.', id: user._id });
}

module.exports = {
  createUser,
  loginUser,
  getMe,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
};
