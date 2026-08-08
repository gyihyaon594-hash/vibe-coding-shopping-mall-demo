const express = require('express');
const {
  createUser,
  loginUser,
  getMe,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/login', loginUser);
router.post('/', createUser);
router.get('/', getUsers);
// '/:id'보다 먼저 선언해야 'me'가 id로 해석되지 않음
router.get('/me', auth, getMe);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

module.exports = router;
