import { useState, useRef } from 'react'

interface ImageUploadProps {
  multiple?: boolean
  maxFiles?: number
  currentImages?: string[]
  onUpload: (files: File[]) => void
  loading?: boolean
}

export default function ImageUpload({
  multiple = true,
  maxFiles = 10,
  currentImages = [],
  onUpload,
  loading,
}: ImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>(currentImages)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files)

    // Validate file types
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`)
        return false
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} is too large (max 5MB)`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    // Check max files
    if (multiple && previews.length + validFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} images`)
      return
    }

    // Create previews
    const newPreviews: string[] = []
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newPreviews.push(reader.result as string)
        if (newPreviews.length === validFiles.length) {
          setPreviews(prev => [...prev, ...newPreviews])
        }
      }
      reader.readAsDataURL(file)
    })

    // Call upload handler
    onUpload(validFiles)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const removeImage = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="image-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div
        className={`image-upload-dropzone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {loading ? (
          <div className="image-upload-loading">
            <div className="spinner"></div>
            <p>Uploading...</p>
          </div>
        ) : (
          <>
            <span className="image-upload-icon">🖼️</span>
            <p className="image-upload-text">
              {multiple ? 'Drag & drop images here, or click to select' : 'Click to select an image'}
            </p>
            <p className="image-upload-hint">
              {multiple && `Up to ${maxFiles} images, `}5MB max per file
            </p>
          </>
        )}
      </div>

      {previews.length > 0 && (
        <div className="image-preview-grid">
          {previews.map((preview, index) => (
            <div key={index} className="image-preview-item">
              <img src={preview} alt={`Preview ${index + 1}`} />
              <button
                type="button"
                className="image-preview-remove"
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage(index)
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
