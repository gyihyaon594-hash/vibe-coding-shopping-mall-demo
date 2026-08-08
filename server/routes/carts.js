const express = require('express');
const {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require('../controllers/cartController');
const auth = require('../middleware/auth'); // JWT 인증 (Authorization: Bearer <token>)

const router = express.Router();

// GET    /api/carts                    — 내 장바구니 조회
// POST   /api/carts/items              — 상품 추가
// PUT    /api/carts/items/:productId   — 수량 변경
// DELETE /api/carts/items/:productId   — 상품 삭제
// DELETE /api/carts                    — 장바구니 비우기
router.get('/', auth, getCart);
router.post('/items', auth, addCartItem);
router.put('/items/:productId', auth, updateCartItem);
router.delete('/items/:productId', auth, removeCartItem);
router.delete('/', auth, clearCart);

module.exports = router;
