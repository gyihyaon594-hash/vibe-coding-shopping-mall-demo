const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

async function getCartWithDetails(userId) {
  let cart = await Cart.findByUserWithDetails(userId);
  if (!cart) {
    await Cart.create({ user: userId, items: [] });
    cart = await Cart.findByUserWithDetails(userId);
  }
  return cart;
}

// 내 장바구니 조회 — GET /api/carts
async function getCart(req, res) {
  try {
    const cart = await getCartWithDetails(req.userId);
    res.json(cart);
  } catch (error) {
    console.error('getCart error:', error);
    return res.status(500).json({ message: '장바구니를 불러오지 못했습니다.' });
  }
}

// 장바구니에 상품 추가 — POST /api/carts/items
// body: { productId, quantity? }
async function addCartItem(req, res) {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId || !isValidId(productId)) {
      return res.status(400).json({ message: '유효한 상품 ID가 필요합니다.' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    const cart = await getOrCreateCart(req.userId);
    await cart.addItem(product._id, product.price, quantity);

    const populated = await Cart.findByUserWithDetails(req.userId);
    res.status(201).json(populated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('addCartItem error:', error);
    return res.status(500).json({ message: '장바구니 추가에 실패했습니다.' });
  }
}

// 장바구니 상품 수량 변경 — PUT /api/carts/items/:productId
// body: { quantity }
async function updateCartItem(req, res) {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!isValidId(productId)) {
      return res.status(400).json({ message: '유효하지 않은 상품 ID입니다.' });
    }

    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: '장바구니가 없습니다.' });
    }

    await cart.updateItem(productId, quantity);
    const populated = await Cart.findByUserWithDetails(req.userId);
    res.json(populated);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ message: error.message });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('updateCartItem error:', error);
    return res.status(500).json({ message: '장바구니 수정에 실패했습니다.' });
  }
}

// 장바구니에서 상품 삭제 — DELETE /api/carts/items/:productId
async function removeCartItem(req, res) {
  try {
    const { productId } = req.params;

    if (!isValidId(productId)) {
      return res.status(400).json({ message: '유효하지 않은 상품 ID입니다.' });
    }

    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: '장바구니가 없습니다.' });
    }

    const before = cart.items.length;
    cart.items = cart.items.filter(
      (item) => String(item.product) !== String(productId)
    );

    if (cart.items.length === before) {
      return res.status(404).json({ message: '장바구니에 해당 상품이 없습니다.' });
    }

    cart.calculateTotals();
    await cart.save();

    const populated = await Cart.findByUserWithDetails(req.userId);
    res.json(populated);
  } catch (error) {
    console.error('removeCartItem error:', error);
    return res.status(500).json({ message: '장바구니 삭제에 실패했습니다.' });
  }
}

// 장바구니 비우기 — DELETE /api/carts
async function clearCart(req, res) {
  try {
    const cart = await Cart.findOne({ user: req.userId });
    if (!cart) {
      return res.status(404).json({ message: '장바구니가 없습니다.' });
    }

    cart.items = [];
    cart.calculateTotals();
    await cart.save();

    const populated = await Cart.findByUserWithDetails(req.userId);
    res.json(populated);
  } catch (error) {
    console.error('clearCart error:', error);
    return res.status(500).json({ message: '장바구니 비우기에 실패했습니다.' });
  }
}

module.exports = {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
};
