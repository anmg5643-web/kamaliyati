import { Router } from 'express'
import { createProduct, deleteProduct, getProductById, listAdminProducts, listProducts, updateProduct } from '../controllers/productController.js'
import { protectAdmin } from '../middleware/auth.js'

const router = Router()
router.get('/admin/all', protectAdmin, listAdminProducts)
router.get('/', listProducts)
router.get('/:id', getProductById)
router.post('/', protectAdmin, createProduct)
router.put('/:id', protectAdmin, updateProduct)
router.delete('/:id', protectAdmin, deleteProduct)
export default router
