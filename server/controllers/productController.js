const mongoose = require('mongoose');
const Product = require('../models/Product');

function isValidId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// 상품 생성 — POST /api/products (관리자만, ProductCreatePage와 동일한 필드)
async function createProduct(req, res) {
  try {
    const { sku, name, price, category, image, description } = req.body;

    if (!sku || !String(sku).trim()) {
      return res.status(400).json({ message: 'SKU를 입력해주세요.' });
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: '상품명을 입력해주세요.' });
    }
    if (price === undefined || price === null || price === '' || Number.isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ message: '판매가격을 올바르게 입력해주세요.' });
    }
    if (!category) {
      return res.status(400).json({ message: '카테고리를 선택해주세요.' });
    }
    if (!image || !String(image).trim()) {
      return res.status(400).json({ message: '메인 이미지를 업로드해주세요.' });
    }

    const product = await Product.create({
      sku: String(sku).trim(),
      name: String(name).trim(),
      price: Number(price),
      category,
      image: String(image).trim(),
      description: description ? String(description).trim() : undefined,
    });

    res.status(201).json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: '이미 사용 중인 SKU입니다.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('createProduct error:', error);
    return res.status(500).json({ message: '상품 등록에 실패했습니다.' });
  }
}

// 상품 목록 조회 — GET /api/products
// query: ?page=1&limit=2&category=임상가 과정
//        ?all=true  → 전체 상품 (페이지네이션 없이)
async function getProducts(req, res) {
  try {
    const filter = {};
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const wantAll = req.query.all === 'true' || req.query.all === '1';

    if (wantAll) {
      const products = await Product.find(filter).sort({ createdAt: -1 });
      return res.json({
        products,
        pagination: {
          page: 1,
          limit: products.length,
          total: products.length,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      });
    }

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 2);
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    const totalPages = Math.max(1, Math.ceil(total / limit));

    res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('getProducts error:', error);
    return res.status(500).json({ message: '상품 목록을 불러오지 못했습니다.' });
  }
}

// 상품 단건 조회 — GET /api/products/:id
async function getProductById(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: '유효하지 않은 ID입니다.' });
  }

  const product = await Product.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
  }
  res.json(product);
}

// 상품 수정 — PUT /api/products/:id
async function updateProduct(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: '유효하지 않은 ID입니다.' });
  }

  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
    }

    const { sku, name, price, category, image, description } = req.body;
    if (sku !== undefined) product.sku = sku;
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (image !== undefined) product.image = image;
    if (description !== undefined) product.description = description;

    await product.save();
    res.json(product);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: '이미 사용 중인 SKU입니다.' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    throw error;
  }
}

// 상품 삭제 — DELETE /api/products/:id
async function deleteProduct(req, res) {
  if (!isValidId(req.params.id)) {
    return res.status(400).json({ message: '유효하지 않은 ID입니다.' });
  }

  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) {
    return res.status(404).json({ message: '상품을 찾을 수 없습니다.' });
  }
  res.json({ message: '삭제되었습니다.', id: product._id });
}

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};
