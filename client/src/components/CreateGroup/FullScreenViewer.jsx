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
            className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-sm"
            onClick={onClose}
        >
            <div 
                className={`relative w-screen h-screen max-w-full max-h-full transition-all duration-300 flex flex-col ${darkMode ? 'bg-[#1a1a1a]' : 'bg-white'} rounded-none sm:rounded-lg shadow-2xl overflow-hidden`}
                onClick={(e) => e.stopPropagation()} // Stop click from closing modal
            >
                {/* Header */}
                <div className={`p-4 flex justify-between items-center flex-shrink-0 border-b ${darkMode ? 'border-gray-700 text-white' : 'border-gray-300 text-gray-900'}`}>
                    <span className="font-semibold truncate max-w-[90%]">{fileName}</span>
                    <button 
                        onClick={onClose}
                        className="text-2xl font-bold hover:text-red-500 transition-colors"
                        aria-label="Close viewer"
                    >
                        &times;
                    </button>
                </div>
                
                {/* Content Area */}
                <div className="flex-1 w-full h-full flex items-center justify-center overflow-hidden">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};

export default FullScreenViewer