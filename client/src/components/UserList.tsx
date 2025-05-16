import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { MessageSquare, Search, UserPlus } from "lucide-react";

interface User {
  id: number;
  fullName: string;
  role: string;
  specialization?: string;
  profilePicture?: string;
}

interface UserListProps {
  users: User[];
  onUserSelect: (user: User) => void;
}

export default function UserList({ users = [], onUserSelect }: UserListProps) {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // Filter users based on search term
  const filteredUsers = users.filter(
    (user) =>
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.specialization &&
        user.specialization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Handle user selection
  const handleUserSelect = (user: User) => {
    onUserSelect(user);
    setIsOpen(false);
  };

  if (!users || users.length === 0) {
    return (
      <Button variant="outline" disabled className="w-full">
        <UserPlus className="mr-2 h-4 w-4" />
        No users available
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <MessageSquare className="mr-2 h-4 w-4" />
          Start New Conversation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a conversation</DialogTitle>
          <DialogDescription>
            {currentUser?.role === "doctor" 
              ? "Select a patient to start a conversation with."
              : "Select a doctor to start a conversation with. All available doctors are listed below."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center space-x-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search by name or ${
                currentUser?.role === "patient" ? "specialization" : ""
              }`}
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="max-h-[350px] overflow-y-auto space-y-2">
          {filteredUsers.length > 0 ? (
            currentUser?.role === "patient" ? (
              // Display doctors with more information for patients
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-md hover:bg-muted cursor-pointer border border-gray-100 mb-2"
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      {user.profilePicture ? (
                        <AvatarImage src={user.profilePicture} alt={user.fullName} />
                      ) : (
                        <AvatarFallback>
                          {user.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      {user.specialization && (
                        <p className="text-sm font-medium text-blue-600">
                          {user.specialization}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Dr. {user.fullName.split(" ")[0]} is a specialized healthcare provider in the field of {user.specialization || "medicine"}.
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="ml-2">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">Chat</span>
                  </Button>
                </div>
              ))
            ) : (
              // Regular list for doctors viewing patients
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted cursor-pointer"
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      {user.profilePicture ? (
                        <AvatarImage src={user.profilePicture} alt={user.fullName} />
                      ) : (
                        <AvatarFallback>
                          {user.fullName
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-sm text-muted-foreground">
                        Patient
                      </p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost">
                    <MessageSquare className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )
          ) : (
            <div className="py-6 text-center text-muted-foreground">
              No doctors or patients found matching your search criteria.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
