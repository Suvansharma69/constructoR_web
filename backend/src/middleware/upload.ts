import multer from 'multer'
import path from 'path'
import { v2 as cloudinary } from 'cloudinary'
import { CloudinaryStorage } from 'multer-storage-cloudinary'

// ── Configure Cloudinary ───────────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const isCloudinaryConfigured =
  !!process.env.CLOUDINARY_CLOUD_NAME &&
  !!process.env.CLOUDINARY_API_KEY &&
  !!process.env.CLOUDINARY_API_SECRET

if (!isCloudinaryConfigured) {
  console.warn('⚠️  Cloudinary env vars not set — file uploads will use local disk (dev only)')
}

// ── Allowed types (defense-in-depth) ─────────────────────────────────────────
const ALLOWED_IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const ALLOWED_DOC_EXTS   = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf'])
const ALLOWED_IMAGE_MIMES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
const ALLOWED_DOC_MIMES   = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'])

// ── Cloudinary storage (prod) ─────────────────────────────────────────────────
const makeCloudinaryStorage = (folder: string) =>
  new CloudinaryStorage({
    cloudinary,
    params: {
      folder: `constructor_web/${folder}`,
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'pdf'],
      // Cloudinary strips metadata, resizes if needed, and generates a CDN URL
      resource_type: 'auto',
    } as any,
  })

// ── Local disk storage (dev fallback) ─────────────────────────────────────────
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)
const uploadDir  = path.join(__dirname, '../../uploads')

const localFolders = ['profiles', 'materials', 'projects', 'portfolios']
localFolders.forEach(dir => {
  const fullPath = path.join(uploadDir, dir)
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true })
})

const localStorage = multer.diskStorage({
  destination: (req, _file, cb) => {
    let folder = 'profiles'
    if (req.path.includes('material'))  folder = 'materials'
    else if (req.path.includes('project'))  folder = 'projects'
    else if (req.path.includes('portfolio')) folder = 'portfolios'
    cb(null, path.join(uploadDir, folder))
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${uniqueSuffix}${ext}`)
  },
})

// ── File filters ─────────────────────────────────────────────────────────────
const imageFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if (ALLOWED_IMAGE_MIMES.has(file.mimetype) && ALLOWED_IMAGE_EXTS.has(ext)) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid file. Only JPEG, PNG, and WebP images are allowed. Got: ${file.mimetype} / ${ext}`))
  }
}

const documentFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase()
  if (ALLOWED_DOC_MIMES.has(file.mimetype) && ALLOWED_DOC_EXTS.has(ext)) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid file type. Only images and PDFs allowed. Got: ${file.mimetype} / ${ext}`))
  }
}

// ── Pick storage engine based on env ─────────────────────────────────────────
const profileStorage  = isCloudinaryConfigured ? makeCloudinaryStorage('profiles')   : localStorage
const materialStorage = isCloudinaryConfigured ? makeCloudinaryStorage('materials')  : localStorage
const projectStorage  = isCloudinaryConfigured ? makeCloudinaryStorage('projects')   : localStorage
const portfolioStorage = isCloudinaryConfigured ? makeCloudinaryStorage('portfolios') : localStorage

// ── Exported multer instances ─────────────────────────────────────────────────

/** Single avatar image — 5 MB */
export const uploadSingle = multer({
  storage: profileStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).single('avatar')

/** Multiple material images — 5 MB each, max 6 */
export const uploadMaterialImages = multer({
  storage: materialStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
}).array('images', 6)

/** Multiple project images — 5 MB each, max 6 */
export const uploadMultiple = multer({
  storage: projectStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
}).array('images', 6)

/** Portfolio images — 5 MB each, max 6 */
export const uploadPortfolio = multer({
  storage: portfolioStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 6 },
}).array('images', 6)

/** Documents (images + PDF) — 10 MB each, max 5 */
export const uploadDocuments = multer({
  storage: projectStorage,
  fileFilter: documentFilter,
  limits: { fileSize: 10 * 1024 * 1024, files: 5 },
}).array('documents', 5)

// ── Helper: extract public URL from uploaded file ─────────────────────────────
/**
 * Works for both Cloudinary (file.path = CDN URL) and local disk.
 * Local paths are returned as `/uploads/{folder}/{filename}`.
 */
export const getFileUrl = (file: Express.Multer.File, folder: string): string => {
  if (isCloudinaryConfigured) {
    return (file as any).path // Cloudinary CDN URL
  }
  return `/uploads/${folder}/${file.filename}`
}
