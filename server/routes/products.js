const express = require('express');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const auth = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');

const router = express.Router();

// 조회는 누구나 가능
// GET /api/products?page=1&limit=2&category=임상가 과정
// GET /api/products?all=true  → 전체 상품
router.get('/', getProducts);
router.get('/:id', getProductById);

// 생성/수정/삭제는 관리자만 가능
router.post('/', auth, adminOnly, createProduct);
router.put('/:id', auth, adminOnly, updateProduct);
router.delete('/:id', auth, adminOnly, deleteProduct);

module.exports = router;
