import { useState, useRef } from 'react'

interface AvatarUploadProps {
  currentAvatar?: string
  onUpload: (file: File) => void
  loading?: boolean
}

export default function AvatarUpload({ currentAvatar, onUpload, loading }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentAvatar || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Call upload handler
    onUpload(file)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="avatar-upload">
      <input
        ref={fileInputRef}
 type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div className="avatar-preview" onClick={handleClick}>
        {preview ? (
          <img src={preview} alt="Avatar" className="avatar-preview-img" />
        ) : (
          <div className="avatar-preview-placeholder">
            <span className="avatar-upload-icon">📷</span>
            <span className="avatar-upload-text">Upload Photo</span>
          </div>
        )}
        {loading && <div className="avatar-upload-loading">Uploading...</div>}
      </div>

      <button
        type="button"
        className="btn btn-outline btn-sm"
        onClick={handleClick}
        disabled={loading}
        style={{ marginTop: '1rem' }}
      >
        {preview ? 'Change Photo' : 'Choose Photo'}
      </button>
    </div>
  )
}
