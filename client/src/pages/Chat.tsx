import { useEffect, useState, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserCircle, Send, Phone, VideoIcon, MessageSquare, Image, X } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import UserList from "@/components/UserList";

type Message = {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  imageData?: string; // Optional base64 encoded image
  sentAt: string;
  status: "sent" | "delivered" | "read";
};

export default function Chat() {
  const { id: conversationId } = useParams();
  const [, navigate] = useLocation();
  const { user, onlineUsers } = useAuth();
  const [newMessage, setNewMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const [wsConnected, setWsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);
  
  // Set up WebSocket connection with reconnection logic
  useEffect(() => {
    if (!user) return; // Don't connect if user is not logged in
    
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    let socket: WebSocket | null = null;
    let reconnectAttempts = 0;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    
    // Function to create and setup a new WebSocket connection
    const connectWebSocket = () => {
      try {
        // Clear any existing reconnect timeout
        if (reconnectTimeout) {
          clearTimeout(reconnectTimeout);
          reconnectTimeout = null;
        }
        
        // Check if we already have a valid connection
        if (socket && socket.readyState === WebSocket.OPEN) {
          console.log("WebSocket already connected, reusing existing connection");
          return;
        }
        
        // Close any existing socket that might be in a bad state
        if (socket) {
          try {
            console.log("Closing existing WebSocket connection before creating a new one");
            socket.close(1000, "Creating new connection");
          } catch (err) {
            console.log("Error closing existing socket:", err);
          }
        }
        
        // Create new WebSocket with verbose logging
        console.log("Creating new WebSocket connection to:", wsUrl);
        socket = new WebSocket(wsUrl);
        
        socket.addEventListener("open", () => {
          console.log("Chat WebSocket connected successfully");
          setWsConnected(true);
          setWs(socket);
          reconnectAttempts = 0; // Reset reconnect attempts on successful connection
          
          // Register this WebSocket with the user ID
          if (socket && socket.readyState === WebSocket.OPEN && user) {
            console.log("Registering WebSocket with user ID:", user.id);
            socket.send(JSON.stringify({
              type: "register",
              userId: user.id
            }));
          } else {
            console.warn("Cannot register WebSocket - socket not ready or user not available");
          }
        });
        
        socket.addEventListener("message", (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log("WebSocket message received in Chat:", data);
            
            if (data.type === "chat_message") {
              console.log("Chat message received via WebSocket:", data.message);
              
              // Add the new message directly to the query cache for instant display
              if (data.message && conversationId) {
                queryClient.setQueryData(
                  [`/api/conversations/${conversationId}/messages`], 
                  (oldMessages: any[] = []) => {
                    if (!oldMessages) return [data.message];
                    
                    // Check if this message already exists in our list (by ID)
                    const messageExists = oldMessages.some(m => m.id === data.message.id);
                    
                    if (!messageExists) {
                      console.log("Adding new message to chat display:", data.message);
                      return [...oldMessages, data.message];
                    }
                    return oldMessages;
                  }
                );
                
                // Also update the conversations list to show the latest message
                queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
              }
            } else if (data.type === "online_status") {
              // This is handled by AuthContext
              console.log("Received online status update:", data.onlineUsers);
            }
          } catch (error) {
            console.error("Error parsing WebSocket message:", error);
          }
        });
        
        socket.addEventListener("close", (event) => {
          console.log(`Chat WebSocket connection closed (code: ${event.code}, reason: ${event.reason || "No reason provided"}), attempting to reconnect...`);
          setWsConnected(false);
          setWs(null);
          
          // Shorter exponential backoff for reconnection (max 15 seconds) with faster initial recovery
          const delay = Math.min(1000 * Math.pow(1.5, reconnectAttempts), 15000);
          reconnectAttempts++;
          
          // Schedule reconnection only if not already reconnecting
          if (!reconnectTimeout) {
            console.log(`Will attempt to reconnect in ${delay}ms (attempt #${reconnectAttempts})`);
            reconnectTimeout = setTimeout(() => {
              reconnectTimeout = null;
              if (user) { // Only reconnect if still logged in
                connectWebSocket();
              } else {
                console.log("Not reconnecting WebSocket because user is not logged in");
              }
            }, delay);
          }
        });
        
        socket.addEventListener("error", (error) => {
          console.error("Chat WebSocket error:", error);
          // The close event will fire after this, triggering reconnect
        });
      } catch (error) {
        console.error("Critical error setting up WebSocket connection:", error);
        // Schedule a quick retry
        if (!reconnectTimeout) {
          const delay = 2000; // Simple 2-second delay for error recovery
          reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            if (user) {
              connectWebSocket();
            }
          }, delay);
        }
      }
    };
    
    // Initial connection
    connectWebSocket();
    
    // Cleanup on unmount or when conversation changes
    return () => {
      if (socket) {
        socket.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      setWsConnected(false);
      setWs(null);
    };
  }, [conversationId, queryClient, user]);
  
  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<any[]>({ 
    queryKey: ['/api/conversations'],
  });

  // Fetch messages for current conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<any[]>({ 
    queryKey: [`/api/conversations/${conversationId}/messages`],
    enabled: !!conversationId,
  });
  
  // Fetch users
  const { data: users = [], isLoading: usersLoading } = useQuery<any[]>({ 
    queryKey: ['/api/users'],
  });
  
  // Handle file selection
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Only allow image files
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }
    
    // Convert image to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setSelectedImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Clear selected image
  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: {
      toUserId: number;
      content: string;
      imageData?: string;
    }) => {
      const response = await apiRequest('POST', '/api/messages', messageData);
      return response.json();
    },
    onSuccess: () => {
      // Clear input and refresh messages
      setNewMessage("");
      setSelectedImage(null);
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
    },
  });
  
  // Delete conversation mutation
  const deleteConversationMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await apiRequest('DELETE', `/api/conversations/${conversationId}`);
      return response.json();
    },
    onSuccess: () => {
      // Refresh conversations list and redirect to main chat view
      queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
      navigate('/chat');
    },
  });
  
  // Get current conversation
  const currentConversation = conversations?.find(
    (conv: any) => conv.id === parseInt(conversationId || "0")
  );
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Note: handleImageSelect and clearSelectedImage functions are already defined above

  // Handle message send
  const handleSendMessage = () => {
    if (!newMessage.trim() && !selectedImage) return;
    
    let recipientId;
    
    if (currentConversation) {
      // If in an existing conversation, get recipient ID from conversation
      recipientId = currentConversation.otherUser.id;
    } else if (conversationId === 'new' && users.length > 0) {
      // If in a new conversation view with a selected user (from URL query)
      const urlParams = new URLSearchParams(window.location.search);
      const selectedUserId = urlParams.get('userId');
      
      if (selectedUserId) {
        recipientId = parseInt(selectedUserId, 10);
      } else if (users.length > 0) {
        // Fallback to first user in the list if no ID in URL
        recipientId = users[0].id;
      } else {
        console.error("No recipient found");
        return;
      }
    } else {
      console.error("No recipient found");
      return;
    }
    
    // Create optimistic update message to add immediately to UI
    const optimisticMessage = {
      id: -Date.now(), // Temporary negative ID
      fromUserId: user?.id || 0,
      toUserId: recipientId,
      content: newMessage,
      imageData: selectedImage || null,
      sentAt: new Date().toISOString(),
      status: "sent" as const
    };
    
    // Add optimistic message to UI immediately
    queryClient.setQueryData([`/api/conversations/${conversationId}/messages`], (oldData: any) => {
      return [...(oldData || []), optimisticMessage];
    });
    
    // Create optimistic message to add immediately to UI
    console.log(`Sending message to recipient ${recipientId} via ${ws && wsConnected ? "WebSocket" : "REST API"}`);
    
    // Clear the input field immediately for better UX
    const msgContent = newMessage;
    const msgImage = selectedImage;
    setNewMessage("");
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Try WebSocket first for real-time delivery
    if (ws && wsConnected) {
      console.log("Sending message via WebSocket");
      try {
        // Send via WebSocket - the server will handle database storage
        ws.send(JSON.stringify({
          type: "chat_message",
          fromUserId: user?.id,
          toUserId: recipientId,
          content: msgContent,
          imageData: msgImage
        }));
        
        // Use REST API also to ensure message gets saved (backup)
        sendMessageMutation.mutate({
          toUserId: recipientId,
          content: msgContent,
          imageData: msgImage || undefined,
        }, {
          // Suppress default toast notifications since we're handling this through WebSocket
          onError: (error) => {
            console.error("Error sending message via REST API (backup):", error);
            // Don't show toast here since we're hoping WebSocket worked
          }
        });
      } catch (wsError) {
        console.error("Error sending message via WebSocket:", wsError);
        
        // Fallback to REST API if WebSocket fails
        sendMessageMutation.mutate({
          toUserId: recipientId,
          content: msgContent,
          imageData: msgImage || undefined,
        });
      }
    } else {
      // Fallback to REST API if WebSocket isn't available
      console.log("WebSocket not available, using REST API only");
      sendMessageMutation.mutate({
        toUserId: recipientId,
        content: msgContent,
        imageData: msgImage || undefined,
      });
    }
  };
  
  const handleUserSelect = async (selectedUser: any) => {
    // Find existing conversation or create new one
    const existing = conversations?.find(
      (conv: any) => conv.otherUser?.id === selectedUser.id
    );
    
    if (existing) {
      navigate(`/chat/${existing.id}`);
    } else {
      try {
        // Create a new conversation
        const response = await apiRequest('POST', '/api/connect', {
          userId: selectedUser.id,
        });
        
        const newConversation = await response.json();
        // Refresh conversations
        queryClient.invalidateQueries({ queryKey: ['/api/conversations'] });
        // Navigate to the new conversation
        navigate(`/chat/${newConversation.id}`);
      } catch (error) {
        console.error("Error creating conversation:", error);
      }
    }
  };
  
  // Handle conversation deletion
  const handleDeleteConversation = (e: React.MouseEvent, conversationId: number) => {
    e.stopPropagation(); // Prevent navigating to the conversation when clicking delete
    
    if (window.confirm("Are you sure you want to delete this entire conversation? This action cannot be undone.")) {
      deleteConversationMutation.mutate(conversationId);
    }
  };
  
  // Loading state
  if (conversationsLoading || usersLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        <div className="flex h-[calc(100vh-12rem)] animate-pulse bg-muted rounded-lg"></div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      
      <div className="flex h-[calc(100vh-12rem)] border rounded-lg overflow-hidden">
        {/* Contacts sidebar */}
        <div className="w-64 border-r bg-muted/30 flex flex-col">
          <div className="p-4 border-b">
            <h2 className="font-medium">Conversations</h2>
          </div>
          
          <ScrollArea className="flex-1">
            {conversations && conversations.length > 0 ? (
              <div className="space-y-1 p-2">
                {conversations.map((conversation: any) => (
                  <div 
                    key={conversation.id}
                    className={`flex items-center p-2 rounded-md cursor-pointer group relative ${
                      parseInt(conversationId || "0") === conversation.id
                        ? "bg-primary/10"
                        : conversation.unreadCount > 0 ? "bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100/80 dark:hover:bg-blue-900/30" : "hover:bg-muted"
                    }`}
                    onClick={() => navigate(`/chat/${conversation.id}`)}
                  >
                    <div className="relative">
                      {conversation.otherUser.profilePicture ? (
                        <img
                          src={conversation.otherUser.profilePicture}
                          alt={conversation.otherUser.fullName}
                          className="h-10 w-10 rounded-full object-cover mr-3"
                        />
                      ) : (
                        <UserCircle className="h-10 w-10 text-muted-foreground mr-3" />
                      )}
                      
                      {/* Online/Offline status indicator */}
                      {onlineUsers.includes(conversation.otherUser.id) ? (
                        <span className="absolute bottom-0 right-2 w-3 h-3 rounded-full bg-green-500 border-2 border-white" 
                              title="Online"></span>
                      ) : (
                        <span className="absolute bottom-0 right-2 w-3 h-3 rounded-full bg-orange-500 border-2 border-white" 
                              title="Offline"></span>
                      )}
                      
                      {/* Unread message badge */}
                      {conversation.unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <p className={`text-sm ${conversation.unreadCount > 0 ? "font-bold" : "font-medium"}`}>
                          {conversation.otherUser.fullName}
                        </p>
                        {conversation.unreadCount > 0 && (
                          <div className="h-2 w-2 bg-blue-500 rounded-full mr-1"></div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {conversation.lastMessage ? (
                          <span className="truncate inline-block max-w-[150px]">
                            {conversation.lastMessage.content.substring(0, 20)}
                            {conversation.lastMessage.content.length > 20 ? "..." : ""}
                          </span>
                        ) : (
                          <span>Start a conversation</span>
                        )}
                      </p>
                    </div>
                    
                    {/* Delete button - shows on hover */}
                    <button 
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 hover:bg-red-200 dark:bg-red-900/20 dark:hover:bg-red-800/30 text-red-600 dark:text-red-400 rounded p-1"
                      onClick={(e) => handleDeleteConversation(e, conversation.id)}
                      aria-label="Delete conversation"
                      title="Delete this conversation"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-muted-foreground">
                No conversations yet
              </div>
            )}
          </ScrollArea>
          
          <div className="p-4 border-t flex flex-col gap-4">
            <Button
              onClick={() => {
                if (users.length > 0) {
                  handleUserSelect(users[0]);
                }
              }}
              className="w-full bg-primary hover:bg-primary/90"
              disabled={users.length === 0}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Start New Conversation
            </Button>
            <UserList users={users} onUserSelect={handleUserSelect} />
          </div>
        </div>
        
        {/* Chat area */}
        {conversationId ? (
          <div className="flex-1 flex flex-col">
            {/* Chat header */}
            <div className="p-4 border-b flex justify-between items-center bg-white">
              {currentConversation ? (
                <div className="flex items-center">
                  <div className="relative">
                    {currentConversation.otherUser.profilePicture ? (
                      <img
                        src={currentConversation.otherUser.profilePicture}
                        alt={currentConversation.otherUser.fullName}
                        className="h-10 w-10 rounded-full object-cover mr-3"
                      />
                    ) : (
                      <UserCircle className="h-10 w-10 text-muted-foreground mr-3" />
                    )}
                    {/* Online/Offline status indicator */}
                    {onlineUsers.includes(currentConversation.otherUser.id) ? (
                      <span className="absolute bottom-0 right-2 w-3 h-3 rounded-full bg-green-500 border-2 border-white" 
                            title="Online"></span>
                    ) : (
                      <span className="absolute bottom-0 right-2 w-3 h-3 rounded-full bg-orange-500 border-2 border-white" 
                            title="Offline"></span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center">
                      <p className="font-medium">
                        {currentConversation.otherUser.fullName}
                      </p>
                      <span className={`ml-2 text-xs py-0.5 px-1.5 rounded ${
                        onlineUsers.includes(currentConversation.otherUser.id) 
                          ? 'bg-green-500' 
                          : 'bg-orange-500'
                      } text-white font-medium`}>
                        {onlineUsers.includes(currentConversation.otherUser.id) ? 'Online' : 'Offline'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {currentConversation.otherUser.role === "doctor" 
                        ? currentConversation.otherUser.specialization 
                        : "Patient"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="h-6 animate-pulse bg-muted rounded w-1/4"></div>
              )}
              
              <div className="flex space-x-2">
                <Button size="icon" variant="ghost" disabled>
                  <Phone className="h-5 w-5" />
                </Button>
                <Button size="icon" variant="ghost" disabled>
                  <VideoIcon className="h-5 w-5" />
                </Button>
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {messagesLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-md p-3 rounded-lg ${i % 2 === 0 ? 'bg-primary/10' : 'bg-muted'}`}>
                        <div className="h-4 bg-gray-200 rounded w-full"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : messages && messages.length > 0 ? (
                <div className="space-y-4">
                  {messages.map((message: Message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      isOwnMessage={message.fromUserId === user?.id}
                      conversationId={conversationId || "new"}
                    />
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p className="mb-2">No messages yet</p>
                    <p className="text-sm">Start the conversation by sending a message</p>
                  </div>
                </div>
              )}
            </ScrollArea>
            
            {/* Message input */}
            <div className="px-3 pt-2 border-t">
              {/* Image preview if selected */}
              {selectedImage && (
                <div className="mb-2 relative bg-gray-100 p-2 rounded-md">
                  <div className="flex justify-between items-start">
                    <img src={selectedImage} alt="Selected" className="h-20 object-contain" />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={clearSelectedImage}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="flex mb-3">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="mr-2"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                
                {/* Hidden file input */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*" 
                  style={{ display: 'none' }}
                />
                
                {/* Image upload button */}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="mr-2"
                >
                  <Image className="h-5 w-5" />
                </Button>
                
                {/* Send button */}
                <Button 
                  type="submit"
                  onClick={handleSendMessage}
                  disabled={(!newMessage.trim() && !selectedImage) || sendMessageMutation.isPending}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 h-10"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-muted/20">
            <div className="text-center max-w-md p-6">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-xl font-medium mb-2">No conversation selected</h2>
              <p className="text-muted-foreground mb-4">
                Select a conversation from the sidebar or start a new one by selecting a user.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
