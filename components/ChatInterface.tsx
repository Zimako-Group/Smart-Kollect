// components/ChatInterface.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MessageSquare,
  Send,
  Paperclip,
  Smile,
  User,
  Users,
  Clock,
  Search,
  ChevronDown,
  MoreVertical,
  Check,
  CheckCheck,
  X,
  Phone,
  Video,
  Info,
  Image,
  File,
  Mic,
  Play,
  Download,
} from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRedux } from "@/hooks/useRedux";
import { openDialog, closeDialog, sendMessage, setActiveConversation } from "@/lib/redux/features/chat/chatSlice";
import { format, formatDistance } from "date-fns";
import { useAppSelector } from "@/lib/redux/store";
import { RootState } from "@/lib/redux/store";

// Mock data for agents
const mockAgents = [
  {
    id: "agent-1",
    name: "Sarah Johnson",
    avatar: "https://i.pravatar.cc/150?img=1",
    role: "Senior Collection Agent",
    status: "online",
  },
  {
    id: "agent-2",
    name: "Michael Chen",
    avatar: "https://i.pravatar.cc/150?img=2",
    role: "Collection Manager",
    status: "online",
  },
  {
    id: "agent-3",
    name: "Aisha Patel",
    avatar: "https://i.pravatar.cc/150?img=3",
    role: "Collection Agent",
    status: "away",
    lastActive: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
  },
  {
    id: "agent-4",
    name: "Carlos Rodriguez",
    avatar: "https://i.pravatar.cc/150?img=4",
    role: "Legal Advisor",
    status: "offline",
    lastActive: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
  },
  {
    id: "agent-5",
    name: "Emma Wilson",
    avatar: "https://i.pravatar.cc/150?img=5",
    role: "Collection Agent",
    status: "online",
  },
];

// Mock user profile for the current user
const userProfile = {
  id: "current-user",
  name: "Alex Rivera",
  avatar: "https://i.pravatar.cc/150?img=5",
  role: "Collection Agent",
  status: "online",
};

// Helper functions for message formatting
const formatDate = (timestamp: Date) => {
  const today = new Date();
  const messageDate = new Date(timestamp);
  
  if (messageDate.toDateString() === today.toDateString()) {
    return "Today";
  } else if (
    messageDate.toDateString() ===
    new Date(today.setDate(today.getDate() - 1)).toDateString()
  ) {
    return "Yesterday";
  } else {
    return format(messageDate, "MMMM d, yyyy");
  }
};

const formatTime = (timestamp: Date) => {
  return format(new Date(timestamp), "h:mm a");
};

// Helper function for message status icons
const getStatusIcon = (status: string) => {
  switch (status) {
    case "sent":
      return <Check className="h-3 w-3 text-slate-400" />;
    case "delivered":
      return <CheckCheck className="h-3 w-3 text-slate-400" />;
    case "read":
      return <CheckCheck className="h-3 w-3 text-indigo-400" />;
    default:
      return null;
  }
};

export default function ChatInterface() {
  // Use direct state access instead of selector functions to avoid hooks issues
  const { dispatch } = useRedux();
  const chatState = useAppSelector((state: RootState) => state.chat);
  const selectedAccount = chatState.selectedAccount;
  const messages = chatState.messages;
  const activeConversation = chatState.activeConversation;
  
  // Local state
  const [newMessage, setNewMessage] = useState("");
  const [agents, setAgents] = useState(mockAgents);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  // Send message function
  const handleSendMessage = () => {
    if (newMessage.trim()) {
      dispatch(
        sendMessage({
          content: newMessage.trim(),
          sender: {
            id: userProfile.id,
            name: userProfile.name,
            avatar: userProfile.avatar,
            role: userProfile.role
          }
        })
      );
      setNewMessage("");
    }
  };
  
  // Handle Enter key to send message
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Get color for agent status
  const getAgentStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "bg-green-500";
      case "away":
        return "bg-amber-500";
      case "offline":
        return "bg-slate-500";
      default:
        return "bg-slate-500";
    }
  };
  
  // Filter agents by search query
  const filteredAgents = agents.filter((agent) =>
    agent.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Group messages by date
  const groupedMessages: Record<string, any[]> = {};
  
  messages.forEach((message) => {
    const date = new Date(message.timestamp);
    const dateStr = date.toDateString();
    
    if (!groupedMessages[dateStr]) {
      groupedMessages[dateStr] = [];
    }
    
    groupedMessages[dateStr].push(message);
  });
  
  return (
    <Dialog open={chatState.isDialogOpen} onOpenChange={(open) => !open && dispatch(closeDialog())}>
      <DialogContent className="sm:max-w-4xl bg-slate-900 border-slate-800 text-slate-100 p-0 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-64 border-r border-slate-800 flex flex-col">
            <div className="p-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-200">
                  Team Chat
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0 text-slate-400 hover:text-slate-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search agents..."
                  className="pl-8 h-8 bg-slate-800/50 border-slate-700 text-slate-200 text-xs"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <Tabs
              defaultValue="agents"
              className="flex-1 flex flex-col min-h-0"
            >
              <div className="px-2 pt-2 border-b border-slate-800">
                <TabsList className="bg-slate-800/50 h-8 p-1">
                  <TabsTrigger
                    value="agents"
                    className="text-xs h-6 px-2 data-[state=active]:bg-indigo-600/20 data-[state=active]:text-indigo-100"
                  >
                    Agents
                  </TabsTrigger>
                  <TabsTrigger
                    value="groups"
                    className="text-xs h-6 px-2 data-[state=active]:bg-indigo-600/20 data-[state=active]:text-indigo-100"
                  >
                    Groups
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="agents" className="flex-1 p-0 m-0 min-h-0">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    {filteredAgents.map((agent) => (
                      <div
                        key={agent.id}
                        className={`flex items-center gap-2 p-2 rounded-md hover:bg-slate-800/50 cursor-pointer transition-colors ${
                          activeConversation === agent.id ? "bg-slate-800/70" : ""
                        }`}
                        onClick={() => dispatch(setActiveConversation(agent.id))}
                      >
                        <div className="relative">
                          <Avatar className="h-8 w-8 border border-slate-700">
                            {agent.avatar ? (
                              <AvatarImage
                                src={agent.avatar}
                                alt={agent.name}
                              />
                            ) : (
                              <AvatarFallback className="bg-indigo-600/20 text-indigo-200">
                                {agent.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <span
                            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-slate-900 ${getAgentStatusColor(
                              agent.status
                            )}`}
                          ></span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-200 truncate">
                            {agent.name}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            {agent.role}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="groups" className="flex-1 p-0 m-0 min-h-0">
                <ScrollArea className="h-full">
                  <div className="p-2 space-y-1">
                    <div 
                      className={`flex items-center gap-2 p-2 rounded-md hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        activeConversation === 'team' ? "bg-slate-800/70" : ""
                      }`}
                      onClick={() => dispatch(setActiveConversation('team'))}
                    >
                      <div className="h-8 w-8 rounded-md bg-indigo-600/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-indigo-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          Collection Team
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          5 members
                        </p>
                      </div>
                    </div>
                    <div 
                      className={`flex items-center gap-2 p-2 rounded-md hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        activeConversation === 'legal' ? "bg-slate-800/70" : ""
                      }`}
                      onClick={() => dispatch(setActiveConversation('legal'))}
                    >
                      <div className="h-8 w-8 rounded-md bg-purple-600/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          Legal Team
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          3 members
                        </p>
                      </div>
                    </div>
                    <div 
                      className={`flex items-center gap-2 p-2 rounded-md hover:bg-slate-800/50 cursor-pointer transition-colors ${
                        activeConversation === 'management' ? "bg-slate-800/70" : ""
                      }`}
                      onClick={() => dispatch(setActiveConversation('management'))}
                    >
                      <div className="h-8 w-8 rounded-md bg-emerald-600/20 flex items-center justify-center">
                        <Users className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          Management
                        </p>
                        <p className="text-xs text-slate-400 truncate">
                          2 members
                        </p>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Chat Header */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/90 backdrop-blur-sm flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-indigo-600/20 rounded-full p-2 mr-3">
                  <MessageSquare className="h-5 w-5 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center">
                    {selectedAccount?.name || "No account selected"}
                    {selectedAccount?.accountNumber && (
                      <Badge className="ml-2 bg-indigo-600/20 text-indigo-200 hover:bg-indigo-600/30 px-1.5 py-0 h-5 text-[10px]">
                        {selectedAccount.accountNumber}
                      </Badge>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {activeConversation === 'team' 
                      ? 'Collection Team • 5 agents' 
                      : activeConversation === 'legal' 
                        ? 'Legal Team • 3 agents' 
                        : activeConversation === 'management' 
                          ? 'Management • 2 agents' 
                          : 'Private conversation'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Call</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                      >
                        <Video className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Video call</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                      >
                        <Info className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Info</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-slate-800 border-slate-700 text-slate-200">
                    <DropdownMenuItem className="text-xs cursor-pointer hover:bg-slate-700 focus:bg-slate-700">
                      Search in conversation
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs cursor-pointer hover:bg-slate-700 focus:bg-slate-700">
                      Add members
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-700" />
                    <DropdownMenuItem className="text-xs cursor-pointer text-red-400 hover:bg-slate-700 focus:bg-slate-700 hover:text-red-400">
                      Leave conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4 bg-slate-900">
              <div className="space-y-6">
                {Object.entries(groupedMessages).map(([dateStr, msgs]) => (
                  <div key={dateStr} className="space-y-3">
                    <div className="flex items-center justify-center">
                      <div className="bg-slate-800/50 rounded-full px-3 py-1">
                        <span className="text-xs text-slate-400">
                          {formatDate(new Date(msgs[0].timestamp))}
                        </span>
                      </div>
                    </div>

                    {msgs.map((message, index) => {
                      const isCurrentUser = message.sender.id === userProfile.id;
                      const showAvatar = index === 0 || msgs[index - 1].sender.id !== message.sender.id;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`flex ${isCurrentUser ? "flex-row-reverse" : "flex-row"} max-w-[80%] gap-2`}
                          >
                            {showAvatar ? (
                              <Avatar className={`h-8 w-8 border border-slate-700 ${isCurrentUser ? "ml-2" : "mr-2"}`}>
                                {message.sender.avatar ? (
                                  <AvatarImage src={message.sender.avatar} alt={message.sender.name} />
                                ) : (
                                  <AvatarFallback className="bg-indigo-600/20 text-indigo-200">
                                    {message.sender.name.split(" ").map((n: string) => n[0]).join("")}
                                  </AvatarFallback>
                                )}
                              </Avatar>
                            ) : (
                              <div className="w-8" />
                            )}

                            <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
                              {showAvatar && (
                                <span className="text-xs text-slate-400 mb-1">
                                  {message.sender.name}
                                </span>
                              )}

                              <div
                                className={`rounded-lg p-3 ${
                                  isCurrentUser
                                    ? "bg-indigo-600/20 text-indigo-50"
                                    : "bg-slate-800 text-slate-200"
                                }`}
                              >
                                <div className="whitespace-pre-wrap text-sm">
                                  {message.content}
                                </div>

                                <div className={`flex items-center mt-1 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                                  <span className="text-xs text-slate-400 mr-1">
                                    {formatTime(new Date(message.timestamp))}
                                  </span>
                                  {isCurrentUser && getStatusIcon(message.status)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-3 border-t border-slate-800 bg-slate-900/90 backdrop-blur-sm">
              <div className="flex items-end gap-2">
                <div className="flex-1 relative">
                  <Textarea
                    placeholder="Type a message..."
                    className="min-h-[60px] max-h-[150px] bg-slate-800/50 border-slate-700 text-slate-200 resize-none pr-10 py-2.5"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                  />
                  <div className="absolute right-2 bottom-2.5 flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-100 rounded-full"
                          >
                            <Paperclip className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">Attach file</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-slate-400 hover:text-slate-100 rounded-full"
                          >
                            <Smile className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                          <p className="text-xs">Emoji</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <Button
                  className="bg-indigo-600 hover:bg-indigo-700 text-white h-10 w-10 p-0 rounded-full"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}