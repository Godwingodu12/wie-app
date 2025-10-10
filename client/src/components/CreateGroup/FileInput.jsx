import InfoTooltip from "./InfoTooltip";

const FileInput = ({ id, label, info, acceptedFiles, maxSizeMB, error, preview, onFileChange, onRemove, isDocument = false }) => (
    <div>
        <label className="flex items-center text-sm font-medium text-black dark:text-gray-400 mb-2">
            {label}{info && <InfoTooltip note={info} />}
        </label>
        <div className={`relative rounded-lg p-5 text-center bg-gray-100 dark:bg-[#2B2B2B] min-h-[220px] flex justify-center items-center`}>
            {preview ? (
                <div className="w-full h-full min-h-[180px] flex justify-center items-center">
                    {isDocument ? (
                        <div className="text-center">
                            <span role="img" aria-label="document" className="text-5xl">📄</span>
                            <p className="mt-2 text-sm text-gray-300 break-all">
                                {typeof preview === 'object' ? preview.name : 'Document'}
                            </p>
                        </div>
                    ) : (
                        <img src={preview} alt={`${label} preview`} className="max-w-full max-h-[180px] object-contain rounded-lg"/>
                    )}
                    <button 
                        type="button" 
                        onClick={() => onRemove(id)} 
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-sm font-bold flex items-center justify-center hover:bg-red-700"
                    >
                        &times;
                    </button>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2">
                    <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                    </svg>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Drag & drop or <span className="font-semibold text-indigo-500 dark:text-indigo-400 cursor-pointer">browse</span>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-200 ">Max file size: {maxSizeMB}MB</p>
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
);


export default FileInput