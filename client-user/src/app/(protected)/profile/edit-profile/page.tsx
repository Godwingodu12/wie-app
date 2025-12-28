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
import { Camera, Loader2, ChevronLeft } from "lucide-react";

// Types
import { Country } from "@/types";
import ProfileImage from "@/assets/profile/ProfileImage.jpg";
import SideBar from "@/components/home/SideBar";
import { useSidebar } from "@/context/SidebarContext";

function EditProfileContent() {
  const { isCollapsed, isMobile } = useSidebar();
  const { user, loading: authLoading } = useAuth(true);
  const dispatch = useDispatch();
  const router = useRouter();

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

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPG, JPEG, PNG, GIF, and WEBP images are allowed');
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
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

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      const formDataToSend = new FormData();

      if (formData.name?.trim()) formDataToSend.append('name', formData.name.trim());
      if (formData.username?.trim()) formDataToSend.append('username', formData.username.trim());
      if (formData.bio?.trim()) formDataToSend.append('bio', formData.bio.trim());
      if (formData.country_id) formDataToSend.append('country_id', formData.country_id);
      if (selectedFile) formDataToSend.append('profile_picture', selectedFile);

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
      <div className="flex justify-center items-center min-h-screen bg-[#050505] text-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#8860D9]" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto scrollbar-hide bg-[#000000] text-white font-sans selection:bg-[#5E5CE6] selection:text-white">
      <SideBar />

      <main
        className={`transition-all duration-300 ease-in-out ${
          isMobile ? "pb-24" : ""
        }`}
        style={{ marginLeft }}
      >
        <div className="max-w-[600px] mx-auto px-6 py-6 md:py-12">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 relative">
            <button
              onClick={() => router.back()}
              className="text-white hover:bg-[#1C1C1E] p-2 rounded-full transition-colors -ml-2"
            >
              <ChevronLeft size={24} />
            </button>
            <span className="text-[18px] font-semibold text-white absolute left-1/2 transform -translate-x-1/2">
              Edit Profile
            </span>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="text-[#0095F6] font-semibold text-[16px] disabled:opacity-50 hover:text-[#0085db] transition-colors"
            >
              {loading ? "Saving..." : "Done"}
            </button>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-6 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-center text-sm font-medium">
              {success}
            </div>
          )}
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-center text-sm font-medium">
              {error}
            </div>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-10">
            <label htmlFor="profile-picture-input" className="cursor-pointer">
              <div className="relative mb-4 group">
                {displayProfilePicture ? (
                  <div className="relative w-[88px] h-[88px]">
                    <Image
                      src={displayProfilePicture}
                      alt="Profile"
                      fill
                      className="rounded-full object-cover border-[3px] border-[#1C1C1E]"
                    />
                  </div>
                ) : (
                  <div className="relative w-[88px] h-[88px]">
                    <Image
                      src={ProfileImage}
                      alt="Profile"
                      fill
                      className="rounded-full object-cover border-[3px] border-[#1C1C1E]"
                    />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={20} className="text-white" />
                </div>
              </div>
            </label>
            <input
              id="profile-picture-input"
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="profile-picture-input"
              className="text-[#0095F6] text-[15px] font-medium hover:text-[#0085db] transition-colors cursor-pointer"
            >
              Change profile photo
            </label>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Name */}
            <div className="mb-2">
              <label className="block text-[#6E6E73] text-[15px] mb-2 px-1">
                Name
              </label>
              <div className="bg-[#1C1C1E] rounded-[12px] overflow-hidden">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full bg-transparent p-4 text-white text-[17px] focus:outline-none placeholder-[#555]"
                  placeholder="Name"
                />
              </div>
              <p className="text-[#555] text-[12px] mt-2 px-1">
                Help people discover your account by using the name you're known
                by: either your full name, nickname, or business name.
              </p>
            </div>

            {/* Username */}
            <div className="mb-2">
              <label className="block text-[#6E6E73] text-[15px] mb-2 px-1">
                Username
              </label>
              <div className="bg-[#1C1C1E] rounded-[12px] overflow-hidden">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full bg-transparent p-4 text-white text-[17px] focus:outline-none placeholder-[#555]"
                  placeholder="Username"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="mb-2">
              <label className="block text-[#6E6E73] text-[15px] mb-2 px-1">
                Bio
              </label>
              <div className="bg-[#1C1C1E] rounded-[12px] overflow-hidden">
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full bg-transparent p-4 text-white text-[17px] focus:outline-none resize-none placeholder-[#555]"
                  placeholder="Bio"
                />
              </div>
            </div>

            {/* Country (Native Select) */}
            <div className="mb-2">
              <label className="block text-[#6E6E73] text-[15px] mb-2 px-1">
                Country
              </label>
              <div className="relative bg-[#1C1C1E] rounded-[12px] overflow-hidden">
                <select
                  name="country_id"
                  value={formData.country_id}
                  onChange={handleInputChange}
                  className="w-full bg-transparent p-4 text-white text-[17px] focus:outline-none appearance-none cursor-pointer"
                >
                  {countries.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                      className="bg-[#1C1C1E] text-white"
                    >
                      {c.country_name}
                    </option>
                  ))}
                  {countries.length === 0 && (
                    <option value="" disabled>
                      Loading...
                    </option>
                  )}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                  <ChevronLeft
                    size={20}
                    className="text-gray-500 rotate-[-90deg]"
                  />
                </div>
              </div>
            </div>
          </div>
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
        <div className="flex justify-center items-center min-h-screen bg-black">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      }
    >
      <EditProfileContent />
    </Suspense>
  );
}

export const dynamic = "force-dynamic";
