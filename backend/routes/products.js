const router = require('express').Router();
const Product = require('../models/Product');
const { protect, authorize } = require('../middleware/auth');
const { upload, uploadImageBuffer } = require('../config/cloudinary');

// GET /products — Бараа жагсаалт (нийтэд нээлттэй)
router.get('/', async (req, res) => {
  try {
    const { search, category, seller, creator, limit = 60, page = 1 } = req.query;
    const filter = { isActive: true };
    if (category) filter.category = category;
    if (seller)   filter.seller = seller;
    if (search)   filter.$text = { $search: search };

    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .populate('seller', 'name username store');

    const total = await Product.countDocuments(filter);
    res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /products/:id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('seller', 'name username store');
    if (!product) return res.status(404).json({ message: 'Бараа олдсонгүй' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /products — Бараа нэмэх (seller/admin)
router.post('/', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const product = await Product.create({
      ...req.body,
      seller: req.user._id,
      store: { name: req.user.store?.name || req.user.name, _id: req.user._id },
    });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /products/:id
router.put('/:id', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Бараа олдсонгүй' });
    if (String(product.seller) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Эрх хүрэлцэхгүй' });
    }
    Object.assign(product, req.body);
    await product.save();
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /products/:id
router.delete('/:id', protect, authorize('seller', 'admin'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Бараа олдсонгүй' });
    if (String(product.seller) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Эрх хүрэлцэхгүй' });
    }
    product.isActive = false;
    await product.save();
    res.json({ message: 'Устгагдлаа' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /products/upload — Зураг upload (Cloudinary)
router.post('/upload', protect, authorize('seller', 'admin'), upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'Зураг оруулна уу' });

  try {
    const result = await uploadImageBuffer(req.file.buffer);
    res.json({ url: result.secure_url, public_id: result.public_id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
