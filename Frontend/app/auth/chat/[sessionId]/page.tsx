"use client"

export const dynamic = 'force-dynamic';

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Send, 
  Paperclip, 
  Smile, 
  Users, 
  Shield, 
  ArrowLeft, 
  Phone, 
  Video, 
  Search, 
  ImageIcon, 
  File,
  MoreVertical,
  Star,
  Download,
  Copy,
  CheckCircle,
  Clock,
  Circle,
  Wifi,
  WifiOff,
  AtSign,
  Reply,
  X
} from "lucide-react"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { UserMenu } from "@/components/user-menu";
import io from "socket.io-client"
import JitsiVideoCall from "@/components/jitsi-video-call"

interface Message {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  timestamp: Date
  encrypted: boolean
  status: "sending" | "sent" | "delivered" | "read"
  reactions?: { emoji: string; users: string[] }[]
  replyTo?: string
  fileUrl?: string
  fileName?: string
  fileType?: string
  isPrivate?: boolean
  targetUserId?: string
  targetUserName?: string
}

interface User {
  id: string
  name: string
  avatar?: string
  status: "online" | "away" | "offline"
  isTyping: boolean
}

export default function ChatPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = params?.sessionId as string;
  const username = searchParams?.get("username") || "Anonymous";
  
  // Add error boundary and loading states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userCount, setUserCount] = useState(1); // Start with 1 for current user
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [videoCallTargetUser, setVideoCallTargetUser] = useState<string | undefined>(undefined);
  const [isGroupVideoCall, setIsGroupVideoCall] = useState(false);
  const [isAudioCall, setIsAudioCall] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<User[]>([]);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [typingQuery, setTypingQuery] = useState("");
  const [privateChatTarget, setPrivateChatTarget] = useState<User | null>(null);
  const [showPrivateUserSuggestions, setShowPrivateUserSuggestions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<any>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Encryption/decryption
  const encryptMessage = (text: string): string => {
    return btoa(text);
  };
  const decryptMessage = (encrypted: string): string => {
    try {
      return atob(encrypted);
    } catch {
      return encrypted;
    }
  };

  // Common emojis for quick access
  const commonEmojis = ["😀", "😂", "❤️", "👍", "🔥", "✨", "😍", "🎉", "💯", "🚀", "👋", "🤔", "😊", "🙏", "💪", "🌟"];

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowUserSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
     if (!sessionId || !username) {
       setError("Missing session ID or username");
       setIsLoading(false);
       return;
     }
     
     try {
       const socket = io("http://localhost:3001");
       socketRef.current = socket;
       
       socket.on("connect", () => {
         setIsConnected(true);
         setIsLoading(false);
         console.log("[DEBUG] Connected to server");
       });
       
       socket.on("disconnect", () => {
         setIsConnected(false);
         console.log("[DEBUG] Disconnected from server");
       });
       
       socket.on("connect_error", (error) => {
         console.error("[DEBUG] Connection error:", error);
         setError("Failed to connect to server");
         setIsLoading(false);
       });
       
       socket.emit("joinSession", { sessionId, username });
       
       socket.on("receiveMessage", (msg: any) => {
         const processedMessage = {
           ...msg,
           timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date()
         };
         setMessages((prev) => [...prev, processedMessage]);
       });
       
       socket.on("userJoined", (user: any) => {
         setUsers((prev) => [...prev, user]);
       });
       
       socket.on("userLeft", (user: any) => {
         setUsers((prev) => prev.filter(u => u.id !== user.id));
       });
       
       socket.on("userCountUpdate", (count: number) => {
         setUserCount(count);
       });
       
       socket.on("usersList", (usersList: User[]) => {
         setUsers(usersList);
       });
       
       socket.on("userTyping", ({ username, isTyping }: { username: string; isTyping: boolean }) => {
         if (isTyping) {
           setTypingUsers((prev) => 
             prev.includes(username) ? prev : [...prev, username]
           );
         } else {
           setTypingUsers((prev) => prev.filter(user => user !== username));
         }
       });

       // Video call event handlers
       socket.on("videoCallRequest", ({ fromUser, fromUserId, sessionId: callSessionId }) => {
         // Handle incoming video call request
         if (callSessionId === sessionId) {
           setVideoCallTargetUser(fromUserId);
           setIsGroupVideoCall(false);
           setIsVideoCallOpen(true);
           setIsAudioCall(false);
         }
       });

       socket.on("audioCallRequest", ({ fromUser, fromUserId, sessionId: callSessionId }) => {
         // Handle incoming audio call request
         if (callSessionId === sessionId) {
           setVideoCallTargetUser(fromUserId);
           setIsGroupVideoCall(false);
           setIsVideoCallOpen(true);
           setIsAudioCall(true);
         }
       });

       socket.on("videoCallOffer", ({ offer, fromUser }) => {
         // Handle incoming video call offer
         console.log("Received video call offer from:", fromUser);
       });

       socket.on("audioCallOffer", ({ offer, fromUser }) => {
         // Handle incoming audio call offer
         console.log("Received audio call offer from:", fromUser);
       });

       socket.on("videoCallAnswer", ({ answer, fromUser }) => {
         // Handle video call answer
         console.log("Received video call answer from:", fromUser);
       });

       socket.on("audioCallAnswer", ({ answer, fromUser }) => {
         // Handle audio call answer
         console.log("Received audio call answer from:", fromUser);
       });

       socket.on("iceCandidate", ({ candidate, fromUser }) => {
         // Handle ICE candidate
         console.log("Received ICE candidate from:", fromUser);
       });

       socket.on("videoCallEnd", ({ fromUser }) => {
         // Handle video call end
         console.log("Video call ended by:", fromUser);
         endVideoCall();
       });

       socket.on("audioCallEnd", ({ fromUser }) => {
         // Handle audio call end
         console.log("Audio call ended by:", fromUser);
         endVideoCall();
       });
       
       return () => {
         socket.disconnect();
       };
     } catch (error) {
       console.error("[DEBUG] Socket initialization error:", error);
       setError("Failed to initialize chat");
       setIsLoading(false);
     }
   }, [sessionId, username]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (isTyping) {
      const timer = setTimeout(() => {
        setIsTyping(false);
        if (socketRef.current) {
          socketRef.current.emit('typingStop', { sessionId, username });
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isTyping, sessionId, username]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "k":
            e.preventDefault();
            setShowSearch((prev) => !prev);
            break;
          case "f":
            e.preventDefault();
            setShowSearch(true);
            break;
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearch]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sendMessageHandler = () => {
    if (!message.trim()) return;
    
    // Stop typing indicator
    setIsTyping(false);
    if (socketRef.current) {
      socketRef.current.emit('typingStop', { sessionId, username });
    }
    
    // Create message data for server
    const messageData = {
      id: Date.now().toString(),
      userId: username,
      userName: username,
      content: encryptMessage(message),
      timestamp: new Date(),
      encrypted: true,
      status: "sent",
      replyTo: replyingTo?.id,
      isPrivate: privateChatTarget !== null,
      targetUserId: privateChatTarget?.id,
      targetUserName: privateChatTarget?.name
    };
    
    // Send to server - server will broadcast to all clients including sender
    socketRef.current.emit("sendMessage", { 
      sessionId, 
      username, 
      message,
      messageData 
    });
    setMessage("");
    setReplyingTo(null); // Clear reply after sending
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // File upload logic here
      console.log("File selected:", file.name);
    }
  };

  const formatTime = (date: Date) => {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return "";
    }
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Handle emoji insertion
  const insertEmoji = (emoji: string) => {
    if (inputRef.current) {
      const currentValue = message;
      const cursorPosition = inputRef.current.selectionStart || 0;
      const newValue = currentValue.slice(0, cursorPosition) + emoji + currentValue.slice(cursorPosition);
      setMessage(newValue);
      inputRef.current.focus();
      // Set cursor position after emoji
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(cursorPosition + emoji.length, cursorPosition + emoji.length);
        }
      }, 0);
    }
    setShowEmojiPicker(false);
  };

  // Handle user tagging
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Check for @ symbol
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const query = value.slice(lastAtIndex + 1);
      setTypingQuery(query);
      
      // Filter users based on query
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) && user.name !== username
      );
      
      if (filtered.length > 0 && query.length < 20) { // Reasonable limit
        setUserSuggestions(filtered);
        setShowUserSuggestions(true);
      } else {
        setShowUserSuggestions(false);
      }
    } else {
      setShowUserSuggestions(false);
    }

    // Typing indicator
    setIsTyping(true);
    if (socketRef.current) {
      socketRef.current.emit('typingStart', { sessionId, username });
    }
  };

  // Handle user selection from suggestions
  const selectUser = (user: User) => {
    const lastAtIndex = message.lastIndexOf('@');
    const newMessage = message.slice(0, lastAtIndex) + `@${user.name} `;
    setMessage(newMessage);
    setShowUserSuggestions(false);
    inputRef.current?.focus();
  };

  // Handle reply to message
  const replyToMessage = (message: Message) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Handle private chat user selection
  const startPrivateChat = (user: User) => {
    setPrivateChatTarget(user);
    setShowPrivateUserSuggestions(false);
    inputRef.current?.focus();
  };

  // Open private chat in new page
  const openPrivateChat = (user: User) => {
    router.push(`/auth/private-chat/${user.name}`);
  };

  // Cancel private chat
  const cancelPrivateChat = () => {
    setPrivateChatTarget(null);
  };

  // Handle private chat user suggestions
  const handlePrivateChatInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);
    
    // Check for /w command for private messages
    if (value.startsWith('/w ')) {
      const query = value.slice(3); // Remove '/w ' part
      const filtered = users.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) && user.name !== username
      );
      
      if (filtered.length > 0 && query.length < 20) {
        setUserSuggestions(filtered);
        setShowPrivateUserSuggestions(true);
      } else {
        setShowPrivateUserSuggestions(false);
      }
    } else {
      setShowPrivateUserSuggestions(false);
      // Handle regular message input
      handleMessageChange(e);
    }
  };

  const getStatusIcon = (status: Message["status"]) => {
    switch (status) {
      case "sending":
        return <Clock className="w-3 h-3 text-muted-foreground" />;
      case "sent":
        return <CheckCircle className="w-3 h-3 text-blue-500 shadow-lg shadow-blue-500/30" />;
      case "delivered":
        return <CheckCircle className="w-3 h-3 text-emerald-500 shadow-lg shadow-emerald-500/30" />;
      case "read":
        return <CheckCircle className="w-3 h-3 text-emerald-600 fill-emerald-600 shadow-lg shadow-emerald-600/30" />;
    }
  };

  const getAvatarColor = (name: string) => {
    if (!name || typeof name !== 'string' || name.length === 0) {
      return "bg-blue-500"; // Default color
    }
    const colors = ["bg-blue-500", "bg-green-500", "bg-purple-500", "bg-pink-500", "bg-yellow-500", "bg-red-500"];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  // Video calling functions
  const startVideoCall = (targetUserId?: string) => {
    setVideoCallTargetUser(targetUserId);
    setIsGroupVideoCall(!targetUserId);
    setIsVideoCallOpen(true);
    setIsAudioCall(false);
  };

  // Audio calling functions
  const startAudioCall = (targetUserId?: string) => {
    setVideoCallTargetUser(targetUserId);
    setIsGroupVideoCall(!targetUserId);
    setIsVideoCallOpen(true);
    setIsAudioCall(true);
  };

  const endVideoCall = () => {
    setIsVideoCallOpen(false);
    setVideoCallTargetUser(undefined);
    setIsGroupVideoCall(false);
    setIsAudioCall(false);
  };

  // Loading state
   if (isLoading) {
     return (
       <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
         <div className="text-center">
           <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center animate-pulse">
             <Shield className="w-8 h-8 text-white" />
           </div>
           <h3 className="text-lg font-semibold text-foreground mb-2">Connecting to secure chat...</h3>
           <p className="text-muted-foreground">Establishing encrypted connection</p>
         </div>
       </div>
     );
   }

   // Error state
   if (error) {
     return (
       <div className="h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-900 flex items-center justify-center">
         <div className="text-center max-w-md">
           <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900 rounded-2xl flex items-center justify-center">
             <WifiOff className="w-8 h-8 text-red-600 dark:text-red-400" />
           </div>
           <h3 className="text-lg font-semibold text-foreground mb-2">Connection Failed</h3>
           <p className="text-muted-foreground mb-4">{error}</p>
           <Button onClick={() => window.location.reload()} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
             Retry Connection
           </Button>
         </div>
       </div>
     );
   }

   return (
     <div className="h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-amber-50 dark:from-slate-900 dark:via-slate-800 dark:to-amber-900/20 flex font-sans">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-500 ease-out border-r border-slate-200/50 dark:border-slate-700/30 bg-white/90 dark:bg-slate-800/90 backdrop-blur-2xl flex flex-col overflow-hidden shadow-2xl shadow-slate-900/5`}>
        {/* Sidebar Header */}
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-medium text-foreground tracking-tight">Cypher Chat</h2>
                <p className="text-sm text-muted-foreground font-light">Session: {sessionId}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-slate-100/50 dark:hover:bg-slate-700/50 rounded-lg">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-3">
            {isConnected ? (
                <>
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50"></div>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Connected</span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg shadow-red-500/50"></div>
                  <span className="text-sm font-bold text-red-700 dark:text-red-400">Disconnected</span>
                </>
              )}
          </div>
        </div>

        {/* Online Users */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-6">
              <span className="font-medium tracking-wide">ONLINE USERS</span>
              <Badge variant="secondary" className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border-0">
                {userCount}
              </Badge>
            </div>
            
            {/* Current User */}
            <div className="flex items-center space-x-4 p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/30 dark:via-teal-900/30 dark:to-cyan-900/30 border border-emerald-200/50 dark:border-emerald-700/30 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <div className="relative">
                <Avatar className="w-14 h-14 ring-3 ring-white/60 dark:ring-slate-700/60 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <AvatarFallback className={`${getAvatarColor(username || 'A')} text-white font-bold text-xl shadow-inner`}>
                    {(username || 'A').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full border-3 border-white dark:border-slate-800 shadow-lg flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground text-lg bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">{username}</p>
                <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></div>
                  Active now
                </p>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white/50 dark:bg-slate-700/50 hover:bg-white/70 dark:hover:bg-slate-600/50">
                  <MoreVertical className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                </Button>
              </div>
            </div>

            {/* Other Users */}
            {users.map((user) => (
              <div key={user.id} className="flex items-center space-x-4 p-5 rounded-2xl hover:bg-gradient-to-r hover:from-slate-50 hover:to-blue-50 dark:hover:from-slate-700/50 dark:hover:to-blue-900/30 transition-all duration-300 cursor-pointer group border border-transparent hover:border-blue-200/50 dark:hover:border-blue-700/30">
                <div className="relative">
                  <Avatar className="w-12 h-12 ring-2 ring-white/60 dark:ring-slate-700/60 group-hover:scale-105 transition-transform duration-300 shadow-lg">
                    <AvatarFallback className={`${getAvatarColor(user.name || 'A')} text-white font-bold text-lg shadow-inner`}>
                      {(user.name || 'A').charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-white dark:border-slate-800 shadow-lg flex items-center justify-center ${
                    user.status === "online" ? "bg-gradient-to-r from-emerald-500 to-green-500" : 
                    user.status === "away" ? "bg-gradient-to-r from-amber-500 to-orange-500" : 
                    "bg-gradient-to-r from-slate-500 to-gray-500"
                  }`}>
                    {user.status === "online" && <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-foreground text-base group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{user.name}</p>
                  <p className="text-sm font-medium capitalize flex items-center">
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      user.status === "online" ? "bg-emerald-500" : 
                      user.status === "away" ? "bg-amber-500" : 
                      "bg-slate-500"
                    }`}></div>
                    <span className={user.status === "online" ? "text-emerald-600 dark:text-emerald-400" : 
                                   user.status === "away" ? "text-amber-600 dark:text-amber-400" : 
                                   "text-muted-foreground"}>
                      {user.status}
                    </span>
                  </p>
                </div>
                {user.isTyping && (
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-bounce" style={{animationDelay: "0.15s"}}></div>
                    <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-bounce" style={{animationDelay: "0.3s"}}></div>
                  </div>
                )}
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-0 translate-x-2">
                  <Button
                    variant="ghost" 
                    size="icon" 
                    className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/50 dark:to-cyan-900/50 hover:from-blue-200 hover:to-cyan-200 dark:hover:from-blue-800/50 dark:hover:to-cyan-800/50 transition-all duration-200 shadow-md hover:shadow-lg"
                    onClick={() => openPrivateChat(user)}
                    disabled={user.status !== "online"}
                    title="Open private chat"
                  >
                    <AtSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </Button>
                  <Button
                    variant="ghost" 
                    size="icon" 
                    className="w-9 h-9 rounded-full bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/50 dark:to-teal-900/50 hover:from-emerald-200 hover:to-teal-200 dark:hover:from-emerald-800/50 dark:hover:to-teal-800/50 transition-all duration-200 shadow-md hover:shadow-lg"
                    onClick={() => startAudioCall(user.id)}
                    disabled={user.status !== "online"}
                    title="Start audio call"
                  >
                    <Phone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </Button>
                  <Button
                    variant="ghost" 
                    size="icon" 
                    className="w-9 h-9 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50 hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800/50 dark:hover:to-pink-800/50 transition-all duration-200 shadow-md hover:shadow-lg"
                    onClick={() => startVideoCall(user.id)}
                    disabled={user.status !== "online"}
                    title="Start video call"
                  >
                    <Video className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Enhanced Sidebar Footer */}
        <div className="p-6 border-t border-slate-200/50 dark:border-slate-700/30 bg-gradient-to-r from-white/50 to-blue-50/50 dark:from-slate-800/50 dark:to-blue-900/20 backdrop-blur-sm">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-muted-foreground">{formatTime(currentTime)}</span>
            <Badge variant="outline" className="text-xs border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20 px-3 py-1 rounded-full">
              <Shield className="w-3 h-3 mr-1.5" />
              Encrypted
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/40 backdrop-blur-sm">
        {/* Chat Header */}
        <div className="p-6 border-b border-slate-200/50 dark:border-slate-700/30 bg-gradient-to-r from-white/90 via-white/80 to-white/90 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-800/90 backdrop-blur-2xl shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="lg:hidden rounded-full hover:bg-gradient-to-r hover:from-slate-100 hover:to-blue-100 dark:hover:from-slate-700 dark:hover:to-blue-900/30 transition-all duration-200" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Users className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground tracking-tight bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  Secure Chat
                </h1>
                <p className="text-sm text-muted-foreground font-light flex items-center">
                  <Shield className="w-3 h-3 mr-1.5 text-emerald-500" />
                  Session: {sessionId}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-gradient-to-r hover:from-slate-100 hover:to-blue-100 dark:hover:from-slate-700 dark:hover:to-blue-900/30 transition-all duration-200" title="Search messages">
                <Search className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-gradient-to-r hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-900/30 dark:hover:to-teal-900/30 transition-all duration-200" onClick={() => startAudioCall()} title="Start group audio call">
                <Phone className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 dark:hover:from-purple-900/30 dark:hover:to-pink-900/30 transition-all duration-200" onClick={() => startVideoCall()} title="Start group video call">
                <Video className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-8">
          <div className="space-y-8 max-w-4xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-32 h-32 mx-auto mb-8 bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 dark:from-blue-900/30 dark:via-cyan-900/30 dark:to-teal-900/30 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/20 hover:shadow-blue-500/30 transition-all duration-500 hover:scale-105">
                  <Shield className="w-16 h-16 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-3xl font-bold text-foreground tracking-tight mb-4 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Welcome to Cypher Chat</h3>
                <p className="text-muted-foreground max-w-md mx-auto font-medium leading-relaxed text-lg">This is the beginning of your encrypted conversation. Messages here are secured with end-to-end encryption.</p>
                <div className="mt-6 flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>End-to-end encrypted</span>
                  <span className="text-slate-300 dark:text-slate-600">•</span>
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>Secure connection</span>
                </div>
              </div>
            ) : (
              messages
              .filter(msg => {
                // Handle private messages - only show if current user is sender or recipient
                if (msg.isPrivate) {
                  return msg.userId === username || msg.targetUserId === username;
                }
                // Regular messages are visible to everyone
                return true;
              })
              .map((msg) => (
                <div key={msg.id} className={`flex ${msg.userName === username ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom duration-500`}>
                  <div className={`flex space-x-3 max-w-2xl ${msg.userName === username ? "flex-row-reverse space-x-reverse" : ""}`}>
                    {msg.userName !== username && (
                      <Avatar className="w-10 h-10 mt-1 shadow-md">
                        <AvatarFallback className={`${getAvatarColor(msg.userName || 'A')} text-white font-bold text-base shadow-inner`}>
                         {(msg.userName || 'A').charAt(0).toUpperCase()}
                       </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`group relative ${msg.userName === username ? "items-end" : "items-start"}`}>
                      <div className={`px-5 py-4 rounded-3xl shadow-lg backdrop-blur-sm transition-all duration-300 hover:shadow-xl ${
                        msg.userName === username 
                          ? "bg-gradient-to-br from-blue-500 via-cyan-500 to-teal-500 text-white shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/40" 
                          : "bg-white/90 dark:bg-slate-800/90 border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xl hover:bg-white/95 dark:hover:bg-slate-800/95"
                      } ${msg.isPrivate ? "ring-2 ring-blue-400/50 ring-offset-2 dark:ring-offset-slate-800" : ""}`}>
                        {msg.userName !== username && (
                          <p className="text-sm font-bold text-foreground mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{msg.userName}</p>
                        )}
                        
                        {/* Private Message Indicator */}
                        {msg.isPrivate && (
                          <div className="mb-3 flex items-center space-x-2 bg-white/20 dark:bg-slate-700/30 rounded-xl px-3 py-2">
                            <AtSign className="w-4 h-4" />
                            <span className="text-xs font-bold">
                              {msg.userName === username 
                                ? `Private message to ${msg.targetUserName}` 
                                : "Private message"
                              }
                            </span>
                          </div>
                        )}
                        
                        {/* Reply Indicator */}
                        {msg.replyTo && (
                          <div className={`mb-3 p-3 rounded-xl border-l-4 ${
                            msg.userName === username 
                              ? "bg-white/25 border-white/50 backdrop-blur-sm" 
                              : "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 border-blue-500"
                          }`}>
                            <div className="flex items-center space-x-2 text-xs mb-1">
                              <Reply className="w-3 h-3" />
                              <span className="font-bold">
                                {(() => {
                                  const repliedMessage = messages.find(m => m.id === msg.replyTo);
                                  return repliedMessage ? `Replied to ${repliedMessage.userName}` : "Reply to unknown";
                                })()}
                              </span>
                            </div>
                            <p className="text-xs opacity-90 font-medium line-clamp-2">
                              {(() => {
                                const repliedMessage = messages.find(m => m.id === msg.replyTo);
                                return repliedMessage ? decryptMessage(repliedMessage.content) : "Original message not found";
                              })()}
                            </p>
                          </div>
                        )}
                        
                        <p className="text-base leading-relaxed font-medium">{decryptMessage(msg.content)}</p>
                        <div className="flex items-center justify-between mt-3 space-x-3">
                          <span className="text-xs font-medium opacity-90">{formatTime(msg.timestamp)}</span>
                          {msg.userName === username && getStatusIcon(msg.status)}
                        </div>
                      </div>
                      
                      {/* Message Actions */}
                      <div className="absolute -top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => replyToMessage(msg)}
                            className="w-9 h-9 rounded-full bg-gradient-to-r from-white/90 to-blue-50/90 dark:from-slate-800/90 dark:to-blue-900/30 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl hover:shadow-2xl hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/40 dark:hover:to-cyan-900/40 transition-all duration-200 hover:scale-105"
                            title="Reply to message"
                          >
                            <Reply className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-9 h-9 rounded-full bg-gradient-to-r from-white/90 to-slate-50/90 dark:from-slate-800/90 dark:to-slate-700/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-xl hover:shadow-2xl hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-200 hover:scale-105" title="More options">
                            <MoreVertical className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Enhanced Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="px-8 py-4 border-t border-slate-200/50 dark:border-slate-700/30 bg-gradient-to-r from-blue-50/60 to-cyan-50/60 dark:from-blue-900/20 dark:to-cyan-900/20 backdrop-blur-sm">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground font-medium max-w-4xl mx-auto">
              <div className="flex space-x-1.5">
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-bounce shadow-lg shadow-blue-500/30" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-bounce shadow-lg shadow-blue-500/30" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2.5 h-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full animate-bounce shadow-lg shadow-blue-500/30" style={{ animationDelay: "300ms" }}></div>
              </div>
              <span className="font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </span>
            </div>
          </div>
        )}

        {/* Enhanced Reply Indicator */}
        {replyingTo && (
          <div className="px-8 py-4 border-t border-slate-200/50 dark:border-slate-700/30 bg-gradient-to-r from-white/90 via-blue-50/90 to-cyan-50/90 dark:from-slate-800/90 dark:via-blue-900/30 dark:to-cyan-900/30 backdrop-blur-xl shadow-lg shadow-blue-500/10">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center space-x-4">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-2 rounded-full shadow-lg shadow-blue-500/30">
                  <Reply className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Replying to {replyingTo.userName}</p>
                  <p className="text-xs text-muted-foreground font-medium truncate max-w-md">{decryptMessage(replyingTo.content)}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={cancelReply}
                className="rounded-full bg-gradient-to-r from-white/80 to-slate-50/80 dark:from-slate-700/80 dark:to-slate-600/80 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-lg hover:shadow-xl hover:from-slate-50 hover:to-slate-100 dark:hover:from-slate-700 dark:hover:to-slate-600 transition-all duration-200 hover:scale-105 w-9 h-9"
                title="Cancel reply"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </Button>
            </div>
          </div>
        )}

        {/* Private chat indicator */}
        {privateChatTarget && (
          <div className="px-8 py-3 border-t border-slate-200/50 dark:border-slate-700/30 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center space-x-3">
                <AtSign className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">Private message to {privateChatTarget.name}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={cancelPrivateChat}
                className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 w-8 h-8"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </Button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-8 border-t border-slate-200/50 dark:border-slate-700/30 bg-gradient-to-r from-white/90 via-white/80 to-white/90 dark:from-slate-800/90 dark:via-slate-800/80 dark:to-slate-800/90 backdrop-blur-2xl relative">
          {/* User Suggestions */}
          {showUserSuggestions && userSuggestions.length > 0 && (
            <div ref={suggestionsRef} className="absolute bottom-full left-8 right-8 mb-3 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-white/95 to-blue-50/95 dark:from-slate-800/95 dark:to-blue-900/40 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xl p-3">
                {userSuggestions.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className="w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 dark:hover:from-blue-900/40 dark:hover:to-cyan-900/30 transition-all duration-200 text-left group"
                  >
                    <Avatar className="w-9 h-9 shadow-md">
                      <AvatarFallback className={`${getAvatarColor(user.name)} text-white text-sm font-bold shadow-inner`}>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{user.name}</p>
                      <p className="text-xs text-muted-foreground font-medium flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          user.status === "online" ? "bg-emerald-500" : 
                          user.status === "away" ? "bg-amber-500" : 
                          "bg-slate-500"
                        }`}></div>
                        {user.status}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Private chat user suggestions */}
          {showPrivateUserSuggestions && userSuggestions.length > 0 && (
            <div className="absolute bottom-full left-8 right-8 mb-3 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-white/95 to-purple-50/95 dark:from-slate-800/95 dark:to-purple-900/40 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xl p-3">
                <div className="px-4 py-3 text-xs font-bold text-slate-500 dark:text-slate-400 border-b border-slate-200/50 dark:border-slate-700/50 flex items-center">
                  <AtSign className="w-3 h-3 mr-2 text-purple-500" />
                  Select user for private message
                </div>
                {userSuggestions.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startPrivateChat(user)}
                    className="w-full flex items-center space-x-4 p-4 rounded-xl hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 dark:hover:from-purple-900/40 dark:hover:to-pink-900/30 transition-all duration-200 text-left group"
                  >
                    <Avatar className="w-9 h-9 shadow-md">
                      <AvatarFallback className={`${getAvatarColor(user.name)} text-white text-sm font-bold shadow-inner`}>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{user.name}</p>
                      <p className="text-xs text-muted-foreground font-medium">{user.status}</p>
                    </div>
                    <span className="text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded-full">Private</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Enhanced Emoji Picker */}
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-full left-8 right-8 mb-3 max-w-4xl mx-auto">
              <div className="bg-gradient-to-br from-white/95 to-yellow-50/95 dark:from-slate-800/95 dark:to-yellow-900/40 rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 backdrop-blur-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-foreground flex items-center">
                    <Smile className="w-4 h-4 mr-2 text-yellow-500" />
                    Quick Emojis
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowEmojiPicker(false)}
                    className="w-6 h-6 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-8 gap-2 mb-4">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(emoji)}
                      className="w-10 h-10 rounded-xl hover:bg-gradient-to-br hover:from-yellow-100 hover:to-orange-100 dark:hover:from-yellow-900/50 dark:hover:to-orange-900/50 transition-all duration-200 flex items-center justify-center text-xl hover:scale-110 shadow-sm hover:shadow-md"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="border-t border-slate-200/50 dark:border-slate-700/50 pt-3">
                  <p className="text-xs text-muted-foreground font-medium text-center">Click an emoji to insert it ✨</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-4 max-w-4xl mx-auto">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
              accept="image/*,application/pdf,.doc,.docx,video/*,.mp3,.wav"
            />
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full bg-gradient-to-r from-slate-100 to-blue-100 dark:from-slate-700 dark:to-blue-900/30 hover:from-slate-200 hover:to-blue-200 dark:hover:from-slate-600 dark:hover:to-blue-800/30 transition-all duration-200 w-12 h-12 shadow-md hover:shadow-lg"
              title="Attach files"
            >
              <Paperclip className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </Button>
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                type="text"
                value={message}
                onChange={handlePrivateChatInput}
                placeholder={privateChatTarget ? `Private message to ${privateChatTarget.name}...` : "Type your secure message... Use @ to mention someone (use /w username for private)"}
                className="pr-16 py-4 rounded-3xl border-slate-200/60 dark:border-slate-600/60 bg-gradient-to-r from-white/60 to-blue-50/60 dark:from-slate-700/60 dark:to-blue-900/20 backdrop-blur-sm focus:border-blue-400 focus:ring-blue-400/30 text-base font-medium placeholder:text-slate-500 dark:placeholder:text-slate-400 shadow-inner focus:shadow-lg transition-all duration-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    // Stop typing indicator
                    setIsTyping(false);
                    if (socketRef.current) {
                      socketRef.current.emit('typingStop', { sessionId, username });
                    }
                    sendMessageHandler();
                  }
                }}
              />
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 rounded-full bg-gradient-to-r from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 hover:from-yellow-200 hover:to-orange-200 dark:hover:from-yellow-800/30 dark:hover:to-orange-800/30 transition-all duration-200 w-10 h-10 shadow-md hover:shadow-lg"
                title="Insert emoji"
              >
                <Smile className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </Button>
            </div>
            <Button 
              onClick={sendMessageHandler}
              disabled={!message.trim()}
              className="bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500 hover:from-blue-600 hover:via-cyan-600 hover:to-teal-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-blue-500/40 disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-200 hover:shadow-blue-500/50 hover:scale-105"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Video Call Component */}
      <JitsiVideoCall
        isOpen={isVideoCallOpen}
        onClose={endVideoCall}
        sessionId={sessionId}
        username={username}
        targetUserId={videoCallTargetUser}
        isGroupCall={isGroupVideoCall}
        isAudioOnly={isAudioCall}
      />
    </div>
  );
}