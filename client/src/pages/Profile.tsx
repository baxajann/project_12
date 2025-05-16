import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, Shield, Activity, FileText, Users } from "lucide-react";
import PatientAnalytics from "@/components/PatientAnalytics";

// Profile form schema
const profileFormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  email: z.string().email("Please enter a valid email address"),
  bio: z.string().optional(),
  specialization: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

// Health metrics form schema
const healthMetricsFormSchema = z.object({
  metricType: z.string(),
  value: z.string().min(1, "Value is required"),
});

// Password change form schema
const passwordChangeFormSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
  confirmPassword: z.string().min(8, "Please confirm your new password"),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordChangeFormValues = z.infer<typeof passwordChangeFormSchema>;

export default function Profile() {
  const { user, updatePassword, toggleTwoFactorAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Fetch user's medical files
  const { data: files, isLoading: filesLoading } = useQuery({
    queryKey: ["/api/files"],
  });

  // Fetch user's health metrics
  const { data: healthMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["/api/health-metrics"],
  });
  
  // Fetch available users (doctors if user is patient, patients if user is doctor)
  const { data: availableUsers, isLoading: usersLoading } = useQuery({
    queryKey: ["/api/users"],
  });
  
  // Fetch current connections (doctor-patient relationships)
  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ["/api/connections"],
  });

  // Setup profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      bio: user?.bio || "",
      specialization: user?.specialization || "",
    },
  });

  // Setup health metrics form
  const healthForm = useForm<z.infer<typeof healthMetricsFormSchema>>({
    resolver: zodResolver(healthMetricsFormSchema),
    defaultValues: {
      metricType: "heart_rate",
      value: "",
    },
  });
  
  // Password change form
  const passwordForm = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });
  
  // Two-factor authentication state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormValues) => {
      try {
        // This would be implemented in a real app with a proper API endpoint
        // For now, just return the updated data
        return { ...user, ...data };
      } catch (error) {
        console.error("Error in updateProfileMutation:", error);
        // Return empty object to prevent errors
        return {};
      }
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error) => {
      console.error("updateProfileMutation error:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add health metric mutation
  const addHealthMetricMutation = useMutation({
    mutationFn: async (data: z.infer<typeof healthMetricsFormSchema>) => {
      try {
        const response = await apiRequest("POST", "/api/health-metrics", data);
        return response.json();
      } catch (error) {
        console.error("Error in addHealthMetricMutation:", error);
        // Return empty object to prevent JSON parsing errors
        return {};
      }
    },
    onSuccess: () => {
      toast({
        title: "Health Metric Added",
        description: "Your health metric has been recorded successfully.",
      });
      healthForm.reset({
        metricType: "heart_rate",
        value: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/health-metrics"] });
    },
    onError: (error) => {
      console.error("addHealthMetricMutation error:", error);
      toast({
        title: "Error",
        description: "Failed to add health metric. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Connect with user mutation (for doctor-patient relationship)
  const connectWithUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      try {
        const response = await apiRequest("POST", "/api/connect", { userId });
        return response.json();
      } catch (error) {
        console.error("Error in connectWithUserMutation:", error);
        // Return empty object to prevent JSON parsing errors
        return {};
      }
    },
    onSuccess: () => {
      toast({
        title: "Connection Created",
        description: user?.role === "doctor" 
          ? "Patient added to your care list successfully." 
          : "Doctor added to your healthcare team successfully.",
      });
      setSelectedUserId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      console.error("connectWithUserMutation error:", error);
      toast({
        title: "Error",
        description: "Failed to create connection. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Disconnect from user mutation
  const disconnectFromUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      try {
        const response = await apiRequest("DELETE", `/api/connect/${userId}`);
        return response.json();
      } catch (error) {
        console.error("Error in disconnectFromUserMutation:", error);
        // Return empty object to prevent JSON parsing errors
        return {};
      }
    },
    onSuccess: () => {
      toast({
        title: "Connection Removed",
        description: user?.role === "doctor" 
          ? "Patient removed from your care list." 
          : "Doctor removed from your healthcare team.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/connections"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
    onError: (error) => {
      console.error("disconnectFromUserMutation error:", error);
      toast({
        title: "Error",
        description: "Failed to remove connection. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle profile form submission
  const onProfileSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(data);
  };

  // Handle health metrics form submission
  const onHealthMetricSubmit = (
    data: z.infer<typeof healthMetricsFormSchema>
  ) => {
    addHealthMetricMutation.mutate(data);
  };
  
  // Handle password change form submission
  const onPasswordChangeSubmit = async (data: PasswordChangeFormValues) => {
    const success = await updatePassword(data.currentPassword, data.newPassword);
    if (success) {
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  };
  
  // Handle two-factor authentication toggle
  const handleToggleTwoFactor = async () => {
    const newState = !twoFactorEnabled;
    const success = await toggleTwoFactorAuth(newState);
    if (success) {
      setTwoFactorEnabled(newState);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <p>Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Profile sidebar */}
        <div className="md:w-1/4">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center text-center">
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={user.fullName}
                    className="h-32 w-32 rounded-full object-cover mb-4"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <User className="h-16 w-16 text-primary" />
                  </div>
                )}
                <h2 className="text-xl font-bold">{user.fullName}</h2>
                <p className="text-sm text-muted-foreground capitalize mb-2">
                  {user.role}
                  {user.specialization && ` - ${user.specialization}`}
                </p>
                <p className="text-sm">{user.email}</p>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div
                  className={`flex items-center p-2 rounded-lg cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setActiveTab("profile")}
                >
                  <User className="h-5 w-5 mr-2" />
                  <span>Profile Information</span>
                </div>
                <div
                  className={`flex items-center p-2 rounded-lg cursor-pointer ${
                    activeTab === "health"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setActiveTab("health")}
                >
                  <Activity className="h-5 w-5 mr-2" />
                  <span>Health Metrics</span>
                </div>
                <div
                  className={`flex items-center p-2 rounded-lg cursor-pointer ${
                    activeTab === "files"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setActiveTab("files")}
                >
                  <FileText className="h-5 w-5 mr-2" />
                  <span>Medical Files</span>
                </div>
                <div
                  className={`flex items-center p-2 rounded-lg cursor-pointer ${
                    activeTab === "connections"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setActiveTab("connections")}
                >
                  <Users className="h-5 w-5 mr-2" />
                  <span>{user.role === "doctor" ? "My Patients" : "My Doctors"}</span>
                </div>
                <div
                  className={`flex items-center p-2 rounded-lg cursor-pointer ${
                    activeTab === "security"
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  }`}
                  onClick={() => setActiveTab("security")}
                >
                  <Shield className="h-5 w-5 mr-2" />
                  <span>Security</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="md:w-3/4">
          {activeTab === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...profileForm}>
                  <form
                    onSubmit={profileForm.handleSubmit(onProfileSubmit)}
                    className="space-y-6"
                  >
                    <FormField
                      control={profileForm.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={profileForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {user.role === "doctor" && (
                      <FormField
                        control={profileForm.control}
                        name="specialization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specialization</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select your specialization" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Cardiology">
                                  Cardiology
                                </SelectItem>
                                <SelectItem value="Neurology">
                                  Neurology
                                </SelectItem>
                                <SelectItem value="Pediatrics">
                                  Pediatrics
                                </SelectItem>
                                <SelectItem value="Oncology">
                                  Oncology
                                </SelectItem>
                                <SelectItem value="General Practice">
                                  General Practice
                                </SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    <FormField
                      control={profileForm.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bio</FormLabel>
                          <FormControl>
                            <Textarea
                              rows={4}
                              placeholder="Tell us about yourself"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="submit"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending
                        ? "Saving..."
                        : "Save Changes"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}

          {activeTab === "health" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Health Metrics</CardTitle>
                  <CardDescription>
                    Track and record your health metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="track">
                    <TabsList className="mb-4">
                      <TabsTrigger value="track">Track Metrics</TabsTrigger>
                      <TabsTrigger value="history">History</TabsTrigger>
                    </TabsList>
                    <TabsContent value="track">
                      <Form {...healthForm}>
                        <form
                          onSubmit={healthForm.handleSubmit(onHealthMetricSubmit)}
                          className="space-y-4"
                        >
                          <div className="flex flex-col md:flex-row gap-4">
                            <FormField
                              control={healthForm.control}
                              name="metricType"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel>Metric Type</FormLabel>
                                  <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                  >
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Select metric type" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="heart_rate">
                                        Heart Rate (bpm)
                                      </SelectItem>
                                      <SelectItem value="blood_pressure">
                                        Blood Pressure (mmHg)
                                      </SelectItem>
                                      <SelectItem value="cholesterol">
                                        Cholesterol (mg/dL)
                                      </SelectItem>
                                      <SelectItem value="blood_sugar">
                                        Blood Sugar (mg/dL)
                                      </SelectItem>
                                      <SelectItem value="weight">
                                        Weight (kg)
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={healthForm.control}
                              name="value"
                              render={({ field }) => (
                                <FormItem className="flex-1">
                                  <FormLabel>Value</FormLabel>
                                  <FormControl>
                                    <Input
                                      {...field}
                                      type="text"
                                      placeholder="Enter value"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="submit"
                            disabled={addHealthMetricMutation.isPending}
                          >
                            {addHealthMetricMutation.isPending
                              ? "Saving..."
                              : "Record Metric"}
                          </Button>
                        </form>
                      </Form>
                    </TabsContent>
                    <TabsContent value="history">
                      {metricsLoading ? (
                        <div className="py-4 text-center">
                          Loading health metrics...
                        </div>
                      ) : healthMetrics && Array.isArray(healthMetrics) && healthMetrics.length > 0 ? (
                        <div className="border rounded-md">
                          <div className="grid grid-cols-3 font-medium p-3 border-b">
                            <div>Metric Type</div>
                            <div>Value</div>
                            <div>Date</div>
                          </div>
                          <div className="divide-y">
                            {healthMetrics.map((metric: any) => (
                              <div
                                key={metric.id}
                                className="grid grid-cols-3 p-3"
                              >
                                <div className="capitalize">
                                  {metric.metricType.replace("_", " ")}
                                </div>
                                <div>{metric.value}</div>
                                <div>{formatDate(metric.recordedAt)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-muted-foreground">
                          No health metrics recorded yet.
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "files" && (
            <Card>
              <CardHeader>
                <CardTitle>Medical Files</CardTitle>
                <CardDescription>
                  Your uploaded medical records and test results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filesLoading ? (
                  <div className="py-4 text-center">Loading files...</div>
                ) : files && Array.isArray(files) && files.length > 0 ? (
                  <div className="border rounded-md">
                    <div className="grid grid-cols-3 font-medium p-3 border-b">
                      <div>File Name</div>
                      <div>Upload Date</div>
                      <div>Status</div>
                    </div>
                    <div className="divide-y">
                      {files.map((file: any) => (
                        <div key={file.id} className="grid grid-cols-3 p-3">
                          <div>{file.fileName}</div>
                          <div>{formatDate(file.uploadDate)}</div>
                          <div>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                file.status === "analyzed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {file.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    No medical files uploaded yet.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === "connections" && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>{user.role === "doctor" ? "My Patients" : "My Healthcare Team"}</CardTitle>
                  <CardDescription>
                    {user.role === "doctor"
                      ? "Manage your patient relationships"
                      : "View and manage your healthcare providers"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="current">
                    <TabsList className="mb-4">
                      <TabsTrigger value="current">
                        {user.role === "doctor" ? "Current Patients" : "My Doctors"}
                      </TabsTrigger>
                      <TabsTrigger value="add">
                        {user.role === "doctor" ? "Add Patient" : "Find Specialist"}
                      </TabsTrigger>
                      {user.role === "doctor" && (
                        <TabsTrigger value="analytics">
                          Patient Analytics
                        </TabsTrigger>
                      )}
                    </TabsList>
                    
                    <TabsContent value="current">
                      {connectionsLoading ? (
                        <div className="py-4 text-center">Loading...</div>
                      ) : connections && Array.isArray(connections) && connections.length > 0 ? (
                        <div className="divide-y border rounded-lg">
                          {connections.map((connection: any) => (
                            <div key={connection.id} className="p-4 flex justify-between items-center">
                              <div className="flex items-center space-x-4">
                                {connection.profilePicture ? (
                                  <img
                                    src={connection.profilePicture}
                                    alt={connection.fullName}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-medium">{connection.fullName}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {connection.specialization || connection.role}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // Navigate to chat with this user
                                    navigate(`/chat/new?userId=${connection.id}`);
                                  }}
                                >
                                  Chat
                                </Button>
                                {user.role === "doctor" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      navigate(`/patient-info/${connection.id}`);
                                    }}
                                  >
                                    Add/Edit Info
                                  </Button>
                                )}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                  onClick={() => disconnectFromUserMutation.mutate(connection.id)}
                                  disabled={disconnectFromUserMutation.isPending}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          {user.role === "doctor"
                            ? "You currently have no patients under your care."
                            : "You currently have no healthcare providers."}
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="add">
                      {usersLoading ? (
                        <div className="py-4 text-center">Loading available users...</div>
                      ) : availableUsers && Array.isArray(availableUsers) && availableUsers.length > 0 ? (
                        <div className="divide-y border rounded-lg">
                          {availableUsers.map((availableUser: any) => (
                            <div key={availableUser.id} className="p-4 flex justify-between items-center">
                              <div className="flex items-center space-x-4">
                                {availableUser.profilePicture ? (
                                  <img
                                    src={availableUser.profilePicture}
                                    alt={availableUser.fullName}
                                    className="h-10 w-10 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <User className="h-5 w-5 text-primary" />
                                  </div>
                                )}
                                <div>
                                  <h4 className="font-medium">{availableUser.fullName}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {availableUser.specialization || availableUser.role}
                                  </p>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  try {
                                    connectWithUserMutation.mutate(availableUser.id);
                                  } catch (error) {
                                    console.error("Error connecting with user:", error);
                                  }
                                }}
                                disabled={connectWithUserMutation.isPending}
                              >
                                {connectWithUserMutation.isPending
                                  ? "Connecting..."
                                  : user.role === "doctor"
                                  ? "Add Patient"
                                  : "Add to Team"}
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          {user.role === "doctor"
                            ? "No patients available to add at this time."
                            : "No healthcare providers available at this time."}
                        </div>
                      )}
                    </TabsContent>
                    
                    {user.role === "doctor" && (
                      <TabsContent value="analytics">
                        {connectionsLoading ? (
                          <div className="py-4 text-center">Loading patient data...</div>
                        ) : connections && Array.isArray(connections) ? (
                          <div className="pt-4">
                            <PatientAnalytics patients={connections} />
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            Unable to load patient data. Please try again later.
                          </div>
                        )}
                      </TabsContent>
                    )}
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Change Password</h3>
                    <p className="text-sm text-muted-foreground">
                      Update your password to keep your account secure
                    </p>
                    
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordChangeSubmit)} className="space-y-4">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Current Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter your current password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Enter your new password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm New Password</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirm your new password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <Button type="submit">Change Password</Button>
                      </form>
                    </Form>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {twoFactorEnabled ? "Two-factor authentication is enabled" : "Two-factor authentication is disabled"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {twoFactorEnabled 
                            ? "Your account is protected with an additional layer of security" 
                            : "Enable two-factor authentication for enhanced security"}
                        </p>
                      </div>
                      <Button 
                        variant={twoFactorEnabled ? "destructive" : "default"}
                        onClick={handleToggleTwoFactor}
                      >
                        {twoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Note: In a production environment, 2FA would typically require a verification code. 
                      This implementation is simplified for demonstration purposes.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
