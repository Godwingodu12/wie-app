import { X } from "lucide-react";

const GuideModal = ({ guest, theme, onClose, formatImagePath }) => {
    if (!guest) return null;

    const profileUrl = formatImagePath(guest.guest_profile) || "https://i.pravatar.cc/300?img=default";
    const link = guest.social_media_link || "N/A";
    
    const textColorClass = theme.isDark ? theme.textColor : "text-gray-800";
    const linkColorClass = theme.isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700';

    // Using the main background color for a fully opaque modal box
    const solidModalBg = theme.isDark ? theme.mainBg : '#ffffff'; 

    return (
        <div 
            // Modal Overlay: Semi-transparent black background
            className="fixed inset-0 bg-black bg-opacity-70 z-[100] flex items-center justify-center p-4 transition-opacity duration-300 backdrop-blur-sm"
            onClick={onClose} 
        >
            <div
                // Modal Container: Opaque background, *removed* main shadow to rely on inner elements
                className={`w-full max-w-md p-8 rounded-3xl relative ${theme.text}`} 
                style={{ 
                    backgroundColor: solidModalBg, 
                }}
                onClick={(e) => e.stopPropagation()}
            >
                
                {/* Close Button: Clean, subtle styling with INSET shadow */}
                <button 
                    onClick={onClose}
                    className={`absolute top-3 right-3 p-2 rounded-full transition-colors ${theme.insetBg} hover:bg-opacity-80`}
                    style={{ 
                        border: `1px solid ${theme.isDark ? '#444' : '#ddd'}`, 
                        boxShadow: theme.shadowInset, // 👈 Re-added INSET shadow
                    }}
                >
                    <X size={20} className={theme.textColor} />
                </button>
                
                {/* Modal Title with Guest Name */}
                <h3 className={`text-2xl font-bold mb-6 text-center ${textColorClass}`}>
                    {guest.guest_name || 'Guide'} Details
                </h3>

                <div className="flex flex-col items-center gap-6">
                    {/* Profile Image: Simple border for definition, with subtle INSET shadow */}
                    <img 
                        src={profileUrl} 
                        alt={guest.guest_name} 
                        className="w-32 h-32 rounded-full object-cover mb-2"
                        style={{ 
                            border: `3px solid ${theme.isDark ? '#444' : '#ddd'}`,
                            boxShadow: theme.shadowInset, // 👈 Re-added INSET shadow for depth
                        }}
                    />
                    
                    <p className={`text-xl font-semibold ${textColorClass}`}>
                        Guest Name :{guest.guest_name || 'N/A'}
                    </p> 
                    
                    {/* Role Container: With INSET shadow */}
                    <div className="w-full space-y-4">
                        <div 
                            className={`p-4 rounded-xl ${theme.insetBg} text-sm transition-colors`} 
                            style={{ 
                                border: `1px solid ${theme.isDark ? '#333' : '#ddd'}`, 
                                boxShadow: theme.shadowInset, // 👈 Re-added INSET shadow
                            }} 
                        >
                            <p className="text-sm text-gray-400 mb-1">Role:</p>
                            <p className={`font-medium ${textColorClass}`}>
                                {guest.role || 'Event Host'}
                            </p>
                        </div>

                        {/* Social Link Container: With INSET shadow */}
                        <div 
                            className={`p-4 rounded-xl ${theme.insetBg} text-sm`} 
                            style={{ 
                                border: `1px solid ${theme.isDark ? '#333' : '#ddd'}`, 
                                boxShadow: theme.shadowInset, // 👈 Re-added INSET shadow
                            }} 
                        >
                            <p className="text-sm text-gray-400 mb-1">Social Link:</p>
                            <p className="truncate">
                                <a 
                                    href={link !== "N/A" ? link : "#"}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`font-medium ${linkColorClass}`}
                                >
                                    {link}
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default GuideModal;