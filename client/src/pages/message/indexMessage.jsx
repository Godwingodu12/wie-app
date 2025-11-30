import React, { useState, useEffect, useCallback } from "react";
import { useSocket } from '../../context/SocketContext';
import { useSelector } from "react-redux";
import chatNotifications from '../../utils/chatNotifications';
import SideBar from "../../components/HomePage/SideBar";
import ThemeToggle from "../../components/HomePage/ThemeToggle";
import NewChatModal from "../../components/Message/NewChatModal";
import ChatList from "../../components/Message/ChatList";
import ChatWindow from "../../components/Message/ChatWindow";
import WieLogo from "../../assets/HomePage/WieLogo.svg";
import SearchIcon from "../../assets/HomePage/SearchIcon.svg";
import SettingIcon from "../../assets/Message/settings_icon.png";
import EditIcon from "../../assets/Message/edit_icon.png";
import { getUserChats, createOrGetChat } from "../../services/chatService";
<<<<<<< HEAD
import BottomNavigation from "../../components/HomePage/BottomNavigation.jsx";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
=======
>>>>>>> 8cb382ed8e33bf2fa1cbe5aa292459410964ed4c
const getNeumorphicStyle = (isPressed = false, isDark = true, theme) => {
  const bg = isDark ? "#212426" : theme.inputBg.replace('bg-[', '').replace(']', '');
  const lightShadow = isDark
    ? "rgba(255,255,255,0.05)"
    : "rgba(255,255,255,0.9)";
  const darkShadow = isDark ? "rgba(0,0,0,0.6)" : "rgba(0,0,0,0.2)";

  return {
    backgroundColor: bg,
    borderRadius: "9999px",
    boxShadow: isPressed
      ? `inset -3px -3px 6px ${lightShadow}, inset 3px 3px 6px ${darkShadow}`
      : `inset -2px -2px 5px ${lightShadow}, inset 2px 2px 5px ${darkShadow}`,
  };
};

const IndexMessage = () => {
  const { user } = useSelector((state) => state.auth);
  const [isDark, setIsDark] = useState(true);
    const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState("");
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filteredChats, setFilteredChats] = useState([]);
  const { socket, isConnected, markChatAsRead, unreadChats, setUnreadCount, initializeUnreadCounts, isInitialized } = useSocket();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    const systemPrefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    const shouldBeDark = savedTheme ? savedTheme === "dark" : systemPrefersDark;
    setIsDark(shouldBeDark);
    document.documentElement.classList.toggle("dark", shouldBeDark);
  }, []);
const fetchChats = async () => {
  setLoading(true);
  try {
    const response = await getUserChats();
    const fetchedChats = response.chats || [];
    const currentChatId = sessionStorage.getItem('currentChatId');
    const chatsWithMessages = fetchedChats.filter(chat => chat.lastMessage && chat.lastMessage.content);
    const mappedChats = chatsWithMessages.map(chat => ({
      ...chat,
      unreadCount: (chat._id === currentChatId) ? 0 : (unreadChats.get(chat._id) ?? chat.unreadCount ?? 0)
    }));
      setChats(mappedChats);
      setFilteredChats(mappedChats);
      
      if (initializeUnreadCounts && !isInitialized) {
        initializeUnreadCounts(mappedChats);
      } else if (setUnreadCount && isInitialized) {
        mappedChats.forEach(chat => {
          if (chat._id === currentChatId) {
            setUnreadCount(chat._id, 0);
          } else {
            const currentCount = unreadChats.get(chat._id) || 0;
            const apiCount = chat.unreadCount || 0;
            if (apiCount > currentCount) {
              setUnreadCount(chat._id, apiCount);
            }
          }
        });
      }
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  useEffect(() => {
    if (searchValue.trim()) {
      const filtered = chats.filter(chat =>
        chat.participant?.name?.toLowerCase().includes(searchValue.toLowerCase()) ||
        chat.participant?.email?.toLowerCase().includes(searchValue.toLowerCase())
      );
      setFilteredChats(filtered);
    } else {
      setFilteredChats(chats);
    }
  }, [searchValue, chats]);
    const handleChatMessageReceived = useCallback((event) => {      
      const { chatId, lastMessage, participant, message, timestamp, isFirstMessage, autoRead } = event.detail;
      const currentChatId = sessionStorage.getItem('currentChatId');
      const currentUserId = user?._id || user?.id;
      
      const isThisSpecificChatOpen = selectedChat?._id === chatId || currentChatId === chatId;
      const isMessageFromMe = message?.sender === currentUserId;
      
      setTimeout(() => {
        setChats(prevChats => {
          const chatIndex = prevChats.findIndex(c => c._id === chatId);
          
          if (chatIndex !== -1) {
            // Chat exists in list - update it
            const updatedChats = [...prevChats];
            const existingChat = updatedChats[chatIndex];
            
            let newUnreadCount;
            
            if (isMessageFromMe) {
              newUnreadCount = existingChat.unreadCount || 0;
            } else if (isThisSpecificChatOpen || autoRead) {
              newUnreadCount = 0;
              setTimeout(() => {
                if (markChatAsRead) {
                  markChatAsRead(chatId);
                }
              }, 0);
            } else {
              const contextCount = unreadChats.get(chatId) || 0;
              newUnreadCount = contextCount;
            }
            
            const updatedChat = {
              ...existingChat,
              lastMessage: lastMessage || {
                content: message?.content,
                sender: message?.sender,
                timestamp: message?.timestamp || timestamp
              },
              unreadCount: newUnreadCount,
              updatedAt: timestamp || new Date(),
              participant: participant || existingChat.participant
            };
            
            updatedChats.splice(chatIndex, 1);
            return [updatedChat, ...updatedChats];
          } else {
            // CHANGED: Chat doesn't exist in list - add it (handles deleted chat receiving new message)
            const newChat = {
              _id: chatId,
              participant: participant,
              lastMessage: lastMessage || {
                content: message?.content,
                sender: message?.sender,
                timestamp: message?.timestamp || timestamp
              },
              unreadCount: (isThisSpecificChatOpen || autoRead || isMessageFromMe) ? 0 : 1,
              updatedAt: timestamp || new Date()
            };
            return [newChat, ...prevChats];
          }
        });
      }, 0);
    }, [user, selectedChat?._id, markChatAsRead, unreadChats]);
    const handleChatOpened = useCallback((event) => {
      const { chatId } = event.detail;
      
      setTimeout(() => {
        setChats(prevChats => 
          prevChats.map(c => 
            c._id === chatId 
              ? { ...c, unreadCount: 0 }
              : c
          )
        );
        
        if (markChatAsRead) {
          markChatAsRead(chatId);
        }
      }, 0);
    }, [markChatAsRead]);
    const handleChatListUpdate = useCallback((event) => {
      const { chatId, lastMessage, unreadCount, participant, updatedAt, isFirstMessage } = event.detail;
      
      setTimeout(() => {
        setChats(prevChats => {
          const chatIndex = prevChats.findIndex(c => c._id === chatId);
          
          if (chatIndex !== -1) {
            const updatedChats = [...prevChats];
            const existingChat = updatedChats[chatIndex];
            
            // Update the chat
            const updatedChat = {
              ...existingChat,
              lastMessage: lastMessage !== undefined ? lastMessage : existingChat.lastMessage, // CHANGED: Allow null
              unreadCount: unreadCount !== undefined ? unreadCount : existingChat.unreadCount,
              participant: participant || existingChat.participant,
              updatedAt: updatedAt || new Date()
            };
            
            // Move to top
            updatedChats.splice(chatIndex, 1);
            return [updatedChat, ...updatedChats];
          } else if (isFirstMessage) {
            // ADDED: Chat doesn't exist in list, add it (handles deleted chat case)
            const newChat = {
              _id: chatId,
              participant: participant,
              lastMessage: lastMessage,
              unreadCount: unreadCount || 0,
              updatedAt: updatedAt || new Date()
            };
            return [newChat, ...prevChats];
          }
          
          return prevChats;
        });
      }, 0);
    }, []);
    const handleChatUnreadUpdate = useCallback((event) => {
      const { chatId, unreadCount } = event.detail;
      
      setTimeout(() => {
        setChats(prevChats => 
          prevChats.map(c => 
            c._id === chatId 
              ? { ...c, unreadCount }
              : c
          )
        );
      }, 0);
    }, []);
    const handleChatDeleted = (event) => {
      const { chatId } = event.detail;
      
      // Remove from chat list
      setChats(prev => prev.filter(c => c._id !== chatId));
      
      // If this was the selected chat, deselect it
      if (selectedChat?._id === chatId) {
        setSelectedChat(null);
        sessionStorage.removeItem('currentChatId');
      }
    };
    const handleChatDeletedByUser = useCallback((event) => {
      const { chatId } = event.detail;
      
      setTimeout(() => {
        // Remove from chat list
        setChats(prev => prev.filter(c => c._id !== chatId));
        
        // If this was the selected chat, deselect it
        if (selectedChat?._id === chatId) {
          setSelectedChat(null);
          sessionStorage.removeItem('currentChatId');
        }
      }, 0);
    }, [selectedChat?._id]);
    useEffect(() => {
      if (!user) return;
      window.addEventListener('chat-message-received', handleChatMessageReceived);
      window.addEventListener('chat-opened', handleChatOpened);
      window.addEventListener('chat-list-update', handleChatListUpdate);
      window.addEventListener('chat-unread-update', handleChatUnreadUpdate);
      window.addEventListener('chat-deleted', handleChatDeleted); 
      window.addEventListener('chat-deleted-by-user', handleChatDeletedByUser);
      return () => {
        window.removeEventListener('chat-message-received', handleChatMessageReceived);
        window.removeEventListener('chat-opened', handleChatOpened);
        window.removeEventListener('chat-list-update', handleChatListUpdate);
        window.removeEventListener('chat-unread-update', handleChatUnreadUpdate);
        window.removeEventListener('chat-deleted', handleChatDeleted);
        window.removeEventListener('chat-deleted-by-user', handleChatDeletedByUser);
      };
    }, [handleChatMessageReceived, handleChatOpened, handleChatListUpdate, handleChatUnreadUpdate, handleChatDeleted, handleChatDeletedByUser]);
  useEffect(() => {
    const handleUnreadCountsUpdate = (event) => {
      const { counts } = event.detail;
      const currentChatId = sessionStorage.getItem('currentChatId');
      
      setChats(prevChats => 
        prevChats.map(chat => {
          if (chat._id === currentChatId) {
            return { ...chat, unreadCount: 0 };
          }
          const newCount = counts[chat._id] || 0;
          return { ...chat, unreadCount: newCount };
        })
      );
    };

    window.addEventListener('unread-counts-updated', handleUnreadCountsUpdate);
    
    return () => {
      window.removeEventListener('unread-counts-updated', handleUnreadCountsUpdate);
    };
  }, []);
  useEffect(() => {
    const openChatId = sessionStorage.getItem('openChatId');
    if (openChatId && chats.length > 0) {
      const chatToOpen = chats.find(c => c._id === openChatId);
      if (chatToOpen) {
        setSelectedChat(chatToOpen);
        sessionStorage.removeItem('openChatId');
      }
    }
  }, [chats]);

  useEffect(() => {
    if (user) {
      chatNotifications.requestPermission().then(granted => {
        if (granted) {
          // Silent
        } 
      });
    }
  }, [user]);

  const handleThemeToggle = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    document.documentElement.classList.toggle("dark", newTheme);
    localStorage.setItem("theme", newTheme ? "dark" : "light");
  };

  const handleNewChat = () => {
    setShowNewChatModal(true);
  };
  const handleSelectUser = async (selectedUser) => {
    try {
      const response = await createOrGetChat(selectedUser._id);
      const newChat = {
        ...response.chat,
        participant: selectedUser
      };
      if (response.isNew && newChat.lastMessage) {
        setChats(prev => [newChat, ...prev]);
      }
      setSelectedChat(newChat);
      setShowNewChatModal(false);
    } catch (error) {
      // Silent fail
    }
  };
  const handleSelectChat = (chat) => {    
    sessionStorage.setItem('currentChatId', chat._id);
    
    setChats(prevChats => 
      prevChats.map(c => 
        c._id === chat._id 
          ? { ...c, unreadCount: 0 }
          : c
      )
    );
    
    const clearUnread = () => {
      if (markChatAsRead) {
        markChatAsRead(chat._id);
      }
    };
    
    clearUnread();
    setTimeout(clearUnread, 0);
    setTimeout(clearUnread, 50);
    setTimeout(clearUnread, 100);
    setTimeout(clearUnread, 200);
    
    setSelectedChat(chat);
  };
  const handleBackFromChat = () => {
    sessionStorage.removeItem('currentChatId');
    setSelectedChat(null);
    // Refresh chat list to remove empty chats
    fetchChats();
  };

  const theme = isDark
    ? {
        bg: "bg-[#212426]",
        text: "text-white",
        subText: "text-[#c9c9cf]",
        cardBg: "bg-[#232426]",
        border: "border-[#23233a]",
        inputBg: "bg-[#212426]",
      }
    : {
        bg: "bg-[#ffffff]",
        text: "text-gray-900",
        subText: "text-gray-600",
        cardBg: "bg-[#ffffff]",
        border: "border-[#e4e6ea]",
        inputBg: "bg-[#ffffff]",
      };

  return (
    <>
    <div
      className={`${theme.bg} ${theme.text} h-screen flex overflow-hidden transition-colors duration-300 max-w-full`}
    >
      <div
        className={`hidden md:flex flex-col flex-shrink-0 nest-hub-sidebar ${theme.bg}`}
      >
        <div
          className="flex items-center justify-center"
          style={{ height: 72 }}
        >
          <img src={WieLogo} alt="Wie Logo" className="w-12 h-12" />
        </div>
        <div className="flex-1 sidebar-content">
          <SideBar user={user} theme={theme} />
        </div>
      </div>

      <div className="flex flex-col flex-1 w-full overflow-hidden md:ml-4 ">
        <header
          className="flex items-center md:hidden justify-between px-4 md:px-6 flex-shrink-0"
          style={{ height: 72 }}
        >
          <div className="flex  items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <img
                src={WieLogo}
                alt="WIE Logo"
                className="w-8 h-8 object-contain"
              />
            </div>
            
          </div>

         
        </header>

        <main
          className={`main-scrollbar flex flex-1 md:mt-4  overflow-y-auto pb-4 ${theme.cardBg}`}
          style={{ minHeight: "calc(100vh - 72px)" }}
        >
          <div
            className="flex flex-1 w-full h-full p-5 pr-4 gap-4 mr-4"
            style={{
              ...getNeumorphicStyle(false, isDark, theme),
              borderRadius: "2.5rem",
              boxShadow: isDark
                ? "inset -5px -5px 10px rgba(255, 255, 255, 0.1)"
                : "inset -5px -5px 10px rgba(0, 0, 0, 0.2)",
            }}
          >
            <aside
              className={`flex flex-col w-full md:w-1/4 gap-2 flex-shrink-0 ${
                selectedChat ? 'hidden md:flex' : 'flex'
              }`}
            >
              <div className="flex items-center justify-between ">
                <button
          onClick={()=> navigate("/ticket/groups")}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft size={20} style={{ color: theme.text }} />
        </button>
                <div className="text-base font-medium">Messages</div>
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={handleNewChat}
                    className="p-2 rounded-[10px] hover:bg-white/5"
                    aria-label="New Chat"
                  >
                    <img
                      src={EditIcon}
                      alt="New Chat"
                      className={`w-4 h-4 ${
                        isDark ? "" : "filter brightness-0"
                      }`}
                    />
                  </button>
                  <button
                    className="p-2 rounded-[10px] hover:bg-white/5"
                    aria-label="Settings"
                  >
                    <img
                      src={SettingIcon}
                      alt="Settings"
                      className={`w-4 h-4 ${
                        isDark ? "" : "filter brightness-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
              
              <div
                className={`rounded-[20px] flex flex-col h-full ${theme.cardBg} pt-2`}
              >
                <div
                  className="relative w-full h-10 transition-all duration-150 rounded-full px-5 mb-2"
                  style={{
                    ...getNeumorphicStyle(false, isDark, theme),
                    boxShadow: `${
                      isDark
                        ? "0 4px 6px -1px rgba(255, 255, 255, 0.1), 0 2px 4px -2px rgba(255, 255, 255, 0.1)"
                        : "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)"
                    }, ${getNeumorphicStyle(false, isDark, theme).boxShadow}`,
                  }}
                >
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className={`pl-10 pr-3 w-full h-10 rounded-full text-sm font-medium outline-none border-0 transition-colors duration-300`}
                    style={{
                      backgroundColor: "transparent",
                      color: isDark ? "white" : "black",
                    }}
                  />
                  <img
                    src={SearchIcon}
                    alt="SearchIcon"
                    className="absolute top-1/2 -translate-y-1/2 opacity-70"
                    style={{
                      width: "20px",
                      height: "20px",
                      left: "12px",
                      filter: isDark ? "invert(0)" : "invert(1)",
                    }}
                  />
                </div>

                {loading ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div 
                      className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin"
                      style={{ borderColor: '#7263F3', borderTopColor: 'transparent' }}
                    />
                  </div>
                ) : filteredChats.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center pb-5">
                    <div className="flex flex-col items-center text-center gap-3 px-4">
                      <h4 className="font-bold text-xl">Start a New chat</h4>
                      <p
                        className={`${theme.subText} text-sm max-w-xs opacity-70`}
                      >
                        Begin a fresh conversation to connect with your
                        collaborators, coordinators or editors.
                      </p>

                      <div className="flex flex-col items-center gap-4 mt-6 w-full max-w-xs mx-auto">
                        <button
                          className="w-48 px-6 py-3 rounded-full font-semibold text-base text-white transition-colors shadow-lg"
                          style={{ backgroundColor: "#7263F3" }}
                          onClick={handleNewChat}
                        >
                          New chat
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-hidden">
                    <ChatList
                      chats={filteredChats}
                      onSelectChat={handleSelectChat}
                      isDark={isDark}
                      selectedChatId={selectedChat?._id}
                    />
                  </div>
                )}
              </div>
            </aside>

            {!selectedChat && (
              <div className="hidden md:flex items-center">
                <div
                  className="w-px h-4/5"
                  style={{
                    background: `linear-gradient(to bottom, transparent 0%, ${
                      isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
                    } 20%, ${
                      isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"
                    } 80%, transparent 100%)`,
                  }}
                ></div>
              </div>
            )}

            <section className={`flex-1 ${selectedChat ? 'flex' : 'hidden md:flex'}`}>
              {selectedChat ? (
                <ChatWindow
                  chat={selectedChat}
                  onBack={handleBackFromChat}
                  isDark={isDark}
                  currentUserId={user?._id || user?.id}
                />
              ) : (
                <div className="hidden md:flex items-center justify-center w-full">
                  <div className="flex flex-col items-center justify-center text-center">
                    <img
                      src={WieLogo}
                      alt="Wie Logo"
                      className={`w-32 h-auto mb-4 filter ${
                        isDark ? "brightness-125" : "brightness-110"
                      }`}
                    />
                    <div className={`text-sm ${theme.subText}`}>
                      Select a conversation to start messaging
                    </div>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      <NewChatModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
        isDark={isDark}
        onSelectUser={handleSelectUser}
      />
    </div>
<<<<<<< HEAD
    
=======
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
    </nav>
>>>>>>> 8cb382ed8e33bf2fa1cbe5aa292459410964ed4c
    </>
  );
};
export default IndexMessage;
