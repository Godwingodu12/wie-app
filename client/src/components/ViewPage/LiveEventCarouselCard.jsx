import { Link } from "react-router-dom"; 
import formatImagePath from "../ViewSingleEvent/formatImagePath";

const LiveEventCarouselCard = ({ event, isDark, theme, outerShadow, combinedShadow }) => {
    
    // --- Determine Data & Styles ---
    const eventName = event.event_name || 'Event Name Missing';
    const eventSubcategory = event.event_subcategory || 'Category';
    
    const eventLogoPath = event.event_logo || event.event_banner;
    const logoUrl = eventLogoPath ? formatImagePath(eventLogoPath) : null;
    
    const cardBgDark = '#212426'; // Match the theme style
    const cardBackgroundColor = isDark ? cardBgDark : theme.cardBg;
    const textColor = isDark ? "text-white" : "text-gray-800";
    const subTextColor = isDark ? "text-gray-400" : "text-gray-500";
    
    // Use the outerShadow for the distinct lifted neomorphic look
    const cardStyle = { 
        ...outerShadow, 
        backgroundColor: cardBackgroundColor,
        borderRadius: '25px',
        // Optional: Add a very subtle dark border if desired, though the shadow usually defines the border
        border: isDark ? '1px solid #1c1f21' : '1px solid #f0f0f0',
    };

    // Style for the 'View' button (Purple gradient, soft press effect)
    const buttonStyle = { 
        // Use combinedShadow if you want the button to look "pressed-in"
        ...combinedShadow, 
        background: 'linear-gradient(145deg, #7A4DF1, #5E30D7)',
        color: 'white',
        transition: 'background 0.3s',
        padding: '0.65rem 0',
    };

 return (
        <div className="p-3 "> 
            <div 
                className={`rounded-[36px] py-4  px-6 flex flex-col items-center transition-all duration-300`}
                style={{
                    ...cardStyle,
                   
                    
                }}
            >
                {/* 1. Logo/Image (Top Center) */}
                <div className="flex justify-center mb-2">
                    <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center overflow-hidden flex-shrink-0" 
                         style={{ boxShadow: '0 4px 16px rgba(0, 0, 0, 0.6)' }}>
                        {logoUrl ? (
                            <img 
                                src={logoUrl} 
                                alt={`${eventName} Logo`} 
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-xs font-medium text-white/70">logo</span>
                        )}
                    </div>
                </div>

                {/* 2. Event Name and Subtitle (Center) */}
                <div className="flex flex-col items-center justify-center text-center mb-4 flex-grow">
                    <h4 className={`font-semibold text-base ${textColor} leading-snug mb-1 max-w-full px-2`}>
                        {eventName}
                    </h4>
                    <p className={`text-sm ${subTextColor} leading-snug`}>
                        {eventSubcategory}
                    </p>
                </div>
                
                {/* 3. View Button (Bottom) */}
                <Link 
                    to={`/ticket/view-single-event/${event._id}`}
                    className="w-full text-center text-sm font-semibold rounded-full py-2.5 block"
                    style={buttonStyle}
                >
                    View
                </Link>
            </div>
        </div>
    );
};

export default LiveEventCarouselCard;