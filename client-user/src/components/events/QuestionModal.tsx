'use client';

import React, { useState } from 'react';
import { X, ChevronRight } from 'lucide-react';
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
    answer_type: 'string' | 'number' | 'boolean' | 'text' | 'select';
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
                if (val === undefined || val === null || String(val).trim() === '') {
                    errs[q.question_id] = `${q.question_text} is required`;
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

    const inputBase =
        'w-full px-4 rounded-xl text-sm font-medium outline-none transition-all';

    const inputStyle = (hasError: boolean): React.CSSProperties => ({
        background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        border: hasError
            ? '1px solid rgba(224,82,82,0.6)'
            : isDark
                ? '1px solid rgba(255,255,255,0.08)'
                : '1px solid rgba(0,0,0,0.08)',
        color: themeStyles.text,
    });

    const mutedColor: React.CSSProperties = {
        color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
    };

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
                                className="flex-1 h-11 rounded-xl text-sm font-bold transition-all border"
                                style={{
                                    background: active
                                        ? 'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)'
                                        : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                    borderColor: active
                                        ? '#8860D9'
                                        : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
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
                <select
                    value={String(val)}
                    onChange={(e) => setCustom(q.question_id, e.target.value)}
                    className={`${inputBase} h-11`}
                    style={inputStyle(err)}
                >
                    <option value="">Select an option</option>
                    {q.options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
            );
        }

        if (q.answer_type === 'text') {
            return (
                <textarea
                    value={String(val)}
                    onChange={(e) => setCustom(q.question_id, e.target.value)}
                    placeholder="Enter your answer"
                    rows={3}
                    className={`${inputBase} py-3 resize-none`}
                    style={inputStyle(err)}
                />
            );
        }

        // string | number
        return (
            <input
                type={q.answer_type === 'number' ? 'number' : 'text'}
                value={String(val)}
                onChange={(e) => {
                    const next =
                        q.answer_type === 'number' ? Number(e.target.value) : e.target.value;
                    setCustom(q.question_id, next);
                }}
                placeholder="Enter your answer"
                className={`${inputBase} h-11`}
                style={inputStyle(err)}
            />
        );
    };

    if (!hasAnyField) return null;

    return (
        <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <div
                className="relative w-full max-w-[440px] max-h-[90vh] rounded-3xl border shadow-2xl flex flex-col overflow-hidden"
                style={{
                    background: isDark ? 'rgba(26, 28, 46, 0.92)' : 'rgba(255,255,255,0.97)',
                    backdropFilter: 'blur(40px)',
                    borderColor: isDark ? 'rgba(149,117,205,0.2)' : 'rgba(0,0,0,0.07)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className="px-6 pt-6 pb-4 flex items-start justify-between shrink-0"
                    style={{
                        borderBottom: isDark
                            ? '1px solid rgba(255,255,255,0.06)'
                            : '1px solid rgba(0,0,0,0.06)',
                    }}
                >
                    <div>
                        <p
                            className="text-[10px] font-bold uppercase tracking-[0.2em] mb-1"
                            style={{ color: '#9575CD' }}
                        >
                            Event Registration
                        </p>
                        <h3
                            className="text-base font-bold leading-tight"
                            style={{ color: themeStyles.text }}
                        >
                            {eventName}
                        </h3>
                        <p className="text-xs mt-1" style={mutedColor}>
                            Please fill in the required information below
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full transition-all hover:bg-white/10 active:scale-95 ml-3 shrink-0"
                    >
                        <X className="w-4 h-4" style={mutedColor} />
                    </button>
                </div>

                {/* Scrollable fields */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
                    {/* Standard predefined fields */}
                    {stdFields.map((field) => (
                        <div key={field.key}>
                            <label
                                className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                                style={mutedColor}
                            >
                                {field.label} <span style={{ color: '#E05252' }}>*</span>
                            </label>
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
                                className={`${inputBase} h-11`}
                                style={inputStyle(!!errors[field.key])}
                            />
                            {errors[field.key] && (
                                <p className="text-[11px] mt-1" style={{ color: '#E05252' }}>
                                    {errors[field.key]}
                                </p>
                            )}
                        </div>
                    ))}

                    {/* Custom questions */}
                    {customQuestions.map((q) => (
                        <div key={q.question_id}>
                            <label
                                className="block text-[10px] font-bold uppercase tracking-widest mb-1.5"
                                style={mutedColor}
                            >
                                {q.question_text}
                                {q.is_required && (
                                    <span style={{ color: '#E05252' }}> *</span>
                                )}
                            </label>
                            {renderCustomInput(q)}
                            {errors[q.question_id] && (
                                <p className="text-[11px] mt-1" style={{ color: '#E05252' }}>
                                    {errors[q.question_id]}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div
                    className="px-6 py-4 flex gap-3 shrink-0"
                    style={{
                        borderTop: isDark
                            ? '1px solid rgba(255,255,255,0.06)'
                            : '1px solid rgba(0,0,0,0.06)',
                    }}
                >
                    <button
                        onClick={onClose}
                        className="flex-1 h-11 rounded-full text-sm font-bold transition-all flex items-center justify-center border"
                        style={{
                            borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)',
                            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)',
                        }}
                    >
                        Back
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="flex-1 h-11 rounded-full text-white text-sm font-bold transition-all flex items-center justify-center gap-2 active:scale-95"
                        style={{
                            background:
                                'linear-gradient(180deg, #B3B8E2 0%, #8860D9 50%, #9575CD 100%)',
                        }}
                    >
                        Continue <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};