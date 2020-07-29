import express from 'express'
import { File } from '../models'

const router = express.Router()

router.get('/images/:id', async (req, res) => {
  const { base64, type } = await File.findById(req.params.id).exec()
  const file = Buffer.from(base64, 'base64')
  res.writeHead(200, {
    'Content-Type': type,
    'Content-Length': file.length
  })
  res.end(file)
})

export default router