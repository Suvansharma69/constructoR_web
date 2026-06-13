import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadDir = path.join(__dirname, '../../uploads')
const dirs = ['profiles', 'materials', 'projects', 'portfolios']
dirs.forEach(dir => {
  const fullPath = path.join(uploadDir, dir)
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true })
})

// Allowed file extensions — defense-in-depth against MIME spoofing
const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const ALLOWED_DOC_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf'])

// Allowed MIME types
const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const ALLOWED_DOC_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'])

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = 'profiles'
    if (req.path.includes('material')) folder = 'materials'
    else if (req.path.includes('project')) folder = 'projects'
    else if (req.path.includes('portfolio')) folder = 'portfolios'
    cb(null, path.join(uploadDir, folder))
  },
  filename: (req, file, cb) => {
    // Only allow safe file extensions — strip all special characters
    const ext = path.extname(file.originalname).toLowerCase()
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    // Never use original filename — generate a safe random one
    cb(null, `${uniqueSuffix}${ext}`)
  },
})

// Double-check: validate BOTH mimetype AND file extension
// Prevents MIME spoofing (attacker sends PHP with image mimetype)
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase()
  const mimeOk = ALLOWED_IMAGE_MIMES.has(file.mimetype)
  const extOk = ALLOWED_IMAGE_EXTS.has(ext)

  if (mimeOk && extOk) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid file. Only JPEG, PNG, and WebP images are allowed. Got: ${file.mimetype} / ${ext}`))
  }
}

const documentFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase()
  const mimeOk = ALLOWED_DOC_MIMES.has(file.mimetype)
  const extOk = ALLOWED_DOC_EXTS.has(ext)

  if (mimeOk && extOk) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid file type. Only images and PDFs allowed. Got: ${file.mimetype} / ${ext}`))
  }
}

// Single image — 5MB limit
export const uploadSingle = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1,                   // max 1 file
  },
}).single('avatar')

// Multiple images — 5MB per file, max 6 files
export const uploadMultiple = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 6, // reduced from 10 to limit abuse
  },
}).array('images', 6)

// Documents — 10MB per file, max 5 files
export const uploadDocuments = multer({
  storage,
  fileFilter: documentFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 5,
  },
}).array('documents', 5)
