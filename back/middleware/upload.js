import express from 'express'

export const uploadImageBody = express.raw({ type: 'application/octet-stream', limit: '8mb' })
