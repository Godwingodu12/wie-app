'use client';
import React, { useState, useRef, useCallback } from 'react';
import { Calendar, Plus, X, Search, Check, Loader2 } from 'lucide-react';
import { useTheme } from '../home/ThemeContext';
import { ConnectionNavigation } from './ConnectionNavigation';
import { FaceVerificationModal } from './FaceVerificationModal';
import { TopAlert } from '../ui/TopAlert';
import {
  createProfile,
  updateProfile,
  uploadPhotos,
  deletePhoto,
  getPhotos,        
  replacePhoto, 
  updatePrivacy,
  acceptTerms,
} from '../../services/connectionService';

interface UploadedPhoto { url: string; publicId: string; }

export function UserDetail({
  onProgress,
  onComplete,
  initialStep = 1,
  isFaceVerified = false,
}: {
  onProgress: (current: number, total: number) => void;
  onComplete: () => void;
  initialStep?: number; 
  isFaceVerified?: boolean;
}) {
  const { isDark, themeStyles } = useTheme();
  const [step, setStep] = useState(initialStep);
  const totalSteps = 7;
  const [faceVerified, setFaceVerified] =useState(isFaceVerified);
  const [photosLoading,    setPhotosLoading]    = useState(false);
  const [replacingId,      setReplacingId]      = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  interface PhotoValidationState {
    filename: string;
    status: 'uploading' | 'success' | 'error';
    message: string;
  }
  const [alert, setAlert] = useState<{ visible: boolean; message: string; type: 'error' | 'success' }>({
    visible: false, message: '', type: 'error',
  });
  const [photoValidations, setPhotoValidations] = useState<PhotoValidationState[]>([]);
  const showAlert = (message: string, type: 'error' | 'success' = 'error') =>
    setAlert({ visible: true, message, type });

  const [isSaving,    setIsSaving]    = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  // ── Profile form data 
  const [formData, setFormData] = useState({
    name:           '',
    dob:            '',
    city:           '',
    state:          '',
    country:        '',
    qualifications: [] as string[],
    qualInput:      '',
    description:    '',
    orientation:    'Straight',
    interests:      [] as string[],
    hideAccount:    false,
    restrictVideo:  false,
  });

  // Photos 
  const [uploadedPhotos, setUploadedPhotos] = useState<UploadedPhoto[]>([]);
  const [showFaceModal,  setShowFaceModal]  = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  //  Terms 
  const [termsAccepted, setTermsAccepted] = useState(false);

  //  Looking for 
  const [lookingFor, setLookingFor] = useState<string[]>([]);

  //  Stored profileId after creation 
  const [profileCreated, setProfileCreated] = useState(false);

  React.useEffect(() => { onProgress(step, totalSteps); }, [step, onProgress]);
  React.useEffect(() => {
      if (step !== 2 || uploadedPhotos.length > 0) return;  // skip if already loaded
  
      (async () => {
        setPhotosLoading(true);
        try {
          const res = await getPhotos();
          if (res.success && res.data.photos.length > 0) {
            setUploadedPhotos(
              res.data.photos.map((p: any) => ({ url: p.url, publicId: p.publicId }))
            );
          }
        } catch {
          // silent — user just sees empty grid and can upload
        } finally {
          setPhotosLoading(false);
        }
      })();
    }, [step]);
  //  Validation helpers 
  const validateStep = (): string | null => {
    switch (step) {
      case 1:
        if (!formData.name.trim())    return 'Please enter your display name.';
        if (!formData.dob.trim())     return 'Please enter your date of birth.';
        if (!formData.city.trim())    return 'Please enter your city.';
        if (!formData.country.trim()) return 'Please enter your country.';
        // Basic age check
        const parts = formData.dob.split('/');
        if (parts.length === 3) {
          const [d, m, y] = parts.map(Number);
          const birth = new Date(y < 100 ? 2000 + y : y, m - 1, d);
          const age   = Math.floor((Date.now() - birth.getTime()) / 31557600000);
          if (isNaN(age) || age < 18) return 'You must be at least 18 years old.';
        }
        return null;
      case 2:
        if (uploadedPhotos.length < 2) return 'Please upload at least 2 photos.';
        return null;
      case 3:
        if (!formData.orientation) return 'Please select your sexual orientation.';
        return null;
      case 4:
        if (formData.interests.length === 0) return 'Please select at least one interest.';
        return null;
      case 6:
        if (!termsAccepted) return 'Please accept the terms and conditions to continue.';
        return null;
      case 7:
        if (lookingFor.length === 0) return 'Please select at least one option.';
        return null;
      default:
        return null;
    }
  };

  // ── API: create/update profile after step 1 
  const saveProfileStep1 = async () => {
    const [d, m, y] = formData.dob.split('/').map(Number);
    const dob       = new Date(y < 100 ? 2000 + y : y, m - 1, d);

    const payload = {
      displayName:         formData.name.trim(),
      dateOfBirth:         dob.toISOString(),
      location: {
        city:    formData.city.trim(),
        state:   formData.state.trim() || formData.city.trim(),
        country: formData.country.trim(),
        latitude:  0,
        longitude: 0,
      },
      qualifications:      formData.qualifications,
      personalDescription: formData.description.trim(),
      gender:              'prefer-not-to-say',   // updated in step 3
    };

    if (!profileCreated) {
      await createProfile(payload);
      setProfileCreated(true);
    } else {
      await updateProfile(payload);
    }
  };

  // ── API: save orientation after step 3 ───────────────────────
  const saveOrientation = async () => {
    await updateProfile({
      sexualOrientation: { type: formData.orientation.toLowerCase(), private: true },
    } as any);
  };

  // ── API: save interests after step 4 ─────────────────────────
  const saveInterests = async () => {
    await updateProfile({
      interests: [{ category: 'general', tags: formData.interests }],
    } as any);
  };

  // ── API: save privacy after step 5 ───────────────────────────
  const savePrivacy = async () => {
    await updatePrivacy({
      hideAccountFromOthers: formData.hideAccount,
      restrictVideoCall:     formData.restrictVideo,
    });
  };

  // API: accept terms after step 6 
  const saveTerms = async () => {
    await acceptTerms();
  };

  const handleNext = async () => {
    const err = validateStep();
    if (err) { showAlert(err); return; }
    if (step === 2) {
      if (uploadedPhotos.length < 2) {
        showAlert('Please upload at least 2 photos before continuing.');
        return;
      }
      // Guard: cannot advance past step 2 without face verification
      if (!faceVerified) {
        setShowFaceModal(true);
        return;
      }
      // Verified — save step 1 data if not yet saved, then advance
      if (!profileCreated) {
        setIsSaving(true);
        try {
          await saveProfileStep1();
        } catch (e: any) {
          showAlert(e?.response?.data?.message || 'Something went wrong.');
          setIsSaving(false);
          return;
        } finally {
          setIsSaving(false);
        }
      }
      setStep((s) => s + 1);
      return;
    }
  
    setIsSaving(true);
    try {
      if (step === 1) await saveProfileStep1();
      if (step === 3) await saveOrientation();
      if (step === 4) await saveInterests();
      if (step === 5) await savePrivacy();
      if (step === 6) await saveTerms();
      if (step === 7) {
        await updateProfile({
          interests: [
            { category: 'general',     tags: formData.interests },
            { category: 'looking-for', tags: lookingFor },
          ],
        } as any);
        showAlert('Profile created successfully!', 'success');
        setTimeout(onComplete, 800);
        return;
      }
      setStep((s) => s + 1);
    } catch (e: any) {
      showAlert(e?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep((s) => s - 1);
  };

  // Photo upload handler 
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
  
    const remaining = 6 - uploadedPhotos.length;
    const toUpload  = files.slice(0, remaining);
  
    // Show "Validating…" row for every selected file immediately
    const initStates: PhotoValidationState[] = toUpload.map((f) => ({
      filename: f.name,
      status:   'uploading' as const,
      message:  'Uploading…',
    }));
    setPhotoValidations(initStates);
    setIsUploading(true);
  
    const finalStates: PhotoValidationState[] = [...initStates];
  
    for (let i = 0; i < toUpload.length; i++) {
      const file = toUpload[i];
      try {
        const res = await uploadPhotos([file]);
  
        // uploadPhotos() resolved → server returned 2xx
        finalStates[i] = {
          filename: file.name,
          status:   'success',
          message:  'Uploaded successfully',
        };
        setUploadedPhotos((prev) => [...prev, ...res.data.photos]);
  
      } catch (err: any) {
        // uploadPhotos() threw → server returned 4xx / 5xx
        // Dig through the axios error for the most helpful message:
        const data      = err?.response?.data;
        const serverMsg =
          data?.message ||          // our standard { success, message } shape
          data?.error   ||          // fallback key
          (typeof data === 'string' ? data : null) ||
          err?.message  ||          // axios / network error
          'Upload failed. Please try again.';
  
        finalStates[i] = {
          filename: file.name,
          status:   'error',
          message:  serverMsg,
        };
  
        // Also fire TopAlert for immediate visibility
        showAlert(`${file.name}: ${serverMsg}`, 'error');
      }
  
      // Re-render after every file so the user sees live progress
      setPhotoValidations([...finalStates]);
    }
  
    // Summary alert when uploading multiple files
    const successCount = finalStates.filter((s) => s.status === 'success').length;
    const failCount    = finalStates.filter((s) => s.status === 'error').length;
  
    if (toUpload.length > 1) {
      if (failCount === 0) {
        showAlert(`${successCount} photo(s) uploaded successfully.`, 'success');
      } else if (successCount > 0) {
        showAlert(`${successCount} uploaded, ${failCount} rejected — see details below.`, 'error');
      }
    } else if (successCount === 1) {
      showAlert('Photo uploaded successfully.', 'success');
    }
  
    setIsUploading(false);
    e.target.value = '';    // reset input so same file can be re-selected after fix
  };

  const handleDeletePhoto = async (publicId: string) => {
    try {
      await deletePhoto(publicId);
      setUploadedPhotos((prev) => prev.filter((p) => p.publicId !== publicId));
    } catch {
      showAlert('Failed to delete photo. Please try again.');
    }
  };
  const handleReplacePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !replacingId) return;
  
      setIsUploading(true);
      setPhotoValidations([{ filename: file.name, status: 'uploading', message: 'Replacing photo…' }]);
  
      try {
        const res = await replacePhoto(replacingId, file);
        if (res.success) {
          // Update the photo in local state at the same position
          setUploadedPhotos((prev) =>
            prev.map((p) =>
              p.publicId === replacingId
                ? { url: res.data.photo.url, publicId: res.data.photo.publicId }
                : p
            )
          );
          setPhotoValidations([{ filename: file.name, status: 'success', message: 'Photo replaced successfully' }]);
          showAlert('Photo replaced successfully.', 'success');
        } else {
          setPhotoValidations([{ filename: file.name, status: 'error', message: res.message }]);
          showAlert(res.message || 'Replace failed.', 'error');
        }
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Replace failed.';
        setPhotoValidations([{ filename: file.name, status: 'error', message: msg }]);
        showAlert(msg, 'error');
      } finally {
        setIsUploading(false);
        setReplacingId(null);
        e.target.value = '';
      }
    };
  const addQualification = () => {
    const q = formData.qualInput.trim();
    if (!q) return;
    if (formData.qualifications.includes(q)) { showAlert('Already added.'); return; }
    setFormData((f) => ({ ...f, qualifications: [...f.qualifications, q], qualInput: '' }));
  };

  // ─────────────────────────────────────────────────────────────
  // Render steps
  // ─────────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {

      // ── STEP 1: Basic details ─────────────────────────────────
      case 1:
        return (
          <div className="space-y-6 pt-8 animate-in fade-in slide-in-from-right-4 duration-300 w-full">
            <div className="space-y-2 text-left">
              <h1 className="text-3xl md:text-4xl font-semibold" style={{ color: isDark ? themeStyles.text : '#111827' }}>
                Add your details...
              </h1>
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Add your age, location, and qualifications</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
              {/* Left column */}
              <div className="space-y-6 w-full">
                {/* Name */}
                <div className="space-y-2">
                  <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Display Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    placeholder="Enter your name"
                    onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                    className={`w-full h-[50px] px-3 rounded-xl border focus:outline-none focus:border-[#8b5cf6] focus:ring-1 focus:ring-[#8b5cf6] transition-colors ${isDark ? 'border-transparent placeholder-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400'}`}
                    style={{ backgroundColor: isDark ? themeStyles.background : undefined, color: isDark ? themeStyles.text : undefined }}
                  />
                </div>

                {/* City */}
                <div className="space-y-2">
                  <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>City *</label>
                  <input
                    type="text"
                    placeholder="Enter your city"
                    value={formData.city}
                    onChange={(e) => setFormData((f) => ({ ...f, city: e.target.value }))}
                    className={`w-full h-[50px] px-3 rounded-xl border focus:outline-none focus:border-[#8b5cf6] transition-colors ${isDark ? 'border-transparent placeholder-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400'}`}
                    style={{ backgroundColor: isDark ? themeStyles.background : undefined, color: isDark ? themeStyles.text : undefined }}
                  />
                </div>

                {/* State + Country */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>State</label>
                    <input
                      type="text"
                      placeholder="State"
                      value={formData.state}
                      onChange={(e) => setFormData((f) => ({ ...f, state: e.target.value }))}
                      className={`w-full h-[50px] px-3 rounded-xl border focus:outline-none focus:border-[#8b5cf6] transition-colors ${isDark ? 'border-transparent placeholder-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400'}`}
                      style={{ backgroundColor: isDark ? themeStyles.background : undefined, color: isDark ? themeStyles.text : undefined }}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Country *</label>
                    <input
                      type="text"
                      placeholder="Country"
                      value={formData.country}
                      onChange={(e) => setFormData((f) => ({ ...f, country: e.target.value }))}
                      className={`w-full h-[50px] px-3 rounded-xl border focus:outline-none focus:border-[#8b5cf6] transition-colors ${isDark ? 'border-transparent placeholder-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400'}`}
                      style={{ backgroundColor: isDark ? themeStyles.background : undefined, color: isDark ? themeStyles.text : undefined }}
                    />
                  </div>
                </div>

                {/* Qualifications */}
                <div className="space-y-2">
                  <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Qualifications</label>
                  <div
                    className={`w-full min-h-[120px] p-2 rounded-xl border flex flex-col gap-2 ${isDark ? 'border-transparent' : 'bg-gray-50 border-gray-200'}`}
                    style={{ backgroundColor: isDark ? themeStyles.background : undefined }}
                  >
                    <div className={`flex items-center gap-2 px-2 py-2 border-b mb-2 ${isDark ? 'border-white/5' : 'border-gray-200'}`}>
                      <Search size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                      <input
                        type="text"
                        placeholder="Type and add qualification"
                        value={formData.qualInput}
                        onChange={(e) => setFormData((f) => ({ ...f, qualInput: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addQualification(); } }}
                        className={`bg-transparent border-none text-sm focus:outline-none w-full ${isDark ? 'text-white placeholder-gray-600' : 'text-gray-900 placeholder-gray-400'}`}
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 px-2">
                      {formData.qualifications.map((q) => (
                        <span
                          key={q}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm border shadow-sm ${isDark ? 'border-white/10 shadow-none' : 'bg-white text-gray-700 border-gray-200'}`}
                          style={{ backgroundColor: isDark ? themeStyles.pillBg : undefined, color: isDark ? themeStyles.textSecondary : undefined }}
                        >
                          {q}
                          <button
                            onClick={() => setFormData((f) => ({ ...f, qualifications: f.qualifications.filter((x) => x !== q) }))}
                            className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-red-500'}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="mt-auto flex gap-2 pt-2">
                      <input
                        type="text"
                        placeholder="Enter qualification"
                        value={formData.qualInput}
                        onChange={(e) => setFormData((f) => ({ ...f, qualInput: e.target.value }))}
                        className={`flex-1 rounded-lg px-3 py-2 text-sm border focus:outline-none focus:border-[#8b5cf6] ${isDark ? 'border-white/10' : 'bg-white text-gray-900 border-gray-200'}`}
                        style={{ backgroundColor: isDark ? themeStyles.pillBg : undefined, color: isDark ? themeStyles.text : undefined }}
                      />
                      <button
                        onClick={addQualification}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'bg-[#2a2a2a] hover:bg-[#333] text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column */}
              <div className="space-y-4 w-full">
                {/* DOB */}
                <div className="space-y-2">
                  <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Date of Birth * (DD/MM/YY)</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="DD/MM/YY"
                      value={formData.dob}
                      onChange={(e) => setFormData((f) => ({ ...f, dob: e.target.value }))}
                      className={`w-full h-[50px] px-3 rounded-xl border focus:outline-none focus:border-[#8b5cf6] transition-colors ${isDark ? 'border-transparent placeholder-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400'}`}
                      style={{ backgroundColor: isDark ? themeStyles.background : undefined, color: isDark ? themeStyles.text : undefined }}
                    />
                    <Calendar className={`absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} size={18} />
                  </div>
                  <p className={`text-xs ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`}>Not visible to others</p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Personal description (Optional)</label>
                  <textarea
                    placeholder="Describe yourself here.."
                    value={formData.description}
                    onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                    className={`w-full h-56 pt-4 px-3 rounded-xl border focus:outline-none focus:border-[#8b5cf6] transition-colors resize-none ${isDark ? 'border-transparent placeholder-gray-600' : 'bg-gray-50 text-gray-900 border-gray-200 placeholder-gray-400'}`}
                    style={{ backgroundColor: isDark ? themeStyles.background : undefined, color: isDark ? themeStyles.text : undefined }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      // ── STEP 2: Photos ────────────────────────────────────────
      case 2:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-left">
              <h1 className={`text-3xl md:text-4xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Add your best photos...
              </h1>
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                Minimum 2 · Maximum 6 · JPG, PNG, WebP, AVIF · Max 25 MB each
              </p>
            </div>
 
            {/* ── Photo requirements ── */}
            <div className={`rounded-xl p-4 text-xs space-y-1 border ${isDark ? 'border-white/5 bg-white/3' : 'border-gray-100 bg-gray-50'}`}>
              <p className={`font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Photo requirements:</p>
              {[
                '✔ Only you — no group or couple photos',
                '✔ Face clearly visible, front-facing',
                '✔ No sunglasses, masks or helmets',
                '✔ Good lighting — not too dark or overexposed',
                '✔ Sharp, in-focus image',
              ].map((rule) => (
                <p key={rule} className={isDark ? 'text-gray-400' : 'text-gray-500'}>{rule}</p>
              ))}
            </div>
 
            {/* ── Loading skeleton ── */}
            {photosLoading && (
              <div className="flex gap-4 flex-wrap py-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-36 h-36 rounded-2xl animate-pulse ${isDark ? 'bg-white/5' : 'bg-gray-200'}`}
                  />
                ))}
              </div>
            )}
 
            {/* ── Photo grid ── */}
            {!photosLoading && (
              <div className="flex flex-wrap gap-4 py-2">
 
                {uploadedPhotos.map((photo, index) => (
                  <div key={photo.publicId} className="relative group">
                    {/* Photo thumbnail */}
                    <div className={`w-36 h-36 rounded-2xl overflow-hidden border-2 transition-all ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                      <img
                        src={photo.url}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
 
                    {/* Action buttons — shown on hover */}
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 bg-black/40">
 
                      {/* Replace button */}
                      <button
                        onClick={() => {
                          setReplacingId(photo.publicId);
                          replaceInputRef.current?.click();
                        }}
                        disabled={isUploading}
                        title="Replace photo"
                        className="w-9 h-9 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors disabled:opacity-50"
                      >
                        {/* Refresh icon */}
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
 
                      {/* Delete button */}
                      <button
                        onClick={() => handleDeletePhoto(photo.publicId)}
                        disabled={isUploading}
                        title="Delete photo"
                        className="w-9 h-9 rounded-full bg-red-500/90 flex items-center justify-center hover:bg-red-500 transition-colors disabled:opacity-50"
                      >
                        <X size={14} className="text-white" />
                      </button>
                    </div>
 
                    {/* Primary badge */}
                    {index === 0 && (
                      <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] px-2 py-0.5 rounded-full bg-[#8860D9] text-white font-medium whitespace-nowrap pointer-events-none">
                        Primary
                      </span>
                    )}
                  </div>
                ))}
 
                {/* Add photo button — only when under limit */}
                {uploadedPhotos.length < 6 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className={`w-36 h-36 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all group disabled:opacity-50
                      ${isDark ? 'border-white/10 text-gray-400 hover:text-white hover:bg-[#222]' : 'border-gray-300 text-gray-400 hover:text-gray-900 hover:bg-gray-50'}`}
                  >
                    {isUploading && replacingId === null ? (
                      <Loader2 size={24} className="animate-spin text-[#8860D9]" />
                    ) : (
                      <>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#2a2a2a] group-hover:bg-[#333]' : 'bg-gray-200 group-hover:bg-gray-300'}`}>
                          <Plus size={20} />
                        </div>
                        <span className="text-xs font-medium">Add photo</span>
                        <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                          {uploadedPhotos.length}/6
                        </span>
                      </>
                    )}
                  </button>
                )}
 
              </div>
            )}
 
            {/* ── Per-file validation feedback ── */}
            {photoValidations.length > 0 && (
              <div className="space-y-2">
                {photoValidations.map((v, i) => (
                  <div
                    key={i}
                    className={`flex items-start gap-3 px-4 py-3 rounded-xl text-sm border ${
                      v.status === 'success'
                        ? isDark ? 'border-[#1ddb8b]/30 bg-[#1ddb8b]/5 text-[#1ddb8b]' : 'border-green-300 bg-green-50 text-green-700'
                        : v.status === 'error'
                        ? isDark ? 'border-red-500/30 bg-red-500/5 text-red-400' : 'border-red-300 bg-red-50 text-red-600'
                        : isDark ? 'border-white/10 bg-white/3 text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-500'
                    }`}
                  >
                    <span className="mt-0.5 flex-shrink-0">
                      {v.status === 'success' ? '✅' : v.status === 'error' ? '❌' : '⏳'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium truncate text-xs mb-0.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {v.filename}
                      </p>
                      <p className="leading-snug">{v.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
 
            {/* ── Status indicators ── */}
            {!photosLoading && uploadedPhotos.length > 0 && uploadedPhotos.length < 2 && (
              <p className={`text-sm ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`}>
                ⚠ Upload at least {2 - uploadedPhotos.length} more photo{uploadedPhotos.length === 1 ? '' : 's'} (minimum 2 required)
              </p>
            )}
 
            {!photosLoading && uploadedPhotos.length >= 2 && (
              <div className={`rounded-xl p-4 border text-sm flex items-start gap-3 ${isDark ? 'border-[#1ddb8b]/30 bg-[#1ddb8b]/5' : 'border-green-300 bg-green-50'}`}>
                <span className="text-[#1ddb8b] text-lg">✓</span>
                <div>
                  <p className={`font-medium ${isDark ? 'text-[#1ddb8b]' : 'text-green-700'}`}>
                    {uploadedPhotos.length} photo{uploadedPhotos.length > 1 ? 's' : ''} ready
                    {uploadedPhotos.length < 6 && (
                      <span className={`ml-2 font-normal text-xs ${isDark ? 'text-gray-400' : 'text-green-600'}`}>
                        ({6 - uploadedPhotos.length} more slot{uploadedPhotos.length === 5 ? '' : 's'} available)
                      </span>
                    )}
                  </p>
                  <p className={isDark ? 'text-gray-400' : 'text-green-600'}>
                    {faceVerified
                      ? 'Face verified ✓ — click Next to continue'
                      : 'Click "Next" to complete face verification'}
                  </p>
                </div>
              </div>
            )}
 
            {/* Hidden file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/avif,.jfif"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={replaceInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp,image/avif,.jfif"
              className="hidden"
              onChange={handleReplacePhoto}
            />
          </div>
        );

      // ── STEP 3: Sexual orientation ────────────────────────────
      case 3:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2 text-left">
              <h1 className={`text-3xl md:text-4xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                How do you describe your sexual orientation?
              </h1>
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>We ask this to help personalise your experience.</p>
              <p className={`text-sm pt-2 ${isDark ? 'text-yellow-500' : 'text-yellow-600'}`}>This information is not visible to others.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 py-8">
              {[{ label: 'Straight', icon: '⚤' }, { label: 'Lesbian', icon: '⚢' }, { label: 'Gay', icon: '⚣' }].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setFormData((f) => ({ ...f, orientation: item.label }))}
                  className={`h-64 rounded-3xl flex flex-col items-center justify-center gap-6 transition-all duration-300 border ${formData.orientation === item.label ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' scale-105 shadow-xl border-transparent' : (isDark ? 'bg-transparent text-gray-400 hover:bg-[#222] border-white/5' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200')}`}
                >
                  <div className="text-6xl">{item.icon}</div>
                  <span className="text-lg font-medium">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        );

      // ── STEP 4: Interests ─────────────────────────────────────
      case 4: {
        const interestRows = [
          ['Creative Arts', 'Sports & Fitness', 'Music & Entertainment', 'Food & Cooking', 'Travel & Adventure'],
          ['Photography', 'Painting', 'Writing'],
          ['Technology', 'Learning & Intellectual', 'Nature & Animals', 'Social & Community', 'Wellness & Mindfulness'],
          ['Media & Content', 'Home & Lifestyle'],
        ];
        const emojiMap: Record<string, string> = {
          'Creative Arts': '🎨', 'Sports & Fitness': '🏃', 'Music & Entertainment': '🎫',
          'Food & Cooking': '🍳', 'Travel & Adventure': '✈️', 'Photography': '📷',
          'Painting': '🖼️', 'Writing': '✍️', 'Technology': '💻', 'Learning & Intellectual': '📘',
          'Nature & Animals': '🐕', 'Social & Community': '🤝', 'Wellness & Mindfulness': '🧘',
          'Media & Content': '🎬', 'Home & Lifestyle': '🏡',
        };
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h1 className={`text-3xl md:text-4xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Add your interests</h1>
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Select at least one interest.</p>
            </div>
            <div className="space-y-4 py-6">
              {interestRows.map((row, ri) => (
                <div key={ri} className="flex flex-wrap gap-3">
                  {row.map((interest) => {
                    const sel = formData.interests.includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => setFormData((f) => ({
                          ...f,
                          interests: sel
                            ? f.interests.filter((i) => i !== interest)
                            : [...f.interests, interest],
                        }))}
                        className={`px-4 py-3 rounded-full text-sm font-medium transition-all flex items-center gap-2 border ${sel ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' border-transparent' : (isDark ? 'bg-transparent text-gray-400 hover:bg-[#222] border-white/5' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200')}`}
                      >
                        <span>{emojiMap[interest] || '🏡'}</span>
                        {interest}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        );
      }

      // ── STEP 5: Privacy ───────────────────────────────────────
      case 5:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h1 className={`text-3xl md:text-4xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Make your profile secured.</h1>
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>You can hide your name and profile from others.</p>
            </div>
            <div className={`rounded-xl p-8 space-y-8 mt-8 border ${isDark ? 'border-transparent' : 'bg-gray-50 border-gray-200'}`}
              style={{ backgroundColor: isDark ? themeStyles.background : undefined }}
            >
              {[
                { label: 'Hide WIE account from others.', key: 'hideAccount' as const },
                { label: 'Restrict video call option in connection', key: 'restrictVideo' as const },
              ].map(({ label, key }) => (
                <div key={key}>
                  <div className="flex items-center justify-between">
                    <span className={`text-lg ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>{label}</span>
                    <button
                      onClick={() => setFormData((f) => ({ ...f, [key]: !f[key] }))}
                      className={`w-14 h-7 rounded-full transition-colors relative ${formData[key] ? 'bg-[#8b5cf6]' : isDark ? 'bg-gray-600' : 'bg-gray-300'}`}
                    >
                      <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${formData[key] ? 'left-8' : 'left-1'}`} />
                    </button>
                  </div>
                  <div className={`w-full h-px mt-6 ${isDark ? 'bg-blue-500/20' : 'bg-gray-200'}`} />
                </div>
              ))}
            </div>
          </div>
        );

      // ── STEP 6: Terms ─────────────────────────────────────────
      case 6:
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h1 className={`text-3xl md:text-4xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Terms and conditions</h1>
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Please read and accept our terms.</p>
            </div>
            <div className={`rounded-xl p-6 max-h-[400px] overflow-y-auto space-y-4 text-justify leading-relaxed border ${isDark ? 'border-transparent' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
              style={{ backgroundColor: isDark ? themeStyles.background : undefined, color: isDark ? themeStyles.textSecondary : undefined }}
            >
              <p>By creating a WIE Connection Profile, you agree that all photos uploaded are genuine photos of yourself. Uploading photos of other people is strictly prohibited and will result in permanent account suspension.</p>
              <p>Your identity is verified through our face verification system. Attempting to circumvent this system is a violation of our terms.</p>
              <p>You must be at least 18 years of age to use this service.</p>
              <p>WIE reserves the right to review and remove any profile that violates these terms without prior notice.</p>
            </div>
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={() => setTermsAccepted((v) => !v)}
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0 ${termsAccepted ? 'bg-[#8b5cf6] border-[#8b5cf6]' : isDark ? 'border-gray-600 bg-transparent' : 'border-gray-400 bg-transparent'}`}
              >
                {termsAccepted && <Check size={14} className="text-white" />}
              </button>
              <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                I accept the terms and conditions
              </span>
            </div>
          </div>
        );

      // ── STEP 7: Looking for 
      case 7: {
        const opts = [
          { label: 'Travel', emoji: '🏖️' }, { label: 'Relationship', emoji: '💕' },
          { label: 'Location matching', emoji: '📍' }, { label: 'Professional', emoji: '👔' },
          { label: 'Concert Vibing', emoji: '🎸' }, { label: 'Develop Skill', emoji: '🎯' },
          { label: 'Day Outing', emoji: '☕' },
        ];
        return (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="space-y-2">
              <h1 className={`text-3xl md:text-4xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Right now I'm looking for...</h1>
              <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>Select at least one.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-6">
              {opts.map((option) => {
                const sel = lookingFor.includes(option.label);
                return (
                  <button
                    key={option.label}
                    onClick={() => setLookingFor((prev) => sel ? prev.filter((x) => x !== option.label) : [...prev, option.label])}
                    className={`h-32 rounded-2xl flex flex-col items-center justify-center gap-3 transition-all duration-300 border ${sel ? (isDark ? 'bg-white text-black' : 'bg-black text-white') + ' scale-105 shadow-lg border-transparent' : (isDark ? 'bg-transparent text-gray-400 hover:bg-[#222] border-white/5' : 'bg-white text-gray-500 hover:bg-gray-50 border-gray-200')}`}
                  >
                    <span className="text-4xl">{option.emoji}</span>
                    <span className="text-sm font-medium text-center px-2">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      }

      default: return null;
    }
  };

  return (
    <>
      <TopAlert
        message={alert.message}
        type={alert.type}
        visible={alert.visible}
        onClose={() => setAlert((a) => ({ ...a, visible: false }))}
      />

      <div className="w-full max-w-[1400px] px-4 md:px-6 py-8">
        <div className="min-h-[400px]">{renderStep()}</div>

        <ConnectionNavigation
          onBack={handleBack}
          onNext={handleNext}
          isFirstStep={step === 1}
          isLastStep={step === totalSteps}
          isNextDisabled={isSaving || isUploading}
          nextLabel={
            isSaving ? 'Saving…' :
            isUploading ? 'Uploading…' :
            step === totalSteps ? 'Finish' : undefined
          }
        />
      </div>
      {showFaceModal && (
        <FaceVerificationModal
          uploadedPhotos={uploadedPhotos}
          onClose={() => setShowFaceModal(false)}
          onVerified={() => {
            setShowFaceModal(false);
            setFaceVerified(true);
            setStep((s) => s + 1);
          }}
        />
      )}
    </>
  );
}