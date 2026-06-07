import { useSelector } from 'react-redux';

const useAuth = () => {
  const { user, token } = useSelector((state) => state.auth);
  return { user, token, isAdmin: user?.role === 'admin' };
};

export default useAuth;
