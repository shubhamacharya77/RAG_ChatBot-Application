import React, { useState, useRef, useEffect } from 'react';
import { uploadDocumentWithProgress, fetchDocuments, deleteDocument } from '../utils/api';

import './DocumentsPage.css';

const DOCUMENT_TYPES = [
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/bmp',
];

const ACCEPTED_TYPES = [...DOCUMENT_TYPES, ...IMAGE_TYPES];
const ACCEPTED_EXTENSIONS = '.pdf,.txt,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.bmp';
const ACCEPTED_NAME_PATTERN = /\.(pdf|txt|doc|docx|jpe?g|png|gif|webp|bmp)$/i;

function formatFileSize(bytes) {
  if (!bytes && bytes !== 0) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileIcon(name, type) {
  if (type?.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp)$/i.test(name)) return '🖼️';
  if (/\.pdf$/i.test(name)) return '📕';
  if (/\.(doc|docx)$/i.test(name)) return '📝';
  if (/\.txt$/i.test(name)) return '📄';
  return '📎';
}

function isAcceptedFile(file) {
  return ACCEPTED_TYPES.includes(file.type) || ACCEPTED_NAME_PATTERN.test(file.name);
}

export default function DocumentsPage({ documents, onDocumentsChange, onBack, token }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  // per-file upload progress map {filename: percent}
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState({});

  useEffect(() => {
    let cancelled = false;

    async function loadDocuments() {
      try {
        const data = await fetchDocuments(token);
        if (!cancelled && Array.isArray(data?.documents)) {
          onDocumentsChange(data.documents);
        }
      } catch {
        // Keep locally stored documents when API is unavailable
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDocuments();
    return () => { cancelled = true; };
  }, [onDocumentsChange, token]);



  const handleDelete = async (doc) => {
    // Ask user for confirmation before deleting
    if (!window.confirm(`Delete document "${doc.document}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(doc.id);
    setError(null);
    try {
      await deleteDocument(doc.id, token);
    } catch (e) {
      // Show error if API call fails (still remove locally for UX)
      setError(`Failed to delete ${doc.document}: ${e.message}`);
    }
    // Update local list regardless of API success to keep UI responsive
    onDocumentsChange((prev) => prev.filter((d) => d.id !== doc.id));
    setDeletingId(null);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    uploadFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.length) {
      uploadFiles(e.target.files);
    }
    e.target.value = '';
  };
  // Upload files with progress tracking
  const uploadFiles = async (fileList) => {
    const incoming = Array.from(fileList);
    const valid = incoming.filter(isAcceptedFile);

    if (valid.length === 0) {
      setError('No supported files selected. Use PDF, TXT, DOC, DOCX, or image formats.');
      return;
    }

    if (valid.length < incoming.length) {
      setError('Some files were skipped. Only supported document and image types are allowed.');
    } else {
      setError(null);
    }

    setUploading(true);

    const uploaded = [];
    const failed = [];

    for (const documentFile of valid) {
      // initialise progress entry
      setUploadProgress((prev) => ({ ...prev, [documentFile.name]: 0 }));
      try {
        const result = await uploadDocumentWithProgress(documentFile, token, (percent) => {
          setUploadProgress((prev) => ({ ...prev, [documentFile.name]: percent }));
        });
        uploaded.push({
          id: result?.id || `${Date.now()}-${documentFile.name}`,
          name: documentFile.name,
          document: documentFile.name,
          size: documentFile.size,
          type: documentFile.type,
          uploadedAt: result?.uploadedAt || new Date().toISOString(),
        });
        // remove progress entry on success
        setUploadProgress((prev) => {
          const { [documentFile.name]: _, ...rest } = prev;
          return rest;
        });
      } catch {
        uploaded.push({
          id: `${Date.now()}-${documentFile.name}`,
          name: documentFile.name,
          document: documentFile.name,
          size: documentFile.size,
          type: documentFile.type,
          uploadedAt: new Date().toISOString(),
        });
        failed.push(documentFile.name);
        // remove progress entry on failure
        setUploadProgress((prev) => {
          const { [documentFile.name]: _, ...rest } = prev;
          return rest;
        });
      }
    }

    if (uploaded.length > 0) {
      onDocumentsChange((prev) => {
        const names = new Set(prev.map((d) => d.document));
        const unique = uploaded.filter((d) => !names.has(d.document));
        return [...unique, ...prev];
      });
    }

    if (failed.length > 0) {
      setError(`Uploaded locally (API unavailable): ${failed.join(', ')}`);
    }

    setUploading(false);
  };

  // Handler for the Upload Selected button
  const handleUploadClick = () => {
    if (fileInputRef.current?.files?.length) {
      uploadFiles(fileInputRef.current.files);
    }
  };
  return (
    <div className="documents-page">
      <header className="documents-header">
        <button type="button" className="documents-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Chat
        </button>
        <div className="documents-header-info">
          <h1>Document Manager</h1>
          <p>Upload, view, and delete your knowledge base files</p>
        </div>
        <div className="documents-count">
          <span className="documents-count-value">{documents.length}</span>
          <span className="documents-count-label">files</span>
        </div>
      </header>

      <div className="documents-body">
        <section
          className={`documents-dropzone ${isDragging ? 'dragging' : ''} ${uploading ? 'uploading' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            multiple
            onChange={handleFileSelect}
            hidden
          />

          {/* Progress bars for active uploads */}
          {Object.entries(uploadProgress).map(([name, percent]) => (
            <div key={name} className="upload-progress-item" style={{ marginBottom: '8px' }}>
              <span style={{ marginRight: '8px' }}>{name}</span>
              <div className="progress-bar" style={{ display: 'inline-block', width: '200px', background: '#eee', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                <div className="progress-filled" style={{ width: `${percent}%`, background: '#4caf50', height: '100%' }} />
              </div>
            </div>
          ))}
          {/* New upload button */}
          <button
            type="button"
            className="upload-document-btn"
            onClick={handleUploadClick}
          >
            Upload Selected
          </button>
          <div className="documents-dropzone-icon">
            {uploading ? (
              <span className="documents-spinner" />
            ) : (
              <>
                <span>📄</span>
                <span>🖼️</span>
              </>
            )}
          </div>
          <p className="documents-dropzone-title">
            {uploading ? 'Uploading files…' : (
              <>Drag & drop files here, or <span>browse</span></>
            )}
          </p>
          <p className="documents-dropzone-hint">
            PDF, TXT, DOC, DOCX, JPG, PNG, GIF, WEBP, BMP — up to 10 MB each
          </p>
        </section>

        {error && (
          <div className="documents-error" role="alert">
            <span className="documents-error-icon">!</span>
            <p>{error}</p>
            <button type="button" onClick={() => setError(null)} aria-label="Dismiss">✕</button>
          </div>
        )}

        <section className="documents-list-section">
          <div className="documents-list-header">
            <h2>Your Documents</h2>
            <span className="documents-list-meta">
              {loading ? 'Loading…' : `${documents.length} total`}
            </span>
          </div>

          {loading ? (
            <div className="documents-loading">Loading your documents…</div>
          ) : documents.length === 0 ? (
            <div className="documents-empty">
              <div className="documents-empty-icon">📂</div>
              <h3>No documents yet</h3>
              <p>Upload your first file using the area above to build your knowledge base.</p>
            </div>
          ) : (
            <ul className="documents-grid">
              {documents.map((doc) => (
                <li key={doc.id} className="document-card">
                  <div className="document-card-icon">{getFileIcon(doc.document, doc.type)}</div>
                  <div className="document-card-body">
                    <span className="document-card-name" title={doc.document}>{doc.document}</span>
                    <span className="document-card-meta">
                      {formatFileSize(doc.size)} · {formatDate(doc.uploadedAt)}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="document-delete-btn"
                    onClick={() => handleDelete(doc)}
                    disabled={deletingId === doc.id}
                    title="Delete document"
                    aria-label={`Delete ${doc.document}`}
                  >
                    {deletingId === doc.id ? '…' : '🗑️'}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
