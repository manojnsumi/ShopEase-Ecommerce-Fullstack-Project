/**
 * src/routes/index.js
 * Mounts every controller (each one is an express.Router)
 * under the /api prefix used by server.js.
 */
const router = require('express').Router();

router.use('/auth', require('../controllers/authController'));
router.use('/users', require('../controllers/userController'));
router.use('/products', require('../controllers/productController'));
router.use('/categories', require('../controllers/categoryController'));
router.use('/cart', require('../controllers/cartController'));
router.use('/wishlist', require('../controllers/wishlistController'));
router.use('/orders', require('../controllers/orderController'));
router.use('/payments', require('../controllers/paymentController'));
router.use('/reviews', require('../controllers/reviewController'));
router.use('/coupons', require('../controllers/couponController'));
router.use('/notifications', require('../controllers/notificationController'));
router.use('/search', require('../controllers/searchController'));
router.use('/support', require('../controllers/supportController'));
router.use('/admin', require('../controllers/adminController'));

module.exports = router;
