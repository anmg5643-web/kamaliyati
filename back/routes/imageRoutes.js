import { Router } from 'express'
import { getImage, uploadProductImage } from '../controllers/imageController.js'
import { protectAdmin } from '../middleware/auth.js'
import { uploadImageBody } from '../middleware/upload.js'

const router = Router()
router.get('/:id', getImage)
router.post('/', protectAdmin, uploadImageBody, uploadProductImage)
export default router