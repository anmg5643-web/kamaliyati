import { Router } from 'express'
import { createOrder, listOrders, updateOrderStatus } from '../controllers/orderController.js'
import { protectAdmin } from '../middleware/auth.js'

const router = Router()
router.post('/', createOrder)
router.get('/', protectAdmin, listOrders)
router.put('/:id/status', protectAdmin, updateOrderStatus)
export default router
