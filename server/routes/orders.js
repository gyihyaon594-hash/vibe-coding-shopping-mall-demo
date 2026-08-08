const express = require('express');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
} = require('../controllers/orderController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// POST   /api/orders       — 장바구니 기반 주문 생성
// GET    /api/orders       — 주문 목록 (본인 / 관리자는 전체)
// GET    /api/orders/:id   — 주문 단건 조회
// PUT    /api/orders/:id   — 주문 수정 (상태·배송정보)
// DELETE /api/orders/:id   — 주문 삭제 (관리자만)
router.post('/', auth, createOrder);
router.get('/', auth, getOrders);
router.get('/:id', auth, getOrderById);
router.put('/:id', auth, updateOrder);
router.delete('/:id', auth, adminOnly, deleteOrder);

module.exports = router;
