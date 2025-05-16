import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Pencil, Trash2, Check, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  fromUserId: number;
  toUserId: number;
  content: string;
  imageData?: string;
  sentAt: string;
  status: "sent" | "delivered" | "read";
}

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
  conversationId: string | number;
}

export default function ChatMessage({ message, isOwnMessage, conversationId }: ChatMessageProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [showActions, setShowActions] = useState(false);
  
  // Update message mutation
  const updateMessageMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const response = await apiRequest('PATCH', `/api/messages/${message.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });
      setIsEditing(false);
      toast({
        title: "Message updated",
        description: "Your message has been updated successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update the message. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('DELETE', `/api/messages/${message.id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/conversations/${conversationId}/messages`] });
      toast({
        title: "Message deleted",
        description: "Your message has been deleted successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete the message. Please try again.",
        variant: "destructive"
      });
    }
  });
  
  const handleSaveEdit = () => {
    if (editedContent.trim() === "") return;
    updateMessageMutation.mutate({ content: editedContent });
  };
  
  const handleDelete = () => {
    deleteMessageMutation.mutate();
  };
  
  return (
    <div 
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} mb-4`}
      onMouseEnter={() => isOwnMessage && setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isOwnMessage && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2">
          <span className="text-primary text-xs font-bold">
            {user?.role === "doctor" ? "P" : "D"}
          </span>
        </div>
      )}
      <div
        className={`relative max-w-md px-4 py-2 rounded-lg ${
          isOwnMessage
            ? "bg-primary text-primary-foreground"
            : "bg-gray-100 dark:bg-gray-800"
        }`}
      >
        {/* Message text */}
        {isEditing ? (
          <div>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full bg-transparent border border-primary-foreground/30 rounded p-1 mb-2 text-sm"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <button 
                onClick={() => setIsEditing(false)} 
                className="p-1 hover:bg-gray-700 rounded-sm"
                title="Cancel"
              >
                <X className="h-4 w-4 text-primary-foreground" />
              </button>
              <button 
                onClick={handleSaveEdit} 
                className="p-1 hover:bg-gray-700 rounded-sm"
                title="Save"
              >
                <Check className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>
          </div>
        ) : (
          <div className="break-words relative">
            {message.content}
            
            {/* Message editing controls inside the message */}
            {isOwnMessage && showActions && (
              <div className="absolute top-0 right-0 flex space-x-1 bg-white dark:bg-gray-700 p-1 rounded-sm shadow-sm">
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-sm"
                  title="Edit message"
                >
                  <Pencil className="h-3 w-3 text-gray-500" />
                </button>
                <button 
                  onClick={handleDelete} 
                  className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-sm"
                  title="Delete message"
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* Image if present */}
        {message.imageData && !isEditing && (
          <div className="mt-2 mb-1">
            <img 
              src={message.imageData} 
              alt="Message image" 
              className="max-w-full rounded-lg max-h-60 object-contain" 
              onClick={() => window.open(message.imageData, '_blank')}
              style={{ cursor: 'pointer' }}
            />
          </div>
        )}
        
        {/* Timestamp and status */}
        {!isEditing && (
          <div
            className={`text-xs mt-1 ${
              isOwnMessage ? "text-primary-foreground/70" : "text-gray-500"
            }`}
          >
            {new Date(message.sentAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {isOwnMessage && (
              <span className="ml-1">
                • {message.status === "read" ? "Read" : message.status === "delivered" ? "Delivered" : "Sent"}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
