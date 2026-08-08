const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    // 장바구니에 담을 당시의 가격 (상품 가격 변경과 무관하게 유지)
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [cartItemSchema],
      default: [],
    },
    totalQuantity: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// 사용자당 장바구니 하나
cartSchema.index({ user: 1 }, { unique: true });

// 총 금액 · 총 수량 계산
cartSchema.methods.calculateTotals = function () {
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalPrice = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  return this;
};

// 아이템 추가 후 총계를 다시 계산하고 저장
cartSchema.methods.addItem = async function (productId, price, quantity = 1) {
  const qty = Math.max(1, Number(quantity) || 1);
  const existing = this.items.find(
    (item) => String(item.product) === String(productId)
  );

  if (existing) {
    existing.quantity += qty;
    existing.price = price;
  } else {
    this.items.push({ product: productId, price, quantity: qty });
  }

  this.calculateTotals();
  return this.save();
};

// 아이템 수량 업데이트 후 총계를 다시 계산하고 저장
cartSchema.methods.updateItem = async function (productId, quantity) {
  const item = this.items.find(
    (entry) => String(entry.product) === String(productId)
  );

  if (!item) {
    const error = new Error('장바구니에 해당 상품이 없습니다.');
    error.status = 404;
    throw error;
  }

  const qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 1) {
    const error = new Error('수량은 1 이상이어야 합니다.');
    error.status = 400;
    throw error;
  }

  item.quantity = qty;
  this.calculateTotals();
  return this.save();
};

// 저장 직전에 총계 자동 계산
cartSchema.pre('save', function () {
  this.calculateTotals();
});

// 상품 · 사용자 정보를 함께 조회
cartSchema.statics.findByUserWithDetails = function (userId) {
  return this.findOne({ user: userId })
    .populate('user', '-password')
    .populate('items.product');
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
