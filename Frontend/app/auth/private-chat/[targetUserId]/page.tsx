"use client"

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { UserMenu } from "@/components/user-menu";
import JitsiVideoCall from "@/components/jitsi-video-call";
import { 
  Shield, Phone, Video, Search, Users, MoreVertical, Reply, X, AtSign, 
  Smile, Send, Paperclip, Settings, UserPlus, MessageCircle, Lock 
} from "lucide-react";
import { io, Socket } from "socket.io-client";
import CryptoJS from "crypto-js";
import { format } from "date-fns";

interface Message {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  timestamp: Date;
  encrypted: boolean;
  status: "sending" | "sent" | "delivered" | "read";
  reactions?: { emoji: string; users: string[] }[];
  replyTo?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
}

interface User {
  id: string;
  name: string;
  avatar?: string;
  status: "online" | "away" | "offline";
  isTyping?: boolean;
}

const commonEmojis = ["😀", "😂", "😍", "🥰", "😎", "🤔", "😢", "😡", "👍", "👎", "❤️", "🔥", "🎉", "💯", "✅"];

export default function PrivateChatPage() {
  const router = useRouter();
  const params = useParams();
  const targetUserId = params.targetUserId as string;
  
  const [username, setUsername] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState<string>("");
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isVideoCallOpen, setIsVideoCallOpen] = useState(false);
  const [isAudioCall, setIsAudioCall] = useState(false);
  const [videoCallTargetUser, setVideoCallTargetUser] = useState<string>("");
  const [isGroupVideoCall, setIsGroupVideoCall] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  // Generate encryption key based on usernames (sorted to ensure same key for both users)
  const generateEncryptionKey = useCallback(() => {
    const sortedUsernames = [username, targetUserId].sort().join(':');
    return CryptoJS.SHA256(sortedUsernames).toString();
  }, [username, targetUserId]);

  // Encrypt message
  const encryptMessage = (message: string): string => {
    const key = generateEncryptionKey();
    return CryptoJS.AES.encrypt(message, key).toString();
  };

  // Decrypt message
  const decryptMessage = (encryptedMessage: string): string => {
    try {
      const key = generateEncryptionKey();
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, key);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error("Decryption failed:", error);
      return "[Encrypted message]";
    }
  };

  // Get current user from session storage
  useEffect(() => {
    const storedUsername = sessionStorage.getItem("username");
    if (storedUsername) {
      setUsername(storedUsername);
      setCurrentUser({
        id: storedUsername,
        name: storedUsername,
        status: "online"
      });
    } else {
      router.push("/auth/login");
    }
  }, [router]);

  // Get target user info (mock data for now)
  useEffect(() => {
    if (targetUserId) {
      setTargetUser({
        id: targetUserId,
        name: targetUserId,
        status: "online"
      });
    }
  }, [targetUserId]);

  // Handle video call
  const startVideoCall = () => {
    if (socket && targetUser) {
      socket.emit("videoCallRequest", {
        targetUserId: targetUser.id,
        callerName: username
      });
      setIsAudioCall(false);
      setIsVideoCallOpen(true);
    }
  };

  // Handle audio call
  const startAudioCall = () => {
    if (socket && targetUser) {
      socket.emit("audioCallRequest", {
        targetUserId: targetUser.id,
        callerName: username
      });
      setIsAudioCall(true);
      setIsVideoCallOpen(true);
    }
  };

  // End video call
  const endVideoCall = () => {
    setIsVideoCallOpen(false);
    setIsAudioCall(false);
  };

  // Initialize socket connection
  useEffect(() => {
    if (!username || !targetUserId) return;

    const newSocket = io("http://localhost:3001", {
      transports: ["websocket"],
      upgrade: false,
      forceNew: true,
    });

    newSocket.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
      setIsConnecting(false);
      newSocket.emit("joinPrivateChat", { 
        userId: username, 
        targetUserId: targetUserId 
      });
    });

    newSocket.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
    });

    newSocket.on("privateMessage", (data: Message) => {
      setMessages((prev) => [...prev, data]);
    });

    newSocket.on("userTyping", ({ username: typingUser, isTyping: typing }: { username: string; isTyping: boolean }) => {
      setTypingUsers((prev) => {
        if (typing) {
          return prev.includes(typingUser) ? prev : [...prev, typingUser];
        } else {
          return prev.filter((id) => id !== typingUser);
        }
      });
    });

    // Video call event handlers for private chat
    newSocket.on("videoCallRequest", ({ fromUser, fromUserId, sessionId: callSessionId }) => {
      console.log("Received video call request from:", fromUser);
      // For private chat, we don't need to check sessionId since it's a direct call
      setVideoCallTargetUser(fromUserId);
      setIsGroupVideoCall(false);
      setIsVideoCallOpen(true);
      setIsAudioCall(false);
    });

    newSocket.on("audioCallRequest", ({ fromUser, fromUserId, sessionId: callSessionId }) => {
      console.log("Received audio call request from:", fromUser);
      // For private chat, we don't need to check sessionId since it's a direct call
      setVideoCallTargetUser(fromUserId);
      setIsGroupVideoCall(false);
      setIsVideoCallOpen(true);
      setIsAudioCall(true);
    });

    newSocket.on("videoCallEnd", ({ fromUser }) => {
      console.log("Video call ended by:", fromUser);
      endVideoCall();
    });

    newSocket.on("audioCallEnd", ({ fromUser }) => {
      console.log("Audio call ended by:", fromUser);
      endVideoCall();
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [username, targetUserId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle typing indicator
  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setMessage(value);

    if (!isTyping && value.trim()) {
      setIsTyping(true);
      socket?.emit("typingStartPrivate", { 
        userId: username, 
        targetUserId: targetUserId 
      });
    }

    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const timeout = setTimeout(() => {
      setIsTyping(false);
      socket?.emit("typingStopPrivate", { 
        userId: username, 
        targetUserId: targetUserId 
      });
    }, 1000);

    setTypingTimeout(timeout);
  };

  // Send message
  const sendMessageHandler = () => {
    if (!message.trim() || !socket) return;

    // Stop typing indicator
    setIsTyping(false);
    socket.emit("typingStop", { 
      userId: username, 
      targetUserId: targetUserId 
    });

    const newMessage: Message = {
      id: Date.now().toString(),
      userId: username,
      userName: username,
      content: encryptMessage(message),
      timestamp: new Date(),
      encrypted: true,
      status: "sent",
      replyTo: replyingTo?.id
    };

    socket.emit("sendPrivateMessage", {
      senderId: username,
      receiverId: targetUserId,
      message: newMessage
    });

    setMessages((prev) => [...prev, newMessage]);
    setMessage("");
    setReplyingTo(null);
  };

  // Insert emoji
  const insertEmoji = (emoji: string) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newValue = message.substring(0, start) + emoji + message.substring(end);
    setMessage(newValue);
    
    setTimeout(() => {
      input.focus();
      input.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);
    
    setShowEmojiPicker(false);
  };

  // Reply to message
  const replyToMessage = (msg: Message) => {
    setReplyingTo(msg);
    inputRef.current?.focus();
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Format time
  const formatTime = (date: Date) => {
    return format(new Date(date), "HH:mm");
  };

  // Get avatar color
  const getAvatarColor = (name: string) => {
    const colors = [
      "bg-gradient-to-br from-blue-500 to-cyan-600",
      "bg-gradient-to-br from-purple-500 to-pink-600",
      "bg-gradient-to-br from-green-500 to-teal-600",
      "bg-gradient-to-br from-yellow-500 to-orange-600",
      "bg-gradient-to-br from-red-500 to-pink-600",
      "bg-gradient-to-br from-indigo-500 to-purple-600"
    ];
    return colors[name.charCodeAt(0) % colors.length];
  };

  // Handle click outside emoji picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (isConnecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-blue-900 dark:to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center animate-pulse">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-medium text-foreground mb-2">Connecting to Private Chat</h2>
          <p className="text-muted-foreground">Establishing secure connection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 dark:from-slate-900 dark:via-blue-900 dark:to-cyan-900">
      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl border-b border-slate-200/50 dark:border-slate-700/30">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/auth/dashboard")}
                className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <MessageCircle className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </Button>
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className={`${getAvatarColor(targetUserId)} text-white font-medium`}>
                    {targetUserId.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-lg font-medium text-foreground">{targetUserId}</h1>
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${
                      targetUser?.status === "online" ? "bg-blue-500" : 
                      targetUser?.status === "away" ? "bg-amber-500" : "bg-slate-400"
                    }`}></div>
                    <span className="text-sm text-muted-foreground capitalize">
                      {targetUser?.status || "offline"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={startAudioCall}
                className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Phone className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={startVideoCall}
                className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Video className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </Button>
              <UserMenu />
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col h-screen">
        <ScrollArea className="flex-1 p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-blue-100 via-cyan-100 to-teal-100 dark:from-blue-900/30 dark:via-cyan-900/30 dark:to-teal-900/30 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/10">
                  <Lock className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-2xl font-medium text-foreground tracking-tight mb-3">Private Chat</h3>
                <p className="text-muted-foreground max-w-md mx-auto font-light leading-relaxed">
                  This is your private conversation with {targetUserId}. Messages are encrypted end-to-end.
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.userName === username ? "justify-end" : "justify-start"}`}>
                  <div className={`flex space-x-4 max-w-2xl ${msg.userName === username ? "flex-row-reverse space-x-reverse" : ""}`}>
                    {msg.userName !== username && (
                      <Avatar className="w-10 h-10 mt-1">
                        <AvatarFallback className={`${getAvatarColor(msg.userName)} text-white font-medium`}>
                          {msg.userName.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`group relative ${msg.userName === username ? "items-end" : "items-start"}`}>
                      <div className={`px-6 py-4 rounded-3xl shadow-sm backdrop-blur-sm ${
                        msg.userName === username 
                          ? "bg-gradient-to-br from-blue-400 via-cyan-500 to-teal-500 text-white shadow-2xl shadow-blue-500/20" 
                          : "bg-white/80 dark:bg-slate-800/80 border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl"
                      }`}>
                        {msg.userName !== username && (
                          <p className="text-sm font-semibold text-foreground mb-2">{msg.userName}</p>
                        )}
                        
                        {/* Reply Indicator */}
                        {msg.replyTo && (
                          <div className={`mb-2 p-2 rounded-xl border-l-4 ${
                            msg.userName === username 
                              ? "bg-white/20 border-white/40" 
                              : "bg-slate-100/50 dark:bg-slate-700/50 border-blue-400"
                          }`}>
                            <div className="flex items-center space-x-2 text-xs">
                              <Reply className="w-3 h-3" />
                              <span className="font-medium">Reply</span>
                            </div>
                            <p className="text-xs mt-1 opacity-80 truncate">
                              {(() => {
                                const repliedMessage = messages.find(m => m.id === msg.replyTo);
                                return repliedMessage ? decryptMessage(repliedMessage.content) : "Original message not found";
                              })()}
                            </p>
                          </div>
                        )}
                        
                        <p className="text-base leading-relaxed font-light">{decryptMessage(msg.content)}</p>
                        <div className="flex items-center justify-between mt-3 space-x-3">
                          <span className="text-xs opacity-80 font-light">{formatTime(msg.timestamp)}</span>
                          {msg.userName === username && (
                            <div className="flex items-center space-x-1">
                              {msg.status === "sent" && <div className="w-2 h-2 bg-white/60 rounded-full"></div>}
                              {msg.status === "delivered" && <div className="w-2 h-2 bg-white/80 rounded-full"></div>}
                              {msg.status === "read" && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Message Actions */}
                      <div className="absolute -top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => replyToMessage(msg)}
                            className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700"
                          >
                            <Reply className="w-4 h-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg hover:bg-slate-100 dark:hover:bg-slate-700">
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

        {/* Typing Indicator */}
        {typingUsers.length > 0 && (
          <div className="px-8 py-3 border-t border-slate-200/50 dark:border-slate-700/30">
            <div className="flex items-center space-x-3 text-sm text-muted-foreground font-light">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: "0.1s"}}></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></div>
              </div>
              <span className="font-medium">
                {typingUsers.length === 1 
                  ? `${typingUsers[0]} is typing...`
                  : `${typingUsers.length} people are typing...`
                }
              </span>
            </div>
          </div>
        )}

        {/* Reply Indicator */}
        {replyingTo && (
          <div className="px-8 py-3 border-t border-slate-200/50 dark:border-slate-700/30 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl">
            <div className="flex items-center justify-between max-w-4xl mx-auto">
              <div className="flex items-center space-x-3">
                <Reply className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm font-medium text-foreground">Replying to {replyingTo.userName}</p>
                  <p className="text-xs text-muted-foreground font-light truncate max-w-md">{decryptMessage(replyingTo.content)}</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={cancelReply}
                className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 w-8 h-8"
              >
                <X className="w-4 h-4 text-slate-600 dark:text-slate-300" />
              </Button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-8 border-t border-slate-200/50 dark:border-slate-700/30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-2xl relative">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Smile className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </Button>
              
              <div className="flex-1 relative">
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Type your private message..."
                  value={message}
                  onChange={handleMessageChange}
                  onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessageHandler()}
                  className="pr-16 py-4 rounded-3xl border-slate-200/50 dark:border-slate-600/50 bg-white/50 dark:bg-slate-700/50 backdrop-blur-sm focus:border-blue-400 focus:ring-blue-400/20 text-base font-light placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={sendMessageHandler}
                  disabled={!message.trim()}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/30 disabled:opacity-50"
                >
                  <Send className="w-5 h-5 text-blue-500" />
                </Button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Paperclip className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </Button>
            </div>

            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-full left-0 right-0 mb-4 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 backdrop-blur-xl p-4">
                <div className="grid grid-cols-5 gap-2">
                  {commonEmojis.map((emoji, index) => (
                    <Button
                      key={index}
                      variant="ghost"
                      size="icon"
                      onClick={() => insertEmoji(emoji)}
                      className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-lg"
                    >
                      {emoji}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Video Call Component */}
      <JitsiVideoCall
        isOpen={isVideoCallOpen}
        onClose={endVideoCall}
        sessionId={`private-${[username, targetUserId].sort().join('-')}`}
        username={username}
        targetUserId={targetUserId}
        isGroupCall={false}
        isAudioOnly={isAudioCall}
      />
    </div>
  );
}