import { Router } from 'express'
import { createProduct, deleteProduct, getProductById, listAdminProducts, listProducts, updateProduct } from '../controllers/productController.js'
import { createCategory, deleteCategory, listCategories, updateCategory } from '../controllers/categoryController.js'
import { protectAdmin } from '../middleware/auth.js'

const router = Router()
// مسارات الأقسام لازم تجي قبل '/:id'
router.get('/categories', listCategories)
router.post('/categories', protectAdmin, createCategory)
router.put('/categories/:slug', protectAdmin, updateCategory)
router.delete('/categories/:slug', protectAdmin, deleteCategory)
router.get('/admin/all', protectAdmin, listAdminProducts)
router.get('/', listProducts)
router.get('/:id', getProductById)
router.post('/', protectAdmin, createProduct)
router.put('/:id', protectAdmin, updateProduct)
router.delete('/:id', protectAdmin, deleteProduct)
export default router