import React, { useState, useEffect, useMemo } from "react";
import { getMe } from "../../services/userService";
import { showAllBankDetails } from "../../services/ticketService.js";
import SideBar from "../../components/HomePage/SideBar.jsx";
import SearchBar from "../../components/HomePage/SearchBar.jsx";
import ThemeToggle from "../../components/HomePage/ThemeToggle.jsx";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import { Building2, CreditCard, Search, Eye, FileText } from "lucide-react";
import BottomNavigation from "../../components/HomePage/BottomNavigation.jsx";

const HEADER_HEIGHT = 72;

const CustomScrollbarStyles = () => (
  <style>{`
    * {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    *::-webkit-scrollbar {
      display: none;
    }
    
    .scrollbar-hide {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
  `}</style>
);

const BankDetails = () => {
  const [user, setUser] = useState(null);
  const [isDark, setIsDark] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [bankDetails, setBankDetails] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sourceTypeFilter, setSourceTypeFilter] = useState("All");
  const itemsPerPage = 8;

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getMe();
        setUser(res.data);
      } catch (err) {
        console.error("Failed to fetch user", err);
      }
    };
    fetchUser();
  }, []);

  const fetchBankDetails = async () => {
    setLoading(true);
    try {
      const response = await showAllBankDetails();
      console.log("Full API Response:", response);
      
      // Extract bank details from response
      let details = [];
      let summaryData = null;
      
      if (response?.data?.bankDetails && Array.isArray(response.data.bankDetails)) {
        details = response.data.bankDetails;
        summaryData = response.data.summary;
      } else if (response?.bankDetails && Array.isArray(response.bankDetails)) {
        details = response.bankDetails;
        summaryData = response.summary;
      } else if (Array.isArray(response)) {
        details = response;
      }
      
      console.log("Extracted bank details:", details);
      console.log("Number of bank details:", details.length);
      setBankDetails(details);
      setSummary(summaryData);
    } catch (error) {
      console.error("Error fetching bank details:", error);
      setBankDetails([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankDetails();
  }, []);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const maskAccountNumber = (accountNumber) => {
    if (!accountNumber || accountNumber === "N/A") return "N/A";
    const str = accountNumber.toString();
    if (str.length <= 4) return str;
    return "XXXX" + str.slice(-4);
  };

  const filteredBankDetails = useMemo(() => {
    let filtered = bankDetails;

    // Apply search filter
    if (searchValue) {
      filtered = filtered.filter((detail) =>
        detail.source_name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        detail.bank_acc_holder?.toLowerCase().includes(searchValue.toLowerCase()) ||
        detail.bank_ifsc?.toLowerCase().includes(searchValue.toLowerCase())
      );
    }

    // Apply category filter
    if (categoryFilter !== "All") {
      filtered = filtered.filter((detail) => detail.source_category === categoryFilter);
    }

    // Apply source type filter
    if (sourceTypeFilter !== "All") {
      filtered = filtered.filter((detail) => detail.source_type === sourceTypeFilter);
    }

    return filtered;
  }, [bankDetails, searchValue, categoryFilter, sourceTypeFilter]);

  const paginatedBankDetails = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredBankDetails.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredBankDetails, currentPage]);

  const totalPages = Math.ceil(filteredBankDetails.length / itemsPerPage);
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  const displayBankDetails = [...paginatedBankDetails];
  while (displayBankDetails.length < itemsPerPage) {
    displayBankDetails.push(null);
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, categoryFilter, sourceTypeFilter]);

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        subText: "text-[#c9c9cf]",
        cardBg: "bg-[#212426]",
        subCardBg: "bg-[#1c1e20]",
        border: "border-gray-700",
        notificationShadow: "inset 2px 2px 4px rgba(0,0,0,0.6), inset -2px -2px 4px rgba(60,60,60,0.3)",
      }
    : {
        bg: "#f9f9f9",
        text: "text-gray-900",
        subText: "text-gray-600",
        cardBg: "#f2f2f2",
        subCardBg: "#f2f2f2",
        border: "border-gray-300",
        notificationShadow: "inset 2px 2px 4px rgba(0,0,0,0.15), inset -2px -2px 4px rgba(255,255,255,0.8)",
      };

  return (
    <>
      <CustomScrollbarStyles />
      <div className={`${theme.bg} ${theme.text} min-h-screen flex overflow-hidden transition-colors duration-300`}>
        {/* Sidebar - Fixed */}
        <div 
          className="hidden md:flex flex-col flex-shrink-0 transition-colors duration-300"
          style={{ 
            position: 'fixed', 
            left: 0, 
            top: 0, 
            bottom: 0, 
            width: '80px',
            zIndex: 40,
            backgroundColor: isDark ? '#212426' : '#f9f9f9',
            overflowY: 'auto',
            overflowX: 'hidden'
          }}
        >
          <div className="flex items-center justify-center" style={{ height: HEADER_HEIGHT }}>
            <img src={WieLogo} alt="Wie Logo" className="w-8 h-8 lg:w-10 lg:h-10 xl:w-12 xl:h-12" />
          </div>
          <div className="flex-1 overflow-y-auto">
            <SideBar user={user} theme={theme} />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col flex-1 md:ml-20 lg:ml-20 overflow-x-hidden">
          {/* Top Header */}
          <header className="flex items-center justify-between px-3 md:px-4 lg:px-6 w-full overflow-hidden" style={{ height: HEADER_HEIGHT }}>
            <div className="flex items-center gap-4 w-full">
              <div className="flex-1 min-w-0">
                <SearchBar 
                  theme={theme}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4">
                <ThemeToggle isDark={isDark} onToggle={handleThemeToggle} />
              </div>
            </div>
          </header>

          {/* Main Content Area */}
          <main className="flex-1 p-3 md:p-4 lg:p-6 overflow-y-auto overflow-x-hidden">
            <div className="max-w-7xl mx-auto">
              {/* Page Title and Summary */}
              <div className="mb-6 md:mb-8">
                <h1 className={`text-xl md:text-3xl font-bold ${theme.text} mb-4`}>
                  Bank Details
                </h1>
                
                {/* Summary Cards */}
                {summary && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    <div
                      className={`p-4 rounded-2xl ${theme.cardBg}`}
                      style={{
                        boxShadow: isDark 
                          ? '5px 5px 10px #0d0e0f, -5px -5px 10px #353a3d'
                          : '5px 5px 10px #c4c4c4, -5px -5px 10px #ffffff'
                      }}
                    >
                      <p className={`text-xs ${theme.subText} mb-1`}>Total</p>
                      <p className={`text-2xl font-bold ${theme.text}`}>{summary.total}</p>
                    </div>
                    <div
                      className={`p-4 rounded-2xl ${theme.cardBg}`}
                      style={{
                        boxShadow: isDark 
                          ? '5px 5px 10px #0d0e0f, -5px -5px 10px #353a3d'
                          : '5px 5px 10px #c4c4c4, -5px -5px 10px #ffffff'
                      }}
                    >
                      <p className={`text-xs ${theme.subText} mb-1`}>Main Events Bank Accounts</p>
                      <p className={`text-2xl font-bold ${theme.text}`}>{summary.from_main_events}</p>
                    </div>
                    <div
                      className={`p-4 rounded-2xl ${theme.cardBg}`}
                      style={{
                        boxShadow: isDark 
                          ? '5px 5px 10px #0d0e0f, -5px -5px 10px #353a3d'
                          : '5px 5px 10px #c4c4c4, -5px -5px 10px #ffffff'
                      }}
                    >
                      <p className={`text-xs ${theme.subText} mb-1`}>Sub Events Bank Accounts</p>
                      <p className={`text-2xl font-bold ${theme.text}`}>{summary.from_sub_events}</p>
                    </div>
                    <div
                      className={`p-4 rounded-2xl ${theme.cardBg}`}
                      style={{
                        boxShadow: isDark 
                          ? '5px 5px 10px #0d0e0f, -5px -5px 10px #353a3d'
                          : '5px 5px 10px #c4c4c4, -5px -5px 10px #ffffff'
                      }}
                    >
                      <p className={`text-xs ${theme.subText} mb-1`}>Groups Bank Accounts</p>
                      <p className={`text-2xl font-bold ${theme.text}`}>{summary.from_groups}</p>
                    </div>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center min-h-[500px]">
                  <div className="text-center">
                    <div className={`inline-block animate-spin rounded-full h-12 w-12 border-b-2 ${isDark ? 'border-purple-500' : 'border-purple-600'}`}></div>
                    <p className={`${theme.subText} mt-4`}>Loading bank details...</p>
                  </div>
                </div>
              ) : filteredBankDetails.length === 0 ? (
                /* Empty State Card */
                <div 
                  className={`rounded-[2.5rem] p-8 md:p-16 flex flex-col items-center justify-center min-h-[500px] ${theme.cardBg}`}
                  style={{
                    boxShadow: isDark 
                      ? 'inset 5px 5px 10px #0d0e0f,inset -5px -5px 10px #353a3d'
                      : 'inset -5px -5px 10px #606060,inset 5px 5px 10px #ffffff'
                  }}
                >
                  <div className={`mb-8 w-24 h-24 rounded-full flex items-center justify-center ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                    <CreditCard className={`w-12 h-12 ${isDark ? 'text-purple-300' : 'text-purple-600'}`} />
                  </div>
                  <p className={`${theme.text} text-center text-xl md:text-2xl`}>
                    {searchValue ? "No matching bank details found" : "No bank details available"}
                  </p>
                </div>
              ) : (
                /* Bank Details Table */
                <div
                  className={`rounded-[2.5rem] p-4 md:p-6 ${theme.cardBg}`}
                  style={{
                    boxShadow: isDark 
                      ? 'inset 5px 5px 10px #0d0e0f,inset -5px -5px 10px #353a3d'
                      : 'inset -5px -5px 10px #606060,inset 5px 5px 10px #ffffff'
                  }}
                >
                  {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-6">
                <select
                    value={sourceTypeFilter}
                    onChange={(e) => setSourceTypeFilter(e.target.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                    } border ${isDark ? 'border-gray-600' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                >
                    <option value="All">All Sources</option>
                    <option value="Event">Events</option>
                    <option value="Group">Groups</option>
                </select>

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900'
                    } border ${isDark ? 'border-gray-600' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-purple-500`}
                >
                    <option value="All">All Categories</option>
                    <option value="Main Event">Main Event</option>
                    <option value="Sub Event">Sub Event</option>
                    <option value="Organization/Group">Organization/Group</option>
                </select>

                {/* Clear Filters Button */}
                {(sourceTypeFilter !== "All" || categoryFilter !== "All" || searchValue !== "") && (
                    <button
                    onClick={() => {
                        setSourceTypeFilter("All");
                        setCategoryFilter("All");
                        setSearchValue("");
                    }}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                        isDark 
                        ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' 
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                    >
                    <svg 
                        className="w-4 h-4" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                    >
                        <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M6 18L18 6M6 6l12 12" 
                        />
                    </svg>
                    Clear Filters
                    </button>
                )}
                </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr
                          className={`${isDark ? "text-gray-400" : "text-black"} border-b ${
                            isDark ? "border-gray-700" : "border-gray-200"
                          } text-sm sticky top-0`}
                          style={{
                            background: isDark ? "#232426" : "#F1F1F1",
                            zIndex: 10,
                          }}
                        >
                          <th className="py-4 px-4 font-bold text-sm md:text-base lg:text-lg">
                            Source Name
                          </th>
                          <th className="py-4 px-4 font-bold text-sm md:text-base lg:text-lg">
                            Category
                          </th>
                          <th className="py-4 px-4 font-bold text-sm md:text-base lg:text-lg">
                            Account Holder
                          </th>
                          <th className="py-4 px-4 font-bold text-sm md:text-base lg:text-lg">
                            Account Number
                          </th>
                          <th className="py-4 px-4 font-bold text-sm md:text-base lg:text-lg">
                            IFSC Code
                          </th>
                          <th className="py-4 px-4 font-bold text-sm md:text-base lg:text-lg">
                            Account Type
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayBankDetails.map((detail, index) => {
                          if (!detail) {
                            return (
                              <tr key={`placeholder-${index}`}>
                                <td className="py-8 px-4 min-h-[78px]">&nbsp;</td>
                                <td className="py-8 px-4">&nbsp;</td>
                                <td className="py-8 px-4">&nbsp;</td>
                                <td className="py-8 px-4">&nbsp;</td>
                                <td className="py-8 px-4">&nbsp;</td>
                                <td className="py-8 px-4">&nbsp;</td>
                              </tr>
                            );
                          }
                          return (
                            <tr
                              key={detail.bank_detail_id || index}
                              className={`border-b ${
                                isDark ? "border-gray-700/50" : "border-gray-200"
                              } ${
                                isDark ? "hover:bg-gray-800/30" : "hover:bg-gray-100/50"
                              } transition-colors min-h-[78px]`}
                            >
                              <td className={`py-8 px-4 ${theme.text} text-sm`}>
                                <div>
                                  <div className="font-medium truncate pr-4">{detail.source_name || "N/A"}</div>
                                  {detail.parent_name && (
                                    <div className={`text-xs ${theme.subText} truncate pr-4`}>
                                      Main Event name: {detail.parent_name}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className={`py-8 px-4 ${theme.text} text-sm`}>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  detail.source_category === "Main Event" 
                                    ? isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"
                                    : detail.source_category === "Sub Event"
                                    ? isDark ? "bg-purple-500/20 text-purple-300" : "bg-purple-100 text-purple-700"
                                    : isDark ? "bg-green-500/20 text-green-300" : "bg-green-100 text-green-700"
                                }`}>
                                  {detail.source_category}
                                </span>
                              </td>
                              <td className={`py-8 px-4 ${theme.text} text-sm`}>
                                <div className="truncate pr-4">{detail.bank_acc_holder || "N/A"}</div>
                              </td>
                              <td className={`py-8 px-4 ${theme.text} text-sm font-mono`}>
                                <div className="truncate pr-4">{maskAccountNumber(detail.bank_acc_no)}</div>
                              </td>
                              <td className={`py-8 px-4 ${theme.text} text-sm font-mono`}>
                                <div className="truncate pr-4">{detail.bank_ifsc || "N/A"}</div>
                              </td>
                              <td className={`py-8 px-4 ${theme.text} text-sm`}>
                                <div className="truncate pr-4 capitalize">{detail.bank_acc_type || "N/A"}</div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card View */}
                  <div className="flex flex-col md:hidden gap-4">
                    {paginatedBankDetails.map((detail, index) => {
                      if (!detail) return null;

                      return (
                        <div
                          key={detail.bank_detail_id || index}
                          className={`p-4 sm:p-5 rounded-2xl ${
                            isDark ? "bg-gray-800/50" : "bg-white"
                          } shadow-md`}
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                detail.source_type === "Group"
                                  ? isDark ? "bg-green-500/20" : "bg-green-100"
                                  : isDark ? "bg-blue-500/20" : "bg-blue-100"
                              }`}
                            >
                              {detail.source_type === "Group" ? (
                                <Building2
                                  className={`w-5 h-5 ${
                                    isDark ? "text-green-300" : "text-green-600"
                                  }`}
                                />
                              ) : (
                                <FileText
                                  className={`w-5 h-5 ${
                                    isDark ? "text-blue-300" : "text-blue-600"
                                  }`}
                                />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`${theme.text} font-semibold text-sm mb-1`}>
                                {detail.source_name}
                              </p>
                              {detail.parent_name && (
                                <p className={`text-xs ${theme.subText} mb-2`}>
                                  Parent: {detail.parent_name}
                                </p>
                              )}
                              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                                detail.source_category === "Main Event" 
                                  ? isDark ? "bg-blue-500/20 text-blue-300" : "bg-blue-100 text-blue-700"
                                  : detail.source_category === "Sub Event"
                                  ? isDark ? "bg-purple-500/20 text-purple-300" : "bg-purple-100 text-purple-700"
                                  : isDark ? "bg-green-500/20 text-green-300" : "bg-green-100 text-green-700"
                              }`}>
                                {detail.source_category}
                              </span>
                            </div>
                          </div>
                          
                          <div className={`space-y-2 text-xs ${theme.subText}`}>
                            <div className="flex justify-between">
                              <span className="font-medium">Account Holder:</span>
                              <span className={`${theme.text} truncate ml-2`}>{detail.bank_acc_holder || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Account Number:</span>
                              <span className={`${theme.text} font-mono`}>{maskAccountNumber(detail.bank_acc_no)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">IFSC Code:</span>
                              <span className={`${theme.text} font-mono`}>{detail.bank_ifsc || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="font-medium">Account Type:</span>
                              <span className={`${theme.text} capitalize`}>{detail.bank_acc_type || "N/A"}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div 
                      className="flex justify-center mt-6 pt-4 border-t border-opacity-20" 
                      style={{ borderColor: isDark ? "#4a5568" : "#e2e8f0" }}
                    >
                      <div className="flex items-center gap-2">
                        {pages.map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-8 h-8 rounded-full text-sm font-medium transition-colors flex items-center justify-center ${
                              currentPage === page
                                ? "text-white shadow-lg"
                                : isDark
                                ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                            style={
                              currentPage === page
                                ? { background: "linear-gradient(180deg, #1E1242 0%, #6942B8 100%)" }
                                : {}
                            }
                          >
                            {page}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
            <nav 
              className="fixed bottom-0 left-0 right-0 z-50 md:hidden border-t"
              style={{
                backgroundColor: isDark ? '#212426' : '#f5f5f5',
                paddingBottom: 'env(safe-area-inset-bottom)',
                boxShadow: isDark 
                  ? '0 -4px 6px -1px rgba(0, 0, 0, 0.3)' 
                  : '0 -4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
            >
              <BottomNavigation theme={theme} user={user} />
            </nav>
    </>
  );
};
export default BankDetails;