const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, darkMode }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[110] p-4">
            <div className={`rounded-xl w-full max-w-md p-6 space-y-4 ${darkMode ? "bg-[#1E1E1E] text-gray-200 border border-gray-700" : "bg-white text-gray-800"}`}>
                <h3 className="text-xl font-bold">{title}</h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{message}</p>
                <div className="flex justify-end gap-4 pt-4">
                    <button 
                        onClick={onClose} 
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}`}
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
};


export default ConfirmModal;