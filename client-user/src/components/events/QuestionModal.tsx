'use client';

import React, { useState } from 'react';
import { X, ChevronRight, User, Mail, Phone, Briefcase, ChevronDown, FileText, Hash, HelpCircle } from 'lucide-react';
import { useTheme } from '@/components/home/ThemeContext';

export interface QuestionAnswers {
    name: string;
    email: string;
    phone_number: string;
    position: string;
    custom_answers: Record<string, string | number | boolean>;
}

export interface CustomQuestion {
    question_id: string;
    question_text: string;
    answer_type: 'string' | 'number' | 'boolean' | 'text' | 'select' | 'textarea' | 'checkbox';
    is_required: boolean;
    options: string[];
}

// Explicit union so TypeScript knows exactly what keys are valid
type StdFieldKey = 'name' | 'email' | 'phone_number' | 'position';

interface QuestionDetailsShape {
    name?: boolean;
    email?: boolean;
    phone_number?: boolean;
    position?: boolean;
    custom_questions?: CustomQuestion[];
}

interface QuestionModalProps {
    show: boolean;
    onClose: () => void;
    onSubmit: (answers: QuestionAnswers) => void;
    questionDetails: QuestionDetailsShape;
    eventName: string;
}

interface StdField {
    key: StdFieldKey;
    label: string;
    type: string;
    placeholder: string;
}

type StdAnswers = Record<StdFieldKey, string>;
type CustomAnswerMap = Record<string, string | number | boolean>;
type ErrorMap = Record<string, string>;

export const QuestionModal: React.FC<QuestionModalProps> = ({
    show,
    onClose,
    onSubmit,
    questionDetails,
    eventName,
}) => {
    const { isDark, themeStyles } = useTheme();
    const [stdAnswers, setStdAnswers] = useState<StdAnswers>({
        name: '',
        email: '',
        phone_number: '',
        position: '',
    });

    const initialCustom: CustomAnswerMap = {};
    const [customAnswers, setCustomAnswers] = useState(initialCustom);

    const initialErrors: ErrorMap = {};
    const [errors, setErrors] = useState(initialErrors);

    if (!show) return null;

    // Typed definition — key is StdFieldKey, never string
    const ALL_STD_FIELDS: StdField[] = [
        { key: 'name', label: 'Full Name', type: 'text', placeholder: 'Enter your full name' },
        { key: 'email', label: 'Email Address', type: 'email', placeholder: 'Enter your email' },
        { key: 'phone_number', label: 'Phone Number', type: 'tel', placeholder: 'Enter your phone number' },
        { key: 'position', label: 'Position / Role', type: 'text', placeholder: 'Enter your position or role' },
    ];

    // Filter using explicit key lookup — avoids the index-signature error
    const stdFields: StdField[] = ALL_STD_FIELDS.filter(
        (f) => questionDetails[f.key] === true
    );

    const customQuestions: CustomQuestion[] = Array.isArray(
        questionDetails.custom_questions
    )
        ? questionDetails.custom_questions
        : [];

    const hasAnyField = stdFields.length > 0 || customQuestions.length > 0;

    const validate = (): boolean => {
        const errs: ErrorMap = {};

        stdFields.forEach((f) => {
            if (!stdAnswers[f.key]?.trim()) {
                errs[f.key] = `${f.label} is required`;
            }
            if (
                f.key === 'email' &&
                stdAnswers.email &&
                !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(stdAnswers.email)
            ) {
                errs.email = 'Enter a valid email address';
            }
        });

        customQuestions.forEach((q) => {
            if (q.is_required) {
                const val = customAnswers[q.question_id];
                if (q.answer_type === 'checkbox') {
                    if (!val) {
                        errs[q.question_id] = `${q.question_text} is required`;
                    }
                } else {
                    if (val === undefined || val === null || String(val).trim() === '') {
                        errs[q.question_id] = `${q.question_text} is required`;
                    }
                }
            }
        });

        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (validate()) {
            onSubmit({
                name: stdAnswers.name,
                email: stdAnswers.email,
                phone_number: stdAnswers.phone_number,
                position: stdAnswers.position,
                custom_answers: customAnswers,
            });
        }
    };

    const inputClassName = (hasError: boolean, hasIcon: boolean = false, isTextarea: boolean = false) => `
        w-full ${hasIcon ? 'pl-11 pr-4' : 'px-4'} ${isTextarea ? 'py-3' : 'h-11'} rounded-xl text-sm font-medium outline-none transition-all duration-200
        ${hasError
            ? 'border-red-500/50 bg-red-50/5 dark:bg-red-500/5 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
            : isDark
                ? 'border-white/10 bg-white/[0.04] hover:bg-white/[0.06] hover:border-white/20 focus:border-[#8860D9] focus:bg-white/[0.08] focus:ring-4 focus:ring-[#8860D9]/15'
                : 'border-black/10 bg-black/[0.02] hover:bg-black/[0.04] hover:border-black/20 focus:border-[#8860D9] focus:bg-white focus:ring-4 focus:ring-[#8860D9]/15'
        }
        border
    `;

    const inputStyle = (): React.CSSProperties => ({
        color: themeStyles.text,
    });

    const setCustom = (id: string, val: string | number | boolean) => {
        setCustomAnswers((prev) => {
            const next: CustomAnswerMap = { ...prev, [id]: val };
            return next;
        });
        if (errors[id]) {
            setErrors((prev) => {
                const next: ErrorMap = { ...prev, [id]: '' };
                return next;
            });
        }
    };

    const getFieldIcon = (key: StdFieldKey) => {
        const iconClass = "absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-[#8860D9] transition-colors duration-200 pointer-events-none";
        switch (key) {
            case 'name':
                return <User className={iconClass} />;
            case 'email':
                return <Mail className={iconClass} />;
            case 'phone_number':
                return <Phone className={iconClass} />;
            case 'position':
                return <Briefcase className={iconClass} />;
        }
    };

    const renderCustomInput = (q: CustomQuestion) => {
        const val = customAnswers[q.question_id] ?? '';
        const err = !!errors[q.question_id];

        if (q.answer_type === 'boolean') {
            return (
                <div className="flex gap-3">
                    {(['Yes', 'No'] as const).map((opt) => {
                        const boolVal = opt === 'Yes';
                        const active = val === boolVal;
                        return (
                            <button
                                key={opt}
                                type="button"
                                onClick={() => setCustom(q.question_id, boolVal)}
                                className="flex-1 h-11 rounded-xl text-sm font-bold transition-all border shadow-sm active:scale-95"
                                style={{
                                    background: active
                                        ? 'linear-gradient(135deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)'
                                        : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                                    borderColor: active
                                        ? '#8860D9'
                                        : isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                                    color: active ? '#fff' : themeStyles.text,
                                }}
                            >
                                {opt}
                            </button>
                        );
                    })}
                </div>
            );
        }

        if (q.answer_type === 'select' && q.options.length > 0) {
            return (
                <div className="relative w-full">
                    <select
                        value={String(val)}
                        onChange={(e) => setCustom(q.question_id, e.target.value)}
                        className={`${inputClassName(err, false)} pr-10 appearance-none`}
                        style={inputStyle()}
                    >
                        <option value="" className={isDark ? 'bg-[#1A1C2E] text-slate-400' : 'bg-white text-gray-500'}>Select an option</option>
                        {q.options.map((opt) => (
                            <option key={opt} value={opt} className={isDark ? 'bg-[#1A1C2E] text-white' : 'bg-white text-[#1A1C2E]'}>
                                {opt}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 pointer-events-none" />
                </div>
            );
        }

        if (q.answer_type === 'textarea') {
            return (
                <textarea
                    value={String(val)}
                    onChange={(e) => setCustom(q.question_id, e.target.value)}
                    placeholder="Enter your answer"
                    rows={3}
                    className={`${inputClassName(err, false, true)} resize-none h-auto`}
                    style={inputStyle()}
                />
            );
        }

        if (q.answer_type === 'checkbox') {
            const isChecked = !!val;
            return (
                <label
                    className="flex items-center gap-3 cursor-pointer py-1.5 select-none w-fit group"
                    onClick={() => setCustom(q.question_id, !isChecked)}
                >
                    <div
                        className="w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-200 active:scale-90"
                        style={{
                            background: isChecked
                                ? 'linear-gradient(135deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)'
                                : isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
                            borderColor: isChecked
                                ? '#8860D9'
                                : isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)',
                        }}
                    >
                        {isChecked && (
                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                    <span className="text-sm font-semibold transition-colors group-hover:text-purple-400" style={{ color: themeStyles.text }}>
                        Please check/confirm
                    </span>
                </label>
            );
        }

        if (q.answer_type === 'text' || q.answer_type === 'string') {
            return (
                <div className="relative group">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-[#8860D9] transition-colors duration-200 pointer-events-none" />
                    <input
                        type="text"
                        value={String(val)}
                        onChange={(e) => setCustom(q.question_id, e.target.value)}
                        placeholder="Enter your answer"
                        className={inputClassName(err, true)}
                        style={inputStyle()}
                    />
                </div>
            );
        }

        if (q.answer_type === 'number') {
            return (
                <div className="relative group">
                    <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-[#8860D9] transition-colors duration-200 pointer-events-none" />
                    <input
                        type="number"
                        value={String(val)}
                        onChange={(e) => {
                            const next = e.target.value === '' ? '' : Number(e.target.value);
                            setCustom(q.question_id, next);
                        }}
                        placeholder="Enter your answer"
                        className={inputClassName(err, true)}
                        style={inputStyle()}
                    />
                </div>
            );
        }

        return (
            <div className="relative group">
                <HelpCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500 group-focus-within:text-[#8860D9] transition-colors duration-200 pointer-events-none" />
                <input
                    type="text"
                    value={String(val)}
                    onChange={(e) => setCustom(q.question_id, e.target.value)}
                    placeholder="Enter your answer"
                    className={inputClassName(err, true)}
                    style={inputStyle()}
                />
            </div>
        );
    };

    if (!hasAnyField) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="relative w-[95vw] sm:w-full sm:max-w-[420px] rounded-3xl border shadow-2xl overflow-hidden flex flex-col transition-all duration-500 transform scale-100 opacity-100 translate-y-0"
                style={{
                    background: isDark ? 'rgba(26, 28, 46, 0.75)' : 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    borderColor: isDark ? 'rgba(149, 117, 205, 0.15)' : 'rgba(0, 0, 0, 0.05)',
                    boxShadow: isDark ? '0 40px 100px rgba(0,0,0,0.6)' : '0 20px 50px rgba(0,0,0,0.1)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className={`absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full transition-all active:scale-95 z-20 group ${isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                >
                    <X className={`w-5 h-5 transition-colors ${isDark ? 'text-white/50 group-hover:text-white' : 'text-gray-500 group-hover:text-gray-900'}`} />
                </button>

                {/* Header */}
                <div className="pt-8 pb-4 text-center px-6">
                    <p
                        className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5"
                        style={{ color: '#9575CD' }}
                    >
                        Event Registration
                    </p>
                    <h3
                        className={`text-[20px] font-bold leading-tight line-clamp-2 px-2 ${isDark ? 'text-white' : 'text-gray-900'}`}
                    >
                        {eventName}
                    </h3>
                    <p className={`text-[12px] mt-2 font-medium px-4 ${isDark ? 'text-[#94A3B8]' : 'text-gray-500'}`}>
                        Please fill in the required information below
                    </p>
                </div>

                {/* Scrollable fields */}
                <div className="px-6 pb-6 space-y-5 overflow-y-auto overflow-x-hidden custom-scrollbar max-h-[60vh] flex-1">
                    {/* Standard predefined fields */}
                    {stdFields.map((field) => (
                        <div key={field.key} className="space-y-2 flex flex-col items-stretch">
                            <label
                                className={`text-[11px] font-bold uppercase tracking-widest px-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}
                            >
                                {field.label} <span className="text-red-500 font-bold">*</span>
                            </label>
                            <div className="relative group">
                                {getFieldIcon(field.key)}
                                <input
                                    type={field.type}
                                    value={stdAnswers[field.key]}
                                    onChange={(e) => {
                                        setStdAnswers((prev) => ({ ...prev, [field.key]: e.target.value }));
                                        if (errors[field.key]) {
                                            setErrors((prev) => {
                                                const next: ErrorMap = { ...prev, [field.key]: '' };
                                                return next;
                                            });
                                        }
                                    }}
                                    placeholder={field.placeholder}
                                    className={inputClassName(!!errors[field.key], true)}
                                    style={inputStyle()}
                                />
                            </div>
                            {errors[field.key] && (
                                <p className="text-[12px] font-semibold text-red-500 px-1 animate-in fade-in duration-200">
                                    {errors[field.key]}
                                </p>
                            )}
                        </div>
                    ))}

                    {/* Custom questions */}
                    {customQuestions.map((q) => (
                        <div key={q.question_id} className="space-y-2 flex flex-col items-stretch">
                            <label
                                className={`text-[11px] font-bold uppercase tracking-widest px-1 ${isDark ? 'text-[#64748B]' : 'text-gray-500'}`}
                            >
                                {q.question_text}
                                {q.is_required && (
                                    <span className="text-red-500 font-bold"> *</span>
                                )}
                            </label>
                            {renderCustomInput(q)}
                            {errors[q.question_id] && (
                                <p className="text-[12px] font-semibold text-red-500 px-1 animate-in fade-in duration-200">
                                    {errors[q.question_id]}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                <div className="px-6 pb-8 flex gap-3 justify-center items-center mt-auto w-full">
                    <button
                        onClick={onClose}
                        style={{
                            height: '40px',
                            borderRadius: '20px',
                            border: isDark ? '0.4px solid #9575CD' : '1px solid #9575CD',
                            background: isDark ? "rgba(179, 184, 226, 0.1)" : "rgba(149, 117, 205, 0.05)",
                            color: isDark ? "#FFFFFF" : "#1A1C2E",
                        }}
                        className="flex-1 max-w-[145px] text-[12px] sm:text-[13px] font-bold transition-all flex items-center justify-center hover:brightness-110 active:scale-95"
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        style={{
                            height: '40px',
                            borderRadius: '20px',
                            background: 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
                        }}
                        className="flex-1 max-w-[145px] text-white text-[12px] sm:text-[13px] font-bold shadow-lg shadow-purple-500/10 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                        Continue <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
