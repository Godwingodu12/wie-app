import { useState, useEffect } from 'react';
import InfoTooltip from "./InfoTooltip";

const FileInput = ({ 
  id, 
  label, 
  info, 
  acceptedFiles, 
  maxSizeMB, 
  error, 
  preview, 
  onFileChange, 
  onRemove, 
  isDocument = false 
}) => {
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  // Update previewData when preview prop changes
  useEffect(() => {
    if (preview) {
      setPreviewData(preview);
    } else {
      setPreviewData(null);
    }
  }, [preview]);
  const getFileType = () => {
    if (!preview) return null;
    
    // Handle object with data property
    if (typeof preview === 'object' && preview !== null) {
      // Check if type is explicitly set
      if (preview.type === 'image') return 'image';
      if (preview.type === 'video') return 'video';
      if (preview.type === 'pdf') return 'pdf';
      
      const data = preview.data || preview.url || preview;
      
      if (typeof data === 'string') {
        // Check for data URIs first
        if (data.startsWith('data:application/pdf')) return 'pdf';
        if (data.startsWith('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document')) return 'docx';
        if (data.startsWith('data:application/msword')) return 'docx';
        if (data.startsWith('data:image')) return 'image';
        if (data.startsWith('data:video')) return 'video';
        
        // Check for file extensions
        if (data.match(/\.(pdf)(\?|$)/i)) return 'pdf';
        if (data.match(/\.(docx?)(\?|$)/i)) return 'docx';
        if (data.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) return 'image';
        if (data.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) return 'video';
        
        // If it's a URL without clear extension, assume it's an image if it contains common image hosting patterns
        if (data.includes('/uploads/') || data.includes('/images/') || data.includes('/media/')) {
          return 'image';
        }
      }
      
      return 'document';
    }
    
    // Handle string preview (URL or data URI)
    if (typeof preview === 'string') {
      if (preview.startsWith('data:image') || preview.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)) return 'image';
      if (preview.startsWith('data:video') || preview.match(/\.(mp4|webm|ogg|mov)(\?|$)/i)) return 'video';
      if (preview.startsWith('data:application/pdf') || preview.match(/\.pdf(\?|$)/i)) return 'pdf';
      if (preview.match(/\.docx?(\?|$)/i)) return 'docx';
      
      // Default to image for URLs without clear extensions
      if (preview.startsWith('http') || preview.startsWith('blob:')) {
        return 'image';
      }
    }
    
    return 'unknown';
  };
  const openPreviewModal = () => {
    setPreviewData(preview);
    setShowPreviewModal(true);
  };
  const getPreviewUrl = () => {
    if (!preview) return null;
    
    if (typeof preview === 'string') {
      return preview;
    }
    
    if (typeof preview === 'object' && preview !== null) {
      // Try multiple possible property names
      return preview.data || preview.url || preview.src || preview.path || null;
    }
    
    return null;
  };
  // Safely extract file name
  const getFileName = () => {
    if (!preview) return 'File';
    
    if (typeof preview === 'object' && preview !== null) {
      return preview.name || 'File';
    }
    
    if (typeof preview === 'string') {
      // Extract filename from URL
      const urlParts = preview.split('/');
      const filename = urlParts[urlParts.length - 1];
      return filename || 'File';
    }
    
    return 'File';
  };

  const fileType = getFileType();
  const previewUrl = getPreviewUrl();
  const fileName = getFileName();

  return (
    <>
      <div>
        <label className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2">
          {label}{info && <InfoTooltip note={info} />}
        </label>
        <div className={`relative rounded-lg p-5 text-center bg-gray-100 dark:bg-[#2B2B2B] min-h-[280px] flex justify-center items-center border-2 border-dashed border-gray-300 dark:border-gray-600`}>
          {preview && previewUrl ? (
            <div className="w-full h-full min-h-[240px] flex flex-col justify-center items-center gap-3">
              {/* IMAGE PREVIEW */}
              {fileType === 'image' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img 
                    src={previewUrl} 
                    alt={`${label} preview`} 
                    className="max-w-full max-h-[240px] object-contain rounded-lg shadow-md" 
                    onError={(e) => {
                      console.error('Image failed to load:', previewUrl);
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage%3C/text%3E%3C/svg%3E';
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate max-w-[90%]">
                    {fileName}
                  </p>
                  <button 
                    type="button" 
                    onClick={() => openPreviewModal()}
                    className="mt-2 px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    View Full Size
                  </button>
                </div>
              )}

              {/* VIDEO PREVIEW */}
              {fileType === 'video' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <video 
                    src={previewUrl} 
                    className="max-w-full max-h-[240px] rounded-lg shadow-md bg-black"
                    controls
                    preload="metadata"
                    onError={(e) => {
                      console.error('Video failed to load:', previewUrl);
                    }}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 truncate max-w-[90%]">
                    {fileName}
                  </p>
                  <button 
                    type="button" 
                    onClick={() => openPreviewModal()}
                    className="mt-2 px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    View Full Size
                  </button>
                </div>
              )}

              {/* PDF PREVIEW */}
              {fileType === 'pdf' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="text-6xl">📄</div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    PDF Document
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 break-all max-w-[90%]">
                    {fileName}
                  </p>
                  <button 
                    type="button" 
                    onClick={() => openPreviewModal()}
                    className="mt-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    View PDF
                  </button>
                </div>
              )}

              {/* DOCUMENT PREVIEW (DOC, DOCX) */}
              {(fileType === 'doc' || fileType === 'docx' || fileType === 'document') && (
                <div className="relative w-full h-full flex flex-col items-center justify-center gap-3">
                  <div className="text-6xl">📋</div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {fileType === 'docx' ? 'Word Document (.docx)' : fileType === 'doc' ? 'Document (.doc)' : 'Document'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 break-all max-w-[90%]">
                    {fileName}
                  </p>
                  <button 
                    type="button" 
                    onClick={() => openPreviewModal()}
                    className="mt-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                  >
                    View Document
                  </button>
                </div>
              )}

              {/* REMOVE BUTTON */}
              <button 
                type="button" 
                onClick={() => onRemove(id)} 
                className="absolute -top-3 -right-3 bg-red-600 text-white rounded-full w-8 h-8 text-lg font-bold flex items-center justify-center hover:bg-red-700 shadow-lg transition-all"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
              </svg>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drag & drop or <span className="font-semibold text-indigo-500 dark:text-indigo-400 cursor-pointer">browse</span>
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-200">Max file size: {maxSizeMB}MB</p>
              {acceptedFiles && (
                <p className="text-xs text-gray-400">
                  Accepted: {acceptedFiles.replace(/\./g, '').toUpperCase()}
                </p>
              )}
            </div>
          )}
          <input 
            id={id + "_input"} 
            type="file" 
            accept={acceptedFiles} 
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer" 
            onChange={(e) => onFileChange(e, id)} 
          />
        </div>
        {error && <small className="text-red-500 mt-2 block text-left font-medium">{error}</small>}
      </div>

      {/* FULL-SIZE PREVIEW MODAL */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setShowPreviewModal(false)}>
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-2xl max-w-6xl max-h-[90vh] w-full overflow-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center p-4 border-b border-gray-300 dark:border-gray-600 sticky top-0 bg-white dark:bg-[#1a1a1a] z-10">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {fileName}
              </h2>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="text-2xl font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                ×
              </button>
            </div>

            {/* MODAL CONTENT */}
            <div className="p-6 flex-1 overflow-auto flex items-center justify-center">
              {fileType === 'image' && previewUrl && (
                <div className="w-full h-full flex items-center justify-center">
                  <img 
                    src={previewUrl} 
                    alt="Full size preview" 
                    className="w-auto h-auto max-w-full max-h-[calc(90vh-120px)] object-contain"
                    onError={(e) => {
                      console.error('Full size image failed to load:', previewUrl);
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage failed to load%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
              )}

              {fileType === 'video' && previewUrl && (
                <div className="w-full h-full flex items-center justify-center">
                  <video 
                    src={previewUrl} 
                    className="w-auto h-auto max-w-full max-h-[calc(90vh-120px)] object-contain bg-black"
                    controls
                    preload="metadata"
                    onError={(e) => {
                      console.error('Full size video failed to load:', previewUrl);
                    }}
                  />
                </div>
              )}

              {fileType === 'pdf' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-8xl">📄</div>
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">PDF Document</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{fileName}</p>
                  {previewUrl && (previewUrl.startsWith('http') || previewUrl.startsWith('blob:')) ? (
                    <a 
                      href={previewUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Open PDF in New Tab
                    </a>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
                      PDF preview embedded. Use your browser's download feature to save.
                    </p>
                  )}
                </div>
              )}

              {(fileType === 'doc' || fileType === 'docx' || fileType === 'document') && (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-8xl">📋</div>
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    {fileType === 'docx' ? 'Word Document' : fileType === 'doc' ? 'Document' : 'Document'}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{fileName}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-md mt-4">
                    📝 Document preview is not available in browser. The file is ready to be uploaded.
                  </p>
                </div>
              )}
            </div>

            {/* MODAL FOOTER */}
            <div className="p-4 border-t border-gray-300 dark:border-gray-600 flex justify-end gap-2 sticky bottom-0 bg-white dark:bg-[#1a1a1a]">
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default FileInput;
