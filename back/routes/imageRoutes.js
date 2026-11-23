import { Router } from 'express'
import { uploadProductImage } from '../controllers/imageController.js'
import { protectAdmin } from '../middleware/auth.js'
import { uploadImageBody } from '../middleware/upload.js'

const router = Router()
router.post('/', protectAdmin, uploadImageBody, uploadProductImage)
export default router
