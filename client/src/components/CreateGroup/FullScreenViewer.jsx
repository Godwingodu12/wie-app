const FullScreenViewer = ({ fileUrl, fileType, fileName, onClose, darkMode }) => {
    if (!fileUrl) return null;

    const isImage = fileType?.startsWith('image') || fileUrl?.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i);
    const isVideo = fileType?.startsWith('video') || fileUrl?.match(/\.(mp4|webm|ogg|mov)(\?|$)/i);
    const isPdf = fileType?.includes('pdf') || fileUrl?.match(/\.pdf(\?|$)/i);
    const isDocument = isPdf || fileType?.includes('doc') || fileType?.includes('docx');

    const renderContent = () => {
        // Use iframe for PDF/Docs where possible, or if the file is a data URI
        if (isPdf) {
            return (
                <iframe
                    src={fileUrl}
                    title={fileName}
                    className="w-full h-full"
                    style={{ border: 'none' }}
                >
                    <p className="p-4 text-center text-gray-400">Cannot display PDF directly. <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300 underline">Download file.</a></p>
                </iframe>
            );
        }
        if (isDocument && !isPdf) { // DOC/DOCX cannot be reliably previewed in iframe
            return (
                <div className="flex flex-col items-center gap-4 p-8">
                    <div className="text-8xl">📋</div>
                    <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Document Preview Unavailable</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                        This file type ({isDocument}) cannot be previewed in the browser.
                    </p>
                    <a
                        href={fileUrl}
                        download={fileName}
                        className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Download File
                    </a>
                </div>
            );
        }
        if (isVideo) {
            return (
                <video controls className="max-h-full max-w-full object-contain">
                    <source src={fileUrl} type={fileType || 'video/mp4'} />
                    Your browser does not support the video tag.
                </video>
            );
        }
        if (isImage) {
            return <img src={fileUrl} alt={fileName} className="max-h-full max-w-full object-contain" />;
        }

        return <p className="text-white">Cannot preview this file type.</p>;
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-8 bg-black/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
            onClick={onClose}
        >
            <div
                className={`relative w-full h-[80vh] sm:h-auto sm:max-h-[80vh] md:max-w-xl lg:max-w-2xl transition-all duration-300 flex flex-col ${darkMode ? 'bg-[#1a1a1a]/80 border border-white/10' : 'bg-white/80 border border-black/5'} rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 backdrop-blur-xl`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`px-4 py-3 flex justify-between items-center flex-shrink-0 border-b ${darkMode ? 'border-gray-800 text-white' : 'border-gray-100 text-gray-900'}`}>
                    <div className="flex flex-col gap-0 max-w-[80%]">
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Preview</span>
                        <span className="font-semibold truncate text-base leading-tight">{fileName}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className={`p-2 rounded-full transition-all ${darkMode ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-500 hover:text-black'}`}
                        aria-label="Close viewer"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 w-full flex items-center justify-center overflow-hidden p-2 sm:p-4">
                    <div className="relative w-full h-full flex items-center justify-center">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FullScreenViewer
