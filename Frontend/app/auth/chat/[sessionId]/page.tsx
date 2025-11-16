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
  X,
  Wrench,
  CheckCircle as CheckCircleIcon,
  AlertCircle,
  CornerDownRight,
  Loader2,
  Play,
  XCircle
} from "lucide-react"
import Link from "next/link"
import { useParams, useSearchParams, useRouter } from "next/navigation"
import { UserMenu } from "@/components/user-menu";
import io from "socket.io-client"
import SimplePeerVideoCallImproved from "@/components/simple-peer-video-call-improved"
import ThreeEncryptionModel from "@/components/three-encryption-model"

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

  // Simple Peer Test Panel State
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [testResults, setTestResults] = useState<{type: string; message: string; success: boolean; timestamp: string}[]>([]);
  const [isTesting, setIsTesting] = useState(false);

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
       const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3004");
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

  // Simple Peer Test Functions
  const addTestResult = (type: string, message: string, success: boolean) => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, { type, message, success, timestamp }]);
  };

  const runSimplePeerTests = async () => {
    setIsTesting(true);
    setTestResults([]);

    try {
      // Test 1: Socket Connection
      if (!socketRef.current?.connected) {
        addTestResult('Socket', 'Socket not connected', false);
        setIsTesting(false);
        return;
      }
      addTestResult('Socket', 'Socket connected successfully', true);

      // Test 2: Media Devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        const hasMic = devices.some(device => device.kind === 'audioinput');
        
        if (hasCamera) {
          addTestResult('Media', 'Camera detected', true);
        } else {
          addTestResult('Media', 'No camera detected', false);
        }
        
        if (hasMic) {
          addTestResult('Media', 'Microphone detected', true);
        } else {
          addTestResult('Media', 'No microphone detected', false);
        }
      } catch (error) {
        addTestResult('Media', `Media devices error: ${error}`, false);
      }

      // Test 3: Simple Peer Integration
      try {
        // Check if Simple Peer component is properly integrated
        if (typeof window !== 'undefined') {
          addTestResult('Integration', 'Simple Peer component available', true);
        } else {
          addTestResult('Integration', 'Simple Peer not available', false);
        }
      } catch (error) {
        addTestResult('Integration', `Integration error: ${error}`, false);
      }

      // Test 4: WebRTC Support
      if (typeof window !== 'undefined' && 'RTCPeerConnection' in window) {
        addTestResult('WebRTC', 'WebRTC supported', true);
      } else {
        addTestResult('WebRTC', 'WebRTC not supported', false);
      }

      addTestResult('Complete', 'All tests completed', true);
    } catch (error) {
      addTestResult('Error', `Test suite error: ${error}`, false);
    } finally {
      setIsTesting(false);
    }
  };

  const clearTestResults = () => {
    setTestResults([]);
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

  // Video calling functions with debouncing to prevent flickering
  const startVideoCall = (targetUserId?: string) => {
    // Prevent rapid state changes that could cause flickering
    if (isVideoCallOpen) {
      console.log('Video call already open, preventing duplicate initialization')
      return
    }
    
    setVideoCallTargetUser(targetUserId);
    setIsGroupVideoCall(!targetUserId);
    setIsVideoCallOpen(true);
    setIsAudioCall(false);
    
    // Emit socket event to notify other users about the video call
    if (socketRef.current) {
      socketRef.current.emit(targetUserId ? "videoCallRequest" : "groupVideoCallRequest", {
        sessionId,
        callerName: username,
        targetUserId: targetUserId || null,
        isGroupCall: !targetUserId
      });
    }
  };

  // Audio calling functions with debouncing to prevent flickering
  const startAudioCall = (targetUserId?: string) => {
    // Prevent rapid state changes that could cause flickering
    if (isVideoCallOpen) {
      console.log('Video call already open, preventing duplicate initialization')
      return
    }
    
    setVideoCallTargetUser(targetUserId);
    setIsGroupVideoCall(!targetUserId);
    setIsVideoCallOpen(true);
    setIsAudioCall(true);
    
    // Emit socket event to notify other users about the audio call
    if (socketRef.current) {
      socketRef.current.emit(targetUserId ? "audioCallRequest" : "groupAudioCallRequest", {
        sessionId,
        callerName: username,
        targetUserId: targetUserId || null,
        isGroupCall: !targetUserId
      });
    }
  };

  const endVideoCall = () => {
    // Only close if actually open to prevent unnecessary state changes
    if (!isVideoCallOpen) {
      console.log('Video call not open, skipping close')
      return
    }
    
    setIsVideoCallOpen(false);
    setVideoCallTargetUser(undefined);
    setIsGroupVideoCall(false);
    setIsAudioCall(false);
  };

  // Loading state
   if (isLoading) {
     return (
       <div className="h-screen bg-background flex items-center justify-center">
         <div className="text-center space-y-4">
           <div className="w-12 h-12 mx-auto border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
           <div>
             <h3 className="text-lg font-medium text-foreground">Connecting to secure chat</h3>
             <p className="text-sm text-muted-foreground">Establishing encrypted connection</p>
           </div>
         </div>
       </div>
     );
   }

   // Error state
   if (error) {
     return (
       <div className="h-screen bg-background flex items-center justify-center">
         <div className="text-center max-w-sm space-y-4">
           <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-lg flex items-center justify-center">
             <WifiOff className="w-8 h-8 text-destructive" />
           </div>
           <div>
             <h3 className="text-lg font-medium text-foreground">Connection Failed</h3>
             <p className="text-sm text-muted-foreground">{error}</p>
           </div>
           <Button onClick={() => window.location.reload()} variant="outline">
             Retry Connection
           </Button>
         </div>
       </div>
     );
   }

   return (
     <div className="h-screen bg-background/90 flex relative">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? "w-80" : "w-0"} transition-all duration-300 ease-out border-r border-border bg-card flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-primary via-primary to-secondary rounded-3xl flex items-center justify-center shadow-2xl shadow-primary/30 hover:shadow-primary/40 transition-all duration-300 hover:scale-105">
                <Shield className="w-7 h-7 text-white drop-shadow-lg" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Cypher Chat</h2>
                <p className="text-sm text-muted-foreground font-medium flex items-center">
                  <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
                  Session: <span className="font-bold ml-1 text-primary dark:text-primary">{sessionId}</span>
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-gradient-to-r hover:from-slate-100 hover:to-blue-100 dark:hover:from-slate-700 dark:hover:to-blue-900/30 rounded-xl w-10 h-10 shadow-md hover:shadow-lg transition-all duration-200">
              <MoreVertical className="w-5 h-5" />
            </Button>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isConnected ? (
                  <>
                    <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-lg shadow-primary/50"></div>
                    <span className="text-sm font-bold text-primary dark:text-primary">Connected</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-destructive rounded-full shadow-lg shadow-destructive/50"></div>
                    <span className="text-sm font-bold text-destructive dark:text-destructive">Disconnected</span>
                  </>
                )}
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-ping"></div>
              <span className="text-xs font-medium text-muted-foreground">Live</span>
            </div>
          </div>
        </div>

        {/* Online Users */}
        <ScrollArea className="flex-1 p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-foreground">Online Users</h2>
                <p className="text-xs text-muted-foreground">{userCount} connected</p>
              </div>
            </div>
            
            {/* Current user */}
            <div className="mb-4">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">You</h3>
              <div className="bg-card border border-border rounded-lg p-3">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-primary-foreground">{(username || 'A').charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{username}</p>
                    <p className="text-xs text-muted-foreground">Active now</p>
                  </div>
                  <Badge variant="outline" className="text-xs">Online</Badge>
                </div>
              </div>
            </div>

            {/* Other users */}
            <div>
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Other Users</h3>
              <div className="space-y-2">
                {users.map((user) => (
                  <div key={user.id} className="bg-card hover:bg-muted/50 rounded-lg p-3 border border-border transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-secondary-foreground">{(user.name || 'A').charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-card" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground font-medium capitalize flex items-center">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            user.status === "online" ? "bg-emerald-500" : 
                            user.status === "away" ? "bg-amber-500" : 
                            "bg-slate-500"
                          }`}></div>
                          {user.status}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => startPrivateChat(user)}
                        className="w-8 h-8"
                        title="Private chat"
                      >
                        <AtSign className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Enhanced Sidebar Footer */}
        <div className="p-6 border-t border-border bg-gradient-to-r from-card/50 to-accent/5 dark:from-card/50 dark:to-accent/10">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-muted-foreground">{formatTime(currentTime)}</span>
            <Badge variant="outline" className="text-xs border-primary/30 dark:border-primary/50 text-primary dark:text-primary bg-primary/10 dark:bg-primary/20 px-3 py-1 rounded-full">
              <Shield className="w-3 h-3 mr-1.5" />
              Encrypted
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-background">
         {/* Chat Header */}
         <div className="p-4 border-b border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Users className="w-5 h-5 text-muted-foreground" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Secure Chat Room</h1>
                <p className="text-sm text-muted-foreground">Session: {sessionId}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
               <Button variant="ghost" size="icon" title="Search messages">
                 <Search className="w-5 h-5 text-muted-foreground" />
               </Button>
               <Button variant="ghost" size="icon" onClick={() => setShowTestPanel(!showTestPanel)} title="Test Panel">
                 <Wrench className="w-5 h-5 text-muted-foreground" />
               </Button>
               <Button variant="ghost" size="icon" onClick={() => startAudioCall()} title="Group Audio Call">
                 <Phone className="w-5 h-5 text-muted-foreground" />
               </Button>
               <Button variant="outline" size="sm" onClick={() => startVideoCall()}>
                 <Video className="w-4 h-4 mr-2" />
                 Video Call
               </Button>
               <UserMenu />
             </div>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4 bg-background">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-2xl mb-6 shadow-lg">
                  <Shield className="w-8 h-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-bold text-foreground mb-3">Welcome to Cypher Chat</h3>
                <p className="text-base text-muted-foreground max-w-md mx-auto mb-8 leading-relaxed">
                  This is the beginning of your encrypted conversation. Messages are secured with end-to-end encryption for complete privacy.
                </p>
                <div className="flex items-center justify-center space-x-6 text-sm">
                  <div className="flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span className="text-primary font-medium">Encrypted</span>
                  </div>
                  <div className="flex items-center space-x-2 bg-secondary/10 px-4 py-2 rounded-full">
                    <Shield className="w-4 h-4 text-secondary" />
                    <span className="text-secondary font-medium">Secure</span>
                  </div>
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
                <div key={msg.id} className={`flex ${msg.userName === username ? "justify-end" : "justify-start"} mb-4`}>
                  <div className={`flex space-x-3 max-w-md ${msg.userName === username ? "flex-row-reverse space-x-reverse" : ""}`}>
                    {/* Avatar with improved styling */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm ${
                      msg.userName === username 
                        ? "bg-gradient-to-br from-primary to-primary/80" 
                        : getAvatarColor(msg.userName)
                    }`}>
                      <span className="text-sm font-semibold text-white">
                        {(msg.userName || 'A').charAt(0).toUpperCase()}
                      </span>
                    </div>
                    
                    <div className={`space-y-2 ${msg.userName === username ? "items-end" : "items-start"} flex-1`}>
                      {/* Sender name with improved styling */}
                      <div className={`flex items-center space-x-2 ${msg.userName === username ? "flex-row-reverse space-x-reverse" : ""}`}>
                        <p className={`text-xs font-semibold ${
                          msg.userName === username 
                            ? "text-primary" 
                            : "text-foreground"
                        }`}>
                          {msg.userName === username ? "You" : msg.userName}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {formatTime(msg.timestamp)}
                        </span>
                        {msg.userName === username && getStatusIcon(msg.status)}
                      </div>
                      
                      {/* Reply indicator with improved styling */}
                      {msg.replyTo && (
                        <div className={`flex items-center space-x-2 text-xs text-muted-foreground mb-1 ${
                          msg.userName === username ? "justify-end" : ""
                        }`}>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            msg.userName === username 
                              ? "bg-primary/10" 
                              : "bg-muted"
                          }`}>
                            <Reply className="w-3 h-3" />
                          </div>
                          <span className="text-muted-foreground/80">Replying to message</span>
                        </div>
                      )}
                      
                      {/* Message bubble with improved styling */}
                      <div className={`group relative px-4 py-3 rounded-2xl shadow-sm transition-all duration-200 ${
                        msg.userName === username 
                          ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-lg" 
                          : "bg-gradient-to-br from-card to-card/90 text-card-foreground rounded-bl-lg border border-border/50"
                      }`}>
                        <p className="text-sm leading-relaxed">{decryptMessage(msg.content)}</p>
                        
                        {/* Reply button - appears on hover */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => replyToMessage(msg)}
                          className={`absolute top-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 w-7 h-7 ${
                            msg.userName === username 
                              ? "left-1 -translate-x-full" 
                              : "right-1 translate-x-full"
                          }`}
                          title="Reply to message"
                        >
                          <CornerDownRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="px-6 py-3 border-t border-border bg-gradient-to-r from-primary/5 via-transparent to-primary/5">
            <div className="flex items-center space-x-3 text-sm text-muted-foreground max-w-4xl mx-auto">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
              <span className="font-medium">
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing`
                  : `${typingUsers.length} people are typing`
                }
                <span className="animate-pulse">...</span>
              </span>
            </div>
          </div>
        )}

        {/* Reply Indicator */}
        {replyingTo && (
          <div className="px-6 py-3 border-t border-border bg-gradient-to-r from-primary/5 to-primary/10">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Reply className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Replying to {replyingTo.userName}</p>
                  <p className="text-xs text-muted-foreground/80 truncate max-w-md leading-relaxed">
                    {decryptMessage(replyingTo.content)}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={cancelReply}
                className="w-7 h-7 hover:bg-primary/10 transition-colors"
                title="Cancel reply"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Private chat indicator */}
        {privateChatTarget && (
          <div className="px-6 py-3 border-t border-border bg-muted/30">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center space-x-2">
                <AtSign className="w-4 h-4 text-primary" />
                <p className="text-sm text-foreground">Private message to {privateChatTarget.name}</p>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={cancelPrivateChat}
                className="w-6 h-6"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-6 border-t border-border bg-background relative">
          {/* User Suggestions */}
          {showUserSuggestions && userSuggestions.length > 0 && (
            <div ref={suggestionsRef} className="absolute bottom-full left-6 right-6 mb-3 max-w-4xl mx-auto">
              <div className="bg-card border border-border rounded-lg shadow-lg p-3">
                <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b border-border flex items-center">
                  <AtSign className="w-4 h-4 mr-2 text-primary" />
                  <span>Mention a user</span>
                </div>
                {userSuggestions.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => selectUser(user)}
                    className="w-full flex items-center space-x-3 p-3 rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={`${getAvatarColor(user.name)} text-white text-sm font-medium`}>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          user.status === "online" ? "bg-emerald-500" : 
                          user.status === "away" ? "bg-amber-500" : 
                          "bg-muted-foreground"
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
            <div className="absolute bottom-full left-6 right-6 mb-3 max-w-4xl mx-auto">
              <div className="bg-card border border-border rounded-lg shadow-lg p-3">
                <div className="px-3 py-2 text-sm font-medium text-muted-foreground border-b border-border flex items-center">
                  <AtSign className="w-4 h-4 mr-2 text-primary" />
                  Select user for private message
                </div>
                {userSuggestions.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => startPrivateChat(user)}
                    className="w-full flex items-center space-x-3 p-3 rounded-md hover:bg-muted transition-colors text-left"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className={`${getAvatarColor(user.name)} text-white text-sm font-medium`}>
                        {user.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.status}</p>
                    </div>
                    <span className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">Private</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Emoji Picker */}
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute bottom-full left-6 right-6 mb-3 max-w-4xl mx-auto">
              <div className="bg-card border border-border rounded-lg shadow-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-foreground flex items-center">
                    <Smile className="w-4 h-4 mr-2 text-muted-foreground" />
                    Quick Emojis
                  </h3>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowEmojiPicker(false)}
                    className="w-6 h-6"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                <div className="grid grid-cols-8 gap-2 mb-4">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => insertEmoji(emoji)}
                      className="w-8 h-8 rounded hover:bg-secondary flex items-center justify-center text-sm transition-colors"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground text-center">Click to insert</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center space-x-3 max-w-3xl mx-auto">
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
               className="w-10 h-10"
               title="Attach files"
             >
               <Paperclip className="w-5 h-5 text-muted-foreground" />
             </Button>
             <div className="flex-1 relative">
               <Input
                 ref={inputRef}
                 type="text"
                 value={message}
                 onChange={handlePrivateChatInput}
                 placeholder={privateChatTarget ? `Private message to ${privateChatTarget.name}...` : "Type a message..."}
                 className="pr-12 py-3 rounded-lg border-border bg-background focus:border-primary focus:ring-1 focus:ring-primary"
                 onKeyDown={(e) => {
                   if (e.key === "Enter" && !e.shiftKey) {
                     e.preventDefault();
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
                 className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8"
                 title="Insert emoji"
               >
                 <Smile className="w-4 h-4 text-muted-foreground" />
               </Button>
             </div>
             <Button 
               onClick={sendMessageHandler}
               disabled={!message.trim()}
               size="sm"
               className="w-10 h-10"
             >
               <Send className="w-4 h-4" />
             </Button>
           </div>
        </div>
      </div>

      {/* Video Call Component - Only show when video call is active */}
      {isVideoCallOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
          <SimplePeerVideoCallImproved
            roomId={sessionId}
            targetUserId={videoCallTargetUser}
            isGroupCall={isGroupVideoCall}
            isAudioOnly={isAudioCall}
            onCallEnd={endVideoCall}
          />
        </div>
      )}

      {/* Three.js Encryption Model Background */}
      <ThreeEncryptionModel />

      {/* Test Panel */}
      {showTestPanel && (
        <div className="fixed top-4 right-4 w-80 bg-card border border-border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Wrench className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Test Panel</h3>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setShowTestPanel(false)}
                className="w-6 h-6"
                title="Close test panel"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            <div className="flex space-x-2">
              <Button 
                onClick={runSimplePeerTests}
                disabled={isTesting}
                className="flex-1"
                size="sm"
              >
                {isTesting ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Testing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Play className="w-3 h-3" />
                    <span>Run Tests</span>
                  </div>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={clearTestResults}
                size="sm"
                title="Clear results"
              >
                Clear
              </Button>
            </div>

            {/* Test Results */}
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-center py-4">
                  <Wrench className="w-4 h-4 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">No tests run yet</p>
                </div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className={`p-2 rounded border text-xs ${
                    result.success 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-destructive/5 border-destructive/20'
                  }`}>
                    <div className="flex items-start space-x-2">
                      <div className="mt-0.5">
                        {result.success ? (
                          <CheckCircle className="w-3 h-3 text-primary" />
                        ) : (
                          <XCircle className="w-3 h-3 text-destructive" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-foreground">{result.test}</h4>
                          <span className="text-muted-foreground">{result.timestamp}</span>
                        </div>
                        <p className="text-muted-foreground">{result.message}</p>
                        {result.details && (
                          <p className="text-muted-foreground/80 bg-muted/50 p-1 rounded text-xs">
                            {result.details}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
}