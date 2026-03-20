import { useState, useRef } from 'react'

interface FileUploadProps {
  maxFiles?: number
  currentFiles?: string[]
  onUpload: (files: File[]) => void
  loading?: boolean
  acceptedTypes?: string
}

export default function FileUpload({
  maxFiles = 10,
  currentFiles = [],
  onUpload,
  loading,
  acceptedTypes = 'image/*,.pdf',
}: FileUploadProps) {
  const [fileList, setFileList] = useState<{ name: string; url: string; type: string }[]>(
    currentFiles.map(url => ({
      name: url.split('/').pop() || 'file',
      url,
      type: url.endsWith('.pdf') ? 'pdf' : 'image',
    }))
  )
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files)

    // Validate file types and sizes
    const validFiles = fileArray.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isPDF = file.type === 'application/pdf'

      if (!isImage && !isPDF) {
        alert(`${file.name} is not a valid file type`)
        return false
      }

      if (file.size > 10 * 1024 * 1024) {
        alert(`${file.name} is too large (max 10MB)`)
        return false
      }

      return true
    })

    if (validFiles.length === 0) return

    // Check max files
    if (fileList.length + validFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files`)
      return
    }

    // Create file previews
    const newFiles: { name: string; url: string; type: string }[] = []
    validFiles.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        newFiles.push({
          name: file.name,
          url: reader.result as string,
          type: file.type.startsWith('image/') ? 'image' : 'pdf',
        })
        if (newFiles.length === validFiles.length) {
          setFileList(prev => [...prev, ...newFiles])
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

  const removeFile = (index: number) => {
    setFileList(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="file-upload">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedTypes}
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <div
        className={`file-upload-dropzone ${dragActive ? 'active' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        {loading ? (
          <div className="file-upload-loading">
            <div className="spinner"></div>
            <p>Uploading...</p>
          </div>
        ) : (
          <>
            <span className="file-upload-icon">📎</span>
            <p className="file-upload-text">Drag & drop documents here, or click to select</p>
            <p className="file-upload-hint">Images and PDFs, up to {maxFiles} files, 10MB max per file</p>
          </>
        )}
      </div>

      {fileList.length > 0 && (
        <div className="file-list">
          {fileList.map((file, index) => (
            <div key={index} className="file-list-item">
              <div className="file-list-icon">
                {file.type === 'pdf' ? '📄' : '🖼️'}
              </div>
              <div className="file-list-name">{file.name}</div>
              <button
                type="button"
                className="file-list-remove"
                onClick={(e) => {
                  e.stopPropagation()
                  removeFile(index)
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
