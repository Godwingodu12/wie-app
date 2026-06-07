'use client';

import React, { useState, useEffect } from 'react';
import { X, Utensils, Hotel, Check, ChevronRight, SkipForward } from 'lucide-react';
import { useTheme } from '@/components/home/ThemeContext';

export interface AddonSelection {
    foodAddon: { selected: boolean; index: number } | null;
    accommodationAddon: { selected: boolean; index: number } | null;
}

interface AddonModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (selection: AddonSelection) => void;
    onSkip: () => void;
    event: any;
    ticketSubtotal: number;
    ticketType: string;
    quantity: number;
}

export const AddonModal: React.FC<AddonModalProps> = ({
    show,
    onClose,
    onSubmit,
    onSkip,
    event,
    ticketSubtotal,
    ticketType,
    quantity,
}) => {
    const { isDark, themeStyles } = useTheme();
    const [selectedFoodIndex, setSelectedFoodIndex] = useState<number | null>(null);
    const [selectedAccIndex, setSelectedAccIndex] = useState<number | null>(null);

    // Reset selections each time the modal opens
    useEffect(() => {
        if (show) {
            setSelectedFoodIndex(null);
            setSelectedAccIndex(null);
        }
    }, [show]);

    if (!show || !event) return null;

    const foodItems = event.food_details || [];
    const accItems = event.accommodation_details || [];
    const hasFood = foodItems.length > 0;
    const hasAcc = accItems.length > 0;

    const foodPrice = selectedFoodIndex !== null ? Number(foodItems[selectedFoodIndex]?.food_price ?? 0) : 0;
    const accPrice = selectedAccIndex !== null ? Number(accItems[selectedAccIndex]?.accommodation_price ?? 0) : 0;
    const total = ticketSubtotal + foodPrice + accPrice;

    const handleSubmit = () => {
        onSubmit({
            foodAddon: selectedFoodIndex !== null ? { selected: true, index: selectedFoodIndex } : null,
            accommodationAddon: selectedAccIndex !== null ? { selected: true, index: selectedAccIndex } : null,
        });
    };

    const getTicketImageUrl = (imagePath: string | null | undefined): string => {
        if (!imagePath) return '';
        if (imagePath.startsWith('http') || imagePath.startsWith('blob:') || imagePath.startsWith('data:')) return imagePath;
        const base = (process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/api\/?$/, '');
        let p = imagePath.replace(/\\/g, '/').replace(/^src\//, '').replace(/^\/+/, '');
        if (!p.startsWith('uploads/')) p = `uploads/${p}`;
        return `${base}/${p}`;
    };

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative w-full max-w-[480px] max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden"
                style={{
                    background: isDark ? 'rgba(26, 28, 46, 0.95)' : 'rgba(255,255,255,0.98)',
                    backdropFilter: 'blur(40px)',
                    borderColor: isDark ? 'rgba(149,117,205,0.2)' : 'rgba(0,0,0,0.07)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="px-6 pt-6 pb-4 flex items-start justify-between shrink-0"
                    style={{ borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}
                >
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1" style={{ color: '#9575CD' }}>
                            Optional Add-ons
                        </p>
                        <h3 className="text-base font-bold" style={{ color: themeStyles.text }}>
                            Enhance your experience
                        </h3>
                        <p className="text-xs mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                            Select or skip — these are completely optional
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-all shrink-0 ml-2">
                        <X className="w-4 h-4" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }} />
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">
                    {/* Ticket summary */}
                    <div
                        className="flex items-center justify-between px-4 py-3 rounded-xl"
                        style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}
                    >
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>
                                Your ticket
                            </p>
                            <p className="text-sm font-bold mt-0.5" style={{ color: themeStyles.text }}>
                                {quantity} × {ticketType}
                            </p>
                        </div>
                        <p className="text-base font-black" style={{ color: ticketSubtotal === 0 ? '#10b981' : '#9575CD' }}>
                            {ticketSubtotal === 0 ? 'FREE' : `₹${ticketSubtotal.toLocaleString()}`}
                        </p>
                    </div>

                    {/* Notice for free events with addons */}
                    {ticketSubtotal === 0 && (hasFood || hasAcc) && (
                        <div
                            className="flex items-start gap-2.5 px-4 py-3 rounded-xl text-xs"
                            style={{
                                background: isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.06)',
                                border: '1px solid rgba(16,185,129,0.2)',
                                color: isDark ? 'rgba(52,211,153,0.9)' : '#065f46',
                            }}
                        >
                            <span className="text-base leading-none shrink-0">ℹ️</span>
                            <span className="font-medium leading-relaxed">
                                This event is <strong>free to attend</strong>. Add-ons below are optional paid extras — selecting them will open a payment step.
                            </span>
                        </div>
                    )}

                    {/* Food section */}
                    {hasFood && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Utensils className="w-4 h-4 text-indigo-400" />
                                <p className="text-sm font-bold" style={{ color: themeStyles.text }}>Food Catering</p>
                                <span
                                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                    style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}
                                >
                                    Optional
                                </span>
                            </div>
                            <div className="space-y-2">
                                {foodItems.map((item: any, idx: number) => {
                                    const isSelected = selectedFoodIndex === idx;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedFoodIndex(isSelected ? null : idx)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border"
                                            style={{
                                                background: isSelected
                                                    ? isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.08)'
                                                    : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                borderColor: isSelected ? 'rgba(99,102,241,0.4)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                            }}
                                        >
                                            {/* Image */}
                                            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-black/10 flex items-center justify-center">
                                                {item.food_picture ? (
                                                    <img src={getTicketImageUrl(item.food_picture)} alt={item.food_catering_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Utensils className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate" style={{ color: themeStyles.text }}>
                                                    {item.food_catering_name || item.name}
                                                </p>
                                                {item.food_menu?.length > 0 && (
                                                    <p className="text-[11px] truncate mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                                                        {item.food_menu.slice(0, 3).join(' · ')}
                                                        {item.food_menu.length > 3 ? ` +${item.food_menu.length - 3}` : ''}
                                                    </p>
                                                )}
                                                <p className="text-[11px] mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
                                                    Qty available: {item.food_quantity}
                                                </p>
                                            </div>
                                            {/* Price + check */}
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <p className="text-sm font-black" style={{ color: '#818cf8' }}>+₹{item.food_price}</p>
                                                <div
                                                    className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
                                                    style={{
                                                        background: isSelected ? '#818cf8' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                                        border: isSelected ? 'none' : isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                                                    }}
                                                >
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Accommodation section */}
                    {hasAcc && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Hotel className="w-4 h-4 text-purple-400" />
                                <p className="text-sm font-bold" style={{ color: themeStyles.text }}>Accommodation</p>
                                <span
                                    className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                                    style={{ background: 'rgba(149,117,205,0.12)', color: '#c4b5fd' }}
                                >
                                    Optional
                                </span>
                            </div>
                            <div className="space-y-2">
                                {accItems.map((item: any, idx: number) => {
                                    const isSelected = selectedAccIndex === idx;
                                    return (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedAccIndex(isSelected ? null : idx)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left border"
                                            style={{
                                                background: isSelected
                                                    ? isDark ? 'rgba(149,117,205,0.15)' : 'rgba(149,117,205,0.08)'
                                                    : isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                                borderColor: isSelected ? 'rgba(149,117,205,0.4)' : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                            }}
                                        >
                                            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-black/10 flex items-center justify-center">
                                                {item.accommodation_picture ? (
                                                    <img src={getTicketImageUrl(item.accommodation_picture)} alt={item.accommodation_catering_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Hotel className="w-5 h-5 text-gray-400" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate" style={{ color: themeStyles.text }}>
                                                    {item.accommodation_catering_name || item.name}
                                                </p>
                                                {item.accommodation_type?.length > 0 && (
                                                    <p className="text-[11px] truncate mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                                                        {item.accommodation_type.slice(0, 3).join(' · ')}
                                                    </p>
                                                )}
                                                <p className="text-[11px] mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
                                                    Rooms available: {item.accommodation_quantity}
                                                </p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <p className="text-sm font-black" style={{ color: '#c4b5fd' }}>+₹{item.accommodation_price}</p>
                                                <div
                                                    className="w-5 h-5 rounded-full flex items-center justify-center transition-all"
                                                    style={{
                                                        background: isSelected ? '#9575CD' : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                                        border: isSelected ? 'none' : isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid rgba(0,0,0,0.1)',
                                                    }}
                                                >
                                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Running total — only show addon delta for free-ticket events */}
                    {(selectedFoodIndex !== null || selectedAccIndex !== null) && (
                        <div
                            className="flex items-center justify-between px-4 py-3 rounded-xl"
                            style={{
                                background: 'linear-gradient(135deg, rgba(136,96,217,0.12), rgba(99,102,241,0.08))',
                                border: '1px solid rgba(136,96,217,0.2)',
                            }}
                        >
                            <div className="space-y-1">
                                <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)' }}>
                                    {ticketSubtotal === 0 ? 'Add-ons total' : 'New total'}
                                </p>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px]" style={{ color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)' }}>
                                    {ticketSubtotal > 0 && <span>Ticket ₹{ticketSubtotal}</span>}
                                    {selectedFoodIndex !== null && foodPrice > 0 && <span>{ticketSubtotal > 0 ? '+ ' : ''}Food ₹{foodPrice}</span>}
                                    {selectedAccIndex !== null && accPrice > 0 && <span>{ticketSubtotal > 0 || (selectedFoodIndex !== null && foodPrice > 0) ? '+ ' : ''}Acc ₹{accPrice}</span>}
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xl font-black" style={{ color: '#9575CD' }}>
                                    ₹{(ticketSubtotal === 0 ? foodPrice + accPrice : total).toLocaleString()}
                                </p>
                                {ticketSubtotal === 0 && (
                                    <p className="text-[10px] mt-0.5" style={{ color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
                                        via Razorpay
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer actions */}
                <div
                    className="px-6 py-4 flex gap-3 shrink-0"
                    style={{ borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)' }}
                >
                    <button
                        onClick={onSkip}
                        className="flex items-center justify-center gap-1.5 h-11 px-5 rounded-full text-sm font-bold transition-all border"
                        style={{
                            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
                        }}
                    >
                        <SkipForward className="w-3.5 h-3.5" />
                        Skip
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 h-11 rounded-full text-white text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
                        style={{ background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)' }}
                    >
                        {(() => {
                            const addonTotal = (ticketSubtotal === 0 ? 0 : ticketSubtotal) +
                                (selectedFoodIndex !== null ? foodPrice : 0) +
                                (selectedAccIndex !== null ? accPrice : 0);
                            const hasSelection = selectedFoodIndex !== null || selectedAccIndex !== null;
                            const payableAddon = (selectedFoodIndex !== null ? foodPrice : 0) + (selectedAccIndex !== null ? accPrice : 0);

                            if (!hasSelection) return <>Continue without add-ons <ChevronRight className="w-4 h-4" /></>;
                            if (ticketSubtotal === 0 && payableAddon > 0) {
                                return <>Pay ₹{payableAddon.toLocaleString()} for add-ons <ChevronRight className="w-4 h-4" /></>;
                            }
                            return <>Add & Continue — ₹{addonTotal.toLocaleString()} <ChevronRight className="w-4 h-4" /></>;
                        })()}
                    </button>
                </div>
            </div>
        </div>
    );
};