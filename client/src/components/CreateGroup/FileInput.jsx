import { useState } from 'react';
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

  // Function to determine file type from preview
  const getFileType = () => {
    if (!preview) return null;
    
    if (typeof preview === 'object' && preview.data) {
      const data = preview.data;
      if (data.includes('data:application/pdf')) return 'pdf';
      if (data.includes('data:application/vnd.openxmlformats-officedocument.wordprocessingml.document')) return 'docx';
      if (data.includes('data:application/msword')) return 'doc';
      return 'document';
    }
    
    if (typeof preview === 'string') {
      if (preview.includes('data:image')) return 'image';
      if (preview.includes('data:video')) return 'video';
      if (preview.includes('data:application/pdf')) return 'pdf';
      if (preview.includes('.pdf')) return 'pdf';
    }
    
    return 'unknown';
  };

  const openPreviewModal = () => {
    setPreviewData(preview);
    setShowPreviewModal(true);
  };

  const fileType = getFileType();
  const previewUrl = typeof preview === 'object' ? preview.data || preview.url : preview;
  const fileName = typeof preview === 'object' ? preview.name : 'File';

  return (
    <>
      <div>
        <label className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2">
          {label}{info && <InfoTooltip note={info} />}
        </label>
        <div className={`relative rounded-lg p-5 text-center bg-gray-100 dark:bg-[#2B2B2B] min-h-[280px] flex justify-center items-center border-2 border-dashed border-gray-300 dark:border-gray-600`}>
          {preview ? (
            <div className="w-full h-full min-h-[240px] flex flex-col justify-center items-center gap-3">
              {/* IMAGE PREVIEW */}
              {fileType === 'image' && (
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <img 
                    src={previewUrl} 
                    alt={`${label} preview`} 
                    className="max-w-full max-h-[240px] object-contain rounded-lg shadow-md" 
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
                    {fileType === 'docx' ? 'Word Document (.docx)' : 'Document (.doc)'}
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
          <div className="bg-white dark:bg-[#1a1a1a] rounded-lg shadow-2xl max-w-4xl max-h-[90vh] w-full overflow-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
            
            {/* MODAL HEADER */}
            <div className="flex justify-between items-center p-4 border-b border-gray-300 dark:border-gray-600 sticky top-0 bg-white dark:bg-[#1a1a1a]">
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
            <div className="p-6 flex-1 overflow-auto">
              {fileType === 'image' && (
                <div className="flex justify-center">
                  <img 
                    src={previewUrl} 
                    alt="Full size preview" 
                    className="max-w-full h-auto rounded-lg"
                  />
                </div>
              )}

              {fileType === 'video' && (
                <div className="flex justify-center">
                  <video 
                    src={previewUrl} 
                    className="max-w-full h-auto rounded-lg bg-black"
                    controls
                    preload="metadata"
                  />
                </div>
              )}

              {fileType === 'pdf' && (
                <div className="flex flex-col items-center gap-4">
                  <div className="text-8xl">📄</div>
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">PDF Document</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{fileName}</p>
                  {previewUrl && previewUrl.includes('http') ? (
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
                    {fileType === 'docx' ? 'Word Document' : 'Document'}
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
