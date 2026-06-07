const UserLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white px-4 py-3">User Panel</header>
      <main className="p-6">{children}</main>
    </div>
  );
};

export default UserLayout;
