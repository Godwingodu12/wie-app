"use client";

import { useState, useEffect, Suspense, ChangeEvent } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { updateUser } from "@/features/auth/authSlice";
import {
  getProfile,
  updateProfile,
  getCountries,
} from "@/services/wieUserService";
// Icons
import { ChevronLeft, Camera, Loader2, Save } from 'lucide-react';

// Types
import { Country } from "@/types";
import ProfileImage from "@/assets/profile/ProfileImage.jpg";
import SideBar from "@/components/home/SideBar";
import { useSidebar } from "@/context/SidebarContext";
import { useTheme } from '@/components/home/ThemeContext';

function EditProfileContent() {
  const { isCollapsed, isMobile } = useSidebar();
  const { user, loading: authLoading } = useAuth(true);
  const dispatch = useDispatch();
  const router = useRouter();
  const { themeStyles } = useTheme();

  // State
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    bio: "",
    country_id: "",
  });

  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false); // Added for image upload state

  // Initialization
  useEffect(() => {
    const initPage = async () => {
      try {
        const countriesData = await loadCountries();
        await fetchUserProfile(countriesData);
      } catch (err) {
        console.error("Failed to initialize page:", err);
      } finally {
        setPageLoading(false);
      }
    };
    initPage();
  }, []);

  const fetchUserProfile = async (availableCountries: Country[] = []) => {
    try {
      const profile = await getProfile();
      setCurrentProfile(profile);

      // Determine country: existing profile country -> first available country -> empty
      let countryId = profile?.country_id || "";
      if (!countryId && availableCountries.length > 0) {
        countryId = availableCountries[0].id;
      }

      setFormData({
        name: profile?.name || "",
        username: profile?.username || "",
        bio: profile?.bio || "",
        country_id: countryId,
      });
      dispatch(updateUser(profile));
    } catch (err) {
      console.error("Failed to fetch profile:", err);
    }
  };

  const loadCountries = async () => {
    try {
      const data = await getCountries();
      setCountries(data);
      return data;
    } catch (err) {
      console.error("Failed to load countries:", err);
      return [];
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError("Only JPG, JPEG, PNG, GIF, and WEBP images are allowed");
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB");
        return;
      }

      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError("");
      setSuccess("");
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => { // Added optional event parameter
    e?.preventDefault(); // Prevent default form submission
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const formDataToSend = new FormData();

      if (formData.name?.trim())
        formDataToSend.append("name", formData.name.trim());
      if (formData.username?.trim())
        formDataToSend.append("username", formData.username.trim());
      if (formData.bio?.trim())
        formDataToSend.append("bio", formData.bio.trim());
      if (formData.country_id)
        formDataToSend.append("country_id", formData.country_id);
      if (selectedFile) formDataToSend.append("profile_picture", selectedFile);

      const updatedUser = await updateProfile(formDataToSend);

      dispatch(updateUser(updatedUser));
      setCurrentProfile(updatedUser);
      setSelectedFile(null);
      setPreviewUrl(null);

      setSuccess("Profile saved");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || "Failed to update profile";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const displayUser = currentProfile || user;
  const marginLeft = isMobile ? "0" : isCollapsed ? "80px" : "281px";

  const displayProfilePicture = previewUrl || displayUser?.profile_picture;

  if (authLoading || pageLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ background: themeStyles.background }}>
        <Loader2 className="w-8 h-8 animate-spin text-[#8860D9]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans selection:bg-[#5E5CE6] selection:text-white pb-20 sm:pb-0" style={{ background: themeStyles.background }}>
      <SideBar />
      <main
        className={`transition-all duration-300 ease-in-out ${
          isMobile ? 'ml-0' : isCollapsed ? 'ml-[80px]' : 'ml-[281px]'
        }`}
      >
        <div className="max-w-2xl mx-auto pt-8 px-4 sm:px-6">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full transition-colors"
              style={{ background: themeStyles.cardBg, color: themeStyles.text }}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold" style={{ color: themeStyles.text }}>Edit Profile</h1>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="ml-auto text-[#0095F6] font-semibold text-[16px] disabled:opacity-50 hover:text-[#0085db] transition-colors"
            >
              {loading ? "Saving..." : "Done"}
            </button>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-3 rounded-xl text-center text-sm font-medium"
              style={{ background: themeStyles.cardBg, border: `1px solid #22c55e`, color: '#22c55e' }}>
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 p-3 rounded-xl text-center text-sm font-medium"
              style={{ background: themeStyles.cardBg, border: `1px solid #ef4444`, color: '#ef4444' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4" style={{ borderColor: themeStyles.cardBg }}>
                  {displayProfilePicture ? (
                    <Image
                      src={displayProfilePicture}
                      alt="Profile"
                      fill
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <Image
                      src={ProfileImage}
                      alt="Profile"
                      fill
                      className="rounded-full object-cover"
                    />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera className="w-8 h-8 text-white" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => document.getElementById('profile-picture-input')?.click()}
                className="text-[#8860D9] font-medium hover:text-[#9575CD] transition-colors"
                disabled={uploadingImage}
              >
                {uploadingImage ? 'Uploading...' : 'Change Profile Picture'}
              </button>
              <input
                id="profile-picture-input"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1" style={{ color: themeStyles.textSecondary }}>
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8860D9] transition-all"
                style={{
                  background: themeStyles.cardBg,
                  color: themeStyles.text,
                  border: `1px solid ${themeStyles.border}`
                }}
                placeholder="Your name"
              />
              <p className="text-[12px] mt-2 px-1" style={{ color: themeStyles.textSecondary }}>
                Help people discover your account by using the name you're known
                by: either your full name, nickname, or business name.
              </p>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1" style={{ color: themeStyles.textSecondary }}>
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8860D9] transition-all"
                style={{
                  background: themeStyles.cardBg,
                  color: themeStyles.text,
                  border: `1px solid ${themeStyles.border}`
                }}
                placeholder="Username"
              />
            </div>

            {/* Bio */}
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1" style={{ color: themeStyles.textSecondary }}>
                Bio
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#8860D9] transition-all"
                style={{
                  background: themeStyles.cardBg,
                  color: themeStyles.text,
                  border: `1px solid ${themeStyles.border}`
                }}
                placeholder="Write something about yourself..."
              />
            </div>

            {/* Country */}
            <div className="space-y-2">
              <label className="text-sm font-medium ml-1" style={{ color: themeStyles.textSecondary }}>
                Country
              </label>
              <div className="relative">
                <select
                  name="country_id"
                  value={formData.country_id}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl appearance-none focus:outline-none focus:ring-2 focus:ring-[#8860D9] transition-all cursor-pointer"
                  style={{
                    background: themeStyles.cardBg,
                    color: themeStyles.text,
                    border: `1px solid ${themeStyles.border}`
                  }}
                >
                  {countries.length === 0 && (
                    <option value="" disabled style={{ background: themeStyles.cardBg }}>
                      Loading...
                    </option>
                  )}
                  {countries.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      style={{ background: themeStyles.cardBg, color: themeStyles.text }}
                    >
                      {c.country_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </form>
        </div>
      </main>
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}

export default function EditProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-screen" style={{ background: "#050505" }}>
          <Loader2 className="w-8 h-8 animate-spin text-[#8860D9]" />
        </div>
      }
    >
      <EditProfileContent />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
