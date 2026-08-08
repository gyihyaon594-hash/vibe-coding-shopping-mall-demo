const mongoose = require('mongoose');

const ORDER_STATUS = [
  'pending', // 결제 대기
  'paid', // 주문확인
  'preparing', // 상품준비중
  'shipped', // 배송시작
  'delivering', // 배송중
  'delivered', // 배송완료
  'cancelled', // 주문취소
];
const PAYMENT_METHODS = ['card', 'bank', 'kakao', 'naver'];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
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

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      validate: {
        validator(items) {
          return Array.isArray(items) && items.length > 0;
        },
        message: '주문 상품이 1개 이상 필요합니다.',
      },
    },
    totalQuantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ORDER_STATUS,
      default: 'pending',
    },
    shippingInfo: {
      name: {
        type: String,
        required: true,
        trim: true,
      },
      phone: {
        type: String,
        required: true,
        trim: true,
      },
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      address: {
        type: String,
        required: true,
        trim: true,
      },
      addressDetail: {
        type: String,
        trim: true,
        default: '',
      },
      zipCode: {
        type: String,
        trim: true,
        default: '',
      },
      deliveryRequest: {
        type: String,
        trim: true,
        default: '',
      },
    },
    paymentInfo: {
      method: {
        type: String,
        enum: PAYMENT_METHODS,
        required: true,
      },
      // 포트원 V2 결제 ID (상점에서 발급한 paymentId)
      paymentId: {
        type: String,
        trim: true,
        default: '',
      },
      // 포트원 V2 결제 거래 고유번호 (txId)
      txId: {
        type: String,
        trim: true,
        default: '',
      },
    },
  },
  { timestamps: true }
);

// 같은 결제(paymentId)로 주문이 두 번 생성되는 것을 DB 차원에서 차단
orderSchema.index(
  { 'paymentInfo.paymentId': 1 },
  {
    unique: true,
    partialFilterExpression: {
      'paymentInfo.paymentId': { $exists: true, $gt: '' },
    },
  }
);

orderSchema.methods.calculateTotals = function () {
  this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
  this.totalPrice = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  return this;
};

orderSchema.pre('validate', function () {
  this.calculateTotals();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
module.exports.ORDER_STATUS = ORDER_STATUS;
module.exports.PAYMENT_METHODS = PAYMENT_METHODS;
