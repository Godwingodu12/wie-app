import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './pages/auth/LoginPage';
import HomePage from './pages/auth/HomePage';
import ProfilePage from './pages/auth/ProfilePage';
import AdminDashboard from './pages/AdminDashboard';
import RegisterPage from './pages/auth/RegisterPage';
import AdminSignup from './pages/auth/AdminSignup';
import OrganisationSignup from './pages/auth/OrganisationSignup';
import OtpPage from './pages/auth/OtpPage';
import Index from './pages/index';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyUser from './pages/auth/VerifyUser';
import ResetPassword from './pages/auth/ResetPassword';
import CreateGroup from './pages/ticket/CreateGroup';
import ViewGroups from './pages/ticket/ViewGroups';
import CreateTicket from './pages/ticket/CreateTicket';
import UpdateTicketMedia from './pages/ticket/UpdateTicketMedia';
import GroupSelectionModal from './components/modals/GroupSelectionModal';
import ViewEvents from './pages/ticket/ViewEvents';
import UpdateTicketDetails from './pages/ticket/UpdateTicketDetails';
import IndexMessage from "./pages/message/indexMessage";
import EditProfile  from './pages/settings/EditProfile';
import PasswordAndSecurity from "./pages/settings/PasswordAndSecurity";
import ChangeUserPassword from "./pages/settings/ChangeUserPassword";
import TicketTerms from './pages/ticket/TicketTerms';
import UpdateTicketAddOns from './pages/ticket/UpdateTicketAddOns';
import TicketPreview from './pages/ticket/TicketPreview';
import OtherProfilePage from './pages/auth/OtherProfilePage';
import DeletedEvent from './pages/ticket/DeletedEvent';
import SuggestionsPage from './pages/auth/SuggestionsPage';
import ConfirmEvents from './pages/ticket/ConfirmEvents';
import PreviousEvent from './pages/ticket/PreviousEvent';
import LiveEvent from './pages/ticket/LiveEvent';
import BankDetails from './pages/ticket/BankDetails';
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { token, user } = useSelector((state) => state.auth);
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user?.isBlocked) {
    return <Navigate to="/blocked" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

// Public Route - Only for non-authenticated users (reverse protection)
const PublicRoute = ({ children }) => {
  const { token, user } = useSelector((state) => state.auth);

  // If user is logged in, redirect to home
  if (token && user) {
    return <Navigate to="/home" replace />;
  }

  return children;
};

// Mixed Route - Can be accessed by both authenticated and non-authenticated users
const MixedRoute = ({ children }) => {
  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Mixed Routes - Accessible to everyone */}
      <Route path="/blocked" element={<div className="p-10 text-center text-red-600 text-xl font-semibold">You are blocked.</div>} />      
      {/* Public Routes - Only for non-authenticated users */}
      <Route 
        path="/" 
        element={
          <PublicRoute>
            <Index />
          </PublicRoute>
        } 
      />
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/register" 
        element={
          <PublicRoute>
            <RegisterPage />
          </PublicRoute>
        } 
      />
      <Route 
        path="/adminsignup" 
        element={
          <PublicRoute>
            <AdminSignup />
          </PublicRoute>
        } 
      />
      <Route 
        path="/organisationsignup" 
        element={
          <PublicRoute>
            <OrganisationSignup />
          </PublicRoute>
        } 
      />
      <Route 
        path="/forgot-password" 
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        } 
      />
      <Route 
        path="/otp" 
        element={
          <MixedRoute>
            <OtpPage />
          </MixedRoute>
        } 
      />
      <Route 
        path="/verify-user/:input" 
        element={
          <PublicRoute allowedRoles={['admin', 'organisation']}>
            <VerifyUser />
          </PublicRoute>
        } 
      />
      <Route 
        path="/reset-password/:input" 
        element={
          <PublicRoute allowedRoles={['admin', 'organisation']}>
            <ResetPassword />
          </PublicRoute>
        } 
      />

      {/* Protected Routes - Only for authenticated users */}
      <Route
        path="/home"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['admin', 'organisation']}>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute allowedRoles={["admin", "organisation"]}>
                  <OtherProfilePage />
                </ProtectedRoute>
              }
      />
      <Route
        path="/ticket/create-group"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <CreateGroup />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticket/groups"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <ViewGroups />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticket/create-event/:groupId"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <CreateTicket />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticket/create-event/:groupId/:ticketId"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <CreateTicket />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticket/update-ticket-media/:ticketId"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <UpdateTicketMedia />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticket/update-ticket-details/:ticketId"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <UpdateTicketDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticket/update-ticket-addons/:ticketId"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <UpdateTicketAddOns />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticket/ticket-terms/:ticketId"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <TicketTerms />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticket/ticket-preview/:ticketId"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <TicketPreview />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticket/confirm-events"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <ConfirmEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/select-group"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <GroupSelectionModal />
          </ProtectedRoute>
        }
      />
    <Route
        path="/ticket/view-events"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <ViewEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticket/previous-events"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <PreviousEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticket/live-events"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <LiveEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticket/bank-details"
        element={
          <ProtectedRoute allowedRoles={['organisation', 'admin']}>
            <BankDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin', 'organisation']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/message"
        element={
          <ProtectedRoute allowedRoles={["admin", "organisation"]}>
            <IndexMessage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/editprofile"
        element={
          <ProtectedRoute allowedRoles={["admin", "organisation"]}>
            <EditProfile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/password-security"
        element={
          <ProtectedRoute allowedRoles={["admin", "organisation"]}>
            <PasswordAndSecurity />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings/change-password"
        element={
          <ProtectedRoute allowedRoles={["admin", "organisation"]}>
            <ChangeUserPassword />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ticket/deleted-events"
        element={
          <ProtectedRoute allowedRoles={["admin", "organisation"]}>
            <DeletedEvent/>
          </ProtectedRoute>
        }
      />
      <Route
        path="/suggestions"
        element={
          <ProtectedRoute allowedRoles={["admin", "organisation"]}>
            <SuggestionsPage/>
          </ProtectedRoute>
        }
      />
      {/* Catch-all route - redirect to appropriate page based on auth status */}
      <Route 
        path="*" 
        element={
          <Navigate to="/" replace />
        } 
      />
    </Routes>
  );
};
export default AppRoutes;
