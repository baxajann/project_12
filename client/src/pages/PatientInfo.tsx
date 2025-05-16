import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
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
  CardFooter,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { User, ArrowLeft, Save, Plus } from "lucide-react";

// Patient info schema
const patientInfoSchema = z.object({
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  chronicConditions: z.string().optional(),
  medications: z.string().optional(),
  notes: z.string().optional(),
  height: z.string().optional(),
  weight: z.string().optional(),
});

type PatientInfoValues = z.infer<typeof patientInfoSchema>;

// Health metric schema
const healthMetricSchema = z.object({
  metricType: z.string(),
  value: z.string().min(1, "Value is required"),
  userId: z.number(),
});

export default function PatientInfo() {
  const { patientId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();
  const [isAddingMetric, setIsAddingMetric] = useState(false);

  // Redirect if not a doctor
  useEffect(() => {
    if (user && user.role !== "doctor") {
      navigate("/");
      toast({
        title: "Access Denied",
        description: "Only doctors can access patient information pages.",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);

  // Fetch patient data
  const { data: patient, isLoading: patientLoading } = useQuery<any>({
    queryKey: [`/api/users/${patientId}`],
    enabled: !!patientId,
  });

  // Fetch patient's health metrics
  const { data: healthMetrics = [], isLoading: metricsLoading } = useQuery({
    queryKey: [`/api/health-metrics/user/${patientId}`],
    enabled: !!patientId,
  });

  // Fetch patient's existing info
  const { data: patientInfo, isLoading: infoLoading } = useQuery<any>({
    queryKey: [`/api/patientinfo/${patientId}`],
    enabled: !!patientId,
  });

  // Setup patient info form with default values
  const patientInfoForm = useForm<PatientInfoValues>({
    resolver: zodResolver(patientInfoSchema),
    defaultValues: {
      bloodType: "",
      allergies: "",
      chronicConditions: "",
      medications: "",
      notes: "",
      height: "",
      weight: "",
    },
  });

  // Update form values when patient info loads
  useEffect(() => {
    if (patientInfo) {
      try {
        patientInfoForm.reset({
          bloodType: patientInfo.bloodType || "",
          allergies: patientInfo.allergies || "",
          chronicConditions: patientInfo.chronicConditions || "",
          medications: patientInfo.medications || "",
          notes: patientInfo.notes || "",
          height: patientInfo.height || "",
          weight: patientInfo.weight || "",
        });
      } catch (err) {
        console.error("Error resetting form with patient info:", err);
      }
    }
  }, [patientInfo, patientInfoForm]);

  // Setup health metric form
  const healthMetricForm = useForm<z.infer<typeof healthMetricSchema>>({
    resolver: zodResolver(healthMetricSchema),
    defaultValues: {
      metricType: "heart_rate",
      value: "",
      userId: Number(patientId),
    },
  });

  // Update patient info mutation
  const updatePatientInfoMutation = useMutation({
    mutationFn: async (data: PatientInfoValues) => {
      try {
        // Need to add patientId to the data for API
        const dataWithPatientId = {
          ...data,
          patientId: Number(patientId),
        };
        
        const response = await apiRequest(
          patientInfo ? "PATCH" : "POST",
          patientInfo 
            ? `/api/patientinfo/${patientId}` 
            : '/api/patientinfo',
          dataWithPatientId
        );
        return response.json();
      } catch (error) {
        console.error("Error in updatePatientInfoMutation:", error);
        return {};
      }
    },
    onSuccess: () => {
      toast({
        title: "Patient Information Updated",
        description: "Patient information has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/patientinfo/${patientId}`] });
    },
    onError: (error) => {
      console.error("updatePatientInfoMutation error:", error);
      toast({
        title: "Error",
        description: "Failed to update patient information. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Add health metric mutation
  const addHealthMetricMutation = useMutation({
    mutationFn: async (data: z.infer<typeof healthMetricSchema>) => {
      try {
        const response = await apiRequest("POST", "/api/health-metrics", data);
        return response.json();
      } catch (error) {
        console.error("Error in addHealthMetricMutation:", error);
        return {};
      }
    },
    onSuccess: () => {
      toast({
        title: "Health Metric Added",
        description: "Health metric has been recorded successfully.",
      });
      healthMetricForm.reset({
        metricType: "heart_rate",
        value: "",
        userId: Number(patientId),
      });
      setIsAddingMetric(false);
      queryClient.invalidateQueries({ queryKey: [`/api/health-metrics/user/${patientId}`] });
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

  // Handle patient info form submission
  const onPatientInfoSubmit = (data: PatientInfoValues) => {
    updatePatientInfoMutation.mutate(data);
  };

  // Handle health metric form submission
  const onHealthMetricSubmit = (
    data: z.infer<typeof healthMetricSchema>
  ) => {
    addHealthMetricMutation.mutate(data);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // If not a doctor, don't render the page
  if (user && user.role !== "doctor") {
    return null;
  }

  if (patientLoading || infoLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6 flex justify-center items-center h-40">
            <p>Loading patient information...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Card>
          <CardContent className="pt-6 flex justify-center items-center h-40">
            <p>Patient not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")} 
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold">Patient Information</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Patient sidebar */}
        <div>
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center">
                {patient.profilePicture ? (
                  <img
                    src={patient.profilePicture}
                    alt={patient.fullName}
                    className="h-32 w-32 rounded-full object-cover mb-4"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <User className="h-16 w-16 text-primary" />
                  </div>
                )}
                <h2 className="text-xl font-bold">{patient.fullName}</h2>
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="text-sm mt-1">{patient.email}</p>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account Created:</span>
                  <span>{new Date(patient.createdAt).toLocaleDateString()}</span>
                </div>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate(`/chat/new?userId=${patientId}`)}
                >
                  Message Patient
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="md:col-span-2 space-y-6">
          {/* Patient medical info form */}
          <Card>
            <CardHeader>
              <CardTitle>Medical Information</CardTitle>
              <CardDescription>
                Add or update patient's medical information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...patientInfoForm}>
                <form
                  id="patientInfoForm"
                  onSubmit={patientInfoForm.handleSubmit(onPatientInfoSubmit)}
                  className="space-y-6"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={patientInfoForm.control}
                      name="bloodType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blood Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select blood type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="A+">A+</SelectItem>
                              <SelectItem value="A-">A-</SelectItem>
                              <SelectItem value="B+">B+</SelectItem>
                              <SelectItem value="B-">B-</SelectItem>
                              <SelectItem value="AB+">AB+</SelectItem>
                              <SelectItem value="AB-">AB-</SelectItem>
                              <SelectItem value="O+">O+</SelectItem>
                              <SelectItem value="O-">O-</SelectItem>
                              <SelectItem value="Unknown">Unknown</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid gap-4 md:grid-cols-2">
                      <FormField
                        control={patientInfoForm.control}
                        name="height"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (cm)</FormLabel>
                            <FormControl>
                              <Input {...field} type="text" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={patientInfoForm.control}
                        name="weight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (kg)</FormLabel>
                            <FormControl>
                              <Input {...field} type="text" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={patientInfoForm.control}
                    name="allergies"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allergies</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder="List patient allergies"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={patientInfoForm.control}
                    name="chronicConditions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chronic Conditions</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder="List any chronic conditions"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={patientInfoForm.control}
                    name="medications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Medications</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={2}
                            placeholder="List current medications and dosages"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={patientInfoForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Doctor's Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder="Additional notes about the patient"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </form>
              </Form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button
                type="submit"
                form="patientInfoForm"
                disabled={updatePatientInfoMutation.isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {updatePatientInfoMutation.isPending ? "Saving..." : "Save Information"}
              </Button>
            </CardFooter>
          </Card>

          {/* Health metrics section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Health Metrics</CardTitle>
                  <CardDescription>
                    Record and view patient's health metrics
                  </CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsAddingMetric(!isAddingMetric)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Metric
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isAddingMetric && (
                <Card className="mb-6 border-dashed">
                  <CardContent className="pt-6">
                    <Form {...healthMetricForm}>
                      <form
                        onSubmit={healthMetricForm.handleSubmit(onHealthMetricSubmit)}
                        className="grid gap-4 md:grid-cols-3"
                      >
                        <FormField
                          control={healthMetricForm.control}
                          name="metricType"
                          render={({ field }) => (
                            <FormItem className="col-span-1">
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
                                  <SelectItem value="heart_rate">Heart Rate</SelectItem>
                                  <SelectItem value="blood_pressure">Blood Pressure</SelectItem>
                                  <SelectItem value="blood_sugar">Blood Sugar</SelectItem>
                                  <SelectItem value="cholesterol">Cholesterol</SelectItem>
                                  <SelectItem value="temperature">Temperature</SelectItem>
                                  <SelectItem value="oxygen_saturation">Oxygen Saturation</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={healthMetricForm.control}
                          name="value"
                          render={({ field }) => (
                            <FormItem className="col-span-1">
                              <FormLabel>Value</FormLabel>
                              <FormControl>
                                <Input {...field} type="text" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex items-end pb-2">
                          <Button
                            type="submit"
                            disabled={addHealthMetricMutation.isPending}
                            className="ml-auto"
                          >
                            {addHealthMetricMutation.isPending ? "Adding..." : "Add"}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsAddingMetric(false)}
                            className="ml-2"
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}

              {metricsLoading ? (
                <div className="py-4 text-center">Loading health metrics...</div>
              ) : healthMetrics && Array.isArray(healthMetrics) && healthMetrics.length > 0 ? (
                <div className="divide-y border rounded-lg">
                  {healthMetrics.map((metric: any) => (
                    <div key={metric.id} className="p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium capitalize">
                          {metric.metricType.replace("_", " ")}
                        </h4>
                        <p className="text-sm">
                          <span className="text-lg font-medium">{metric.value}</span>
                          {" "}
                          {metric.metricType === "heart_rate" && "bpm"}
                          {metric.metricType === "blood_pressure" && "mmHg"}
                          {metric.metricType === "blood_sugar" && "mg/dL"}
                          {metric.metricType === "cholesterol" && "mg/dL"}
                          {metric.metricType === "temperature" && "°C"}
                          {metric.metricType === "oxygen_saturation" && "%"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">
                          {formatDate(metric.recordedAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No health metrics recorded for this patient.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}