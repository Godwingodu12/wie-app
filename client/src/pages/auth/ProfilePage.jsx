import React, { useEffect, useState } from 'react';
import { getMe } from '../../services/userService';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutSuccess } from '../../features/auth/authSlice'; // ⬅️ your auth slice action
import { logout } from '../../services/authService'; // optional if you call backend logout

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        const userData = res.data;
        console.log("User fetched:", userData);
        setUser(userData);
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await logout(); // if you have backend logout API
    } catch (err) {
      console.error("Logout failed", err);
    } finally {
      // clear Redux auth state
      dispatch(logoutSuccess());
      // clear storage (if you store token there)
      localStorage.clear();
      // redirect
      navigate("/login");
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-bold mb-4 text-blue-600">👤 Profile</h1>
      {user ? (
        <>
          <div className="flex items-center gap-6 mb-6">
            <img
              src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSZ8a6q5mGzg068kdnRWX5mWcqfzEBKARos7Q&s"
              alt="test"
              className="w-24 h-24 rounded-full border"
            />

            <div>
              <input type="file" accept="image/*" />
              <button
                className="mt-2 px-4 py-1 bg-blue-500 text-white rounded text-sm"
              >
                Upload
              </button>
            </div>
          </div>

          <div className="text-gray-700 space-y-2 mb-6">
            <p><span className="font-medium">Name:</span> {user.name}</p>
            <p><span className="font-medium">Email:</span> {user.email}</p>
            <p><span className="font-medium">Role:</span> {user.role}</p>
            <p><span className="font-medium">Blocked:</span> {user.isBlocked ? 'Yes' : 'No'}</p>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
          >
            Logout
          </button>
        </>
      ) : (
        <p className="text-gray-500">Loading profile...</p>
      )}
    </div>
  );
};

export default ProfilePage;
