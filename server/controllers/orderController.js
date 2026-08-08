const Order = require('../models/Order');
const { ORDER_STATUS, PAYMENT_METHODS } = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const mongoose = require('mongoose');
const { getPayment } = require('../utils/portone');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function createOrderNumber() {
  const now = new Date();
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('');
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${date}-${random}`;
}

function populateOrder(query) {
  return query
    .populate('user', '-password')
    .populate('items.product');
}

// 주문 생성 — POST /api/orders
// body: { shippingInfo, paymentInfo, clearCart? }
async function createOrder(req, res) {
  try {
    const { shippingInfo, paymentInfo, clearCart = true } = req.body;

    if (!shippingInfo?.name || !shippingInfo?.phone || !shippingInfo?.email || !shippingInfo?.address) {
      return res.status(400).json({
        message: '받는 분, 전화번호, 이메일, 기본 주소를 모두 입력해주세요.',
      });
    }

    if (!paymentInfo?.method || !PAYMENT_METHODS.includes(paymentInfo.method)) {
      return res.status(400).json({
        message: '결제 수단을 선택해주세요. (card, bank, kakao, naver)',
      });
    }

    // 포트원 V2 결제 완료 후 전달되는 결제 ID
    const paymentId = paymentInfo.paymentId?.trim();
    if (!paymentId) {
      return res.status(400).json({ message: '결제 정보(paymentId)가 없습니다.' });
    }

    // 1) 더블주문 확인 — 같은 결제로 이미 생성된 주문이 있는지
    const duplicate = await Order.findOne({ 'paymentInfo.paymentId': paymentId });
    if (duplicate) {
      return res.status(409).json({
        message: '이미 처리된 결제입니다.',
        orderNumber: duplicate.orderNumber,
      });
    }

    const cart = await Cart.findOne({ user: req.userId });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: '장바구니가 비어 있습니다.' });
    }

    for (const item of cart.items) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(400).json({
          message: '장바구니에 존재하지 않는 상품이 포함되어 있습니다.',
        });
      }
    }

    // 2) 결제 확인 — 포트원 API로 실제 결제 상태·금액 검증
    const payment = await getPayment(paymentId);
    console.log('[결제 검증]', {
      paymentId,
      found: Boolean(payment),
      status: payment?.status,
      paidAmount: payment?.amount?.total,
      cartTotal: cart.totalPrice,
    });
    if (!payment) {
      return res.status(400).json({ message: '존재하지 않는 결제입니다.' });
    }
    if (payment.status !== 'PAID') {
      return res.status(400).json({
        message: `결제가 완료되지 않았습니다. (상태: ${payment.status})`,
      });
    }
    if (payment.amount?.total !== cart.totalPrice) {
      return res.status(400).json({
        message: '결제 금액이 주문 금액과 일치하지 않습니다.',
      });
    }

    // 3) 검증 통과 → 주문 데이터 생성
    const order = await Order.create({
      user: req.userId,
      orderNumber: createOrderNumber(),
      items: cart.items.map((item) => ({
        product: item.product,
        price: item.price,
        quantity: item.quantity,
      })),
      shippingInfo: {
        name: String(shippingInfo.name).trim(),
        phone: String(shippingInfo.phone).trim(),
        email: String(shippingInfo.email).trim().toLowerCase(),
        address: String(shippingInfo.address).trim(),
        addressDetail: shippingInfo.addressDetail
          ? String(shippingInfo.addressDetail).trim()
          : '',
        zipCode: shippingInfo.zipCode ? String(shippingInfo.zipCode).trim() : '',
        deliveryRequest: shippingInfo.deliveryRequest
          ? String(shippingInfo.deliveryRequest).trim()
          : '',
      },
      paymentInfo: {
        method: paymentInfo.method,
        paymentId,
        txId: paymentInfo.txId ? String(paymentInfo.txId).trim() : '',
      },
      // 포트원 API로 결제 완료(PAID)를 확인한 뒤 생성되므로 paid로 저장
      status: 'paid',
    });

    if (clearCart) {
      cart.items = [];
      cart.calculateTotals();
      await cart.save();
    }

    const populated = await populateOrder(Order.findById(order._id));
    res.status(201).json(populated);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: '이미 처리된 결제이거나 주문번호가 중복되었습니다.',
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('createOrder error:', error);
    return res.status(500).json({ message: '주문 생성에 실패했습니다.' });
  }
}

// 주문 목록 조회 — GET /api/orders
// 관리자: 전체 / 일반 유저: 본인 주문만
async function getOrders(req, res) {
  try {
    const filter = req.userType === 'admin' ? {} : { user: req.userId };
    if (req.query.status) {
      filter.status = req.query.status;
    }

    const orders = await populateOrder(
      Order.find(filter).sort({ createdAt: -1 })
    );
    res.json(orders);
  } catch (error) {
    console.error('getOrders error:', error);
    return res.status(500).json({ message: '주문 목록을 불러오지 못했습니다.' });
  }
}

// 주문 단건 조회 — GET /api/orders/:id
async function getOrderById(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: '유효하지 않은 주문 ID입니다.' });
    }

    const order = await populateOrder(Order.findById(req.params.id));
    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    if (req.userType !== 'admin' && String(order.user._id || order.user) !== String(req.userId)) {
      return res.status(403).json({ message: '본인 주문만 조회할 수 있습니다.' });
    }

    res.json(order);
  } catch (error) {
    console.error('getOrderById error:', error);
    return res.status(500).json({ message: '주문을 불러오지 못했습니다.' });
  }
}

// 주문 수정 — PUT /api/orders/:id
// body: { status?, shippingInfo? }
async function updateOrder(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: '유효하지 않은 주문 ID입니다.' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    const isOwner = String(order.user) === String(req.userId);
    const isAdmin = req.userType === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: '주문을 수정할 권한이 없습니다.' });
    }

    const { status, shippingInfo } = req.body;

    if (status !== undefined) {
      if (!ORDER_STATUS.includes(status)) {
        return res.status(400).json({
          message: `status는 ${ORDER_STATUS.join(', ')} 중 하나여야 합니다.`,
        });
      }
      // 상태 변경은 관리자만, 본인은 cancelled만 가능
      if (!isAdmin && status !== 'cancelled') {
        return res.status(403).json({ message: '주문 취소만 가능합니다.' });
      }
      if (!isAdmin && order.status !== 'pending') {
        return res.status(400).json({ message: '대기 중인 주문만 취소할 수 있습니다.' });
      }
      order.status = status;
    }

    if (shippingInfo !== undefined) {
      if (!isAdmin && order.status !== 'pending') {
        return res.status(400).json({ message: '대기 중인 주문만 배송 정보를 수정할 수 있습니다.' });
      }
      if (shippingInfo.name !== undefined) order.shippingInfo.name = String(shippingInfo.name).trim();
      if (shippingInfo.phone !== undefined) order.shippingInfo.phone = String(shippingInfo.phone).trim();
      if (shippingInfo.email !== undefined) {
        order.shippingInfo.email = String(shippingInfo.email).trim().toLowerCase();
      }
      if (shippingInfo.address !== undefined) {
        order.shippingInfo.address = String(shippingInfo.address).trim();
      }
      if (shippingInfo.addressDetail !== undefined) {
        order.shippingInfo.addressDetail = String(shippingInfo.addressDetail).trim();
      }
      if (shippingInfo.zipCode !== undefined) {
        order.shippingInfo.zipCode = String(shippingInfo.zipCode).trim();
      }
      if (shippingInfo.deliveryRequest !== undefined) {
        order.shippingInfo.deliveryRequest = String(shippingInfo.deliveryRequest).trim();
      }
    }

    await order.save();
    const populated = await populateOrder(Order.findById(order._id));
    res.json(populated);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('updateOrder error:', error);
    return res.status(500).json({ message: '주문 수정에 실패했습니다.' });
  }
}

// 주문 삭제 — DELETE /api/orders/:id (관리자만)
async function deleteOrder(req, res) {
  try {
    if (!isValidId(req.params.id)) {
      return res.status(400).json({ message: '유효하지 않은 주문 ID입니다.' });
    }

    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) {
      return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    res.json({ message: '주문이 삭제되었습니다.', id: order._id });
  } catch (error) {
    console.error('deleteOrder error:', error);
    return res.status(500).json({ message: '주문 삭제에 실패했습니다.' });
  }
}

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
};
