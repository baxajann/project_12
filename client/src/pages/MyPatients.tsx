import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import PatientAnalytics from "@/components/PatientAnalytics";

export default function MyPatients() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  
  interface User {
    id: number;
    username: string;
    email: string;
    fullName: string;
    role: string;
    specialization?: string;
    profilePicture?: string;
  }

  // Fetch patients for the doctor
  const { data: patients = [], isLoading: patientsLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    select: (data) => {
      // Filter to only include patients
      return data?.filter(user => user.role === "patient") || [];
    }
  });

  // If not a doctor, redirect to profile
  if (user?.role !== "doctor") {
    navigate("/profile");
    return null;
  }
  
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">My Patients</h1>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Patient Management</CardTitle>
            <CardDescription>
              Manage the patients under your care
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="current">
              <TabsList className="mb-4">
                <TabsTrigger value="current">Current Patients</TabsTrigger>
                <TabsTrigger value="analytics">Patient Analytics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="current">
                {patientsLoading ? (
                  <div className="py-4 text-center">Loading patients...</div>
                ) : patients && Array.isArray(patients) && patients.length > 0 ? (
                  <div className="divide-y border rounded-lg">
                    {patients.map((patient: User) => (
                      <div key={patient.id} className="p-4 flex justify-between items-center">
                        <div className="flex items-center space-x-4">
                          {patient.profilePicture ? (
                            <img
                              src={patient.profilePicture}
                              alt={patient.fullName}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div>
                            <h4 className="font-medium">{patient.fullName}</h4>
                            <p className="text-sm text-muted-foreground">
                              Patient
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              try {
                                // Navigate to chat with this patient
                                navigate(`/chat/new?userId=${patient.id}`);
                              } catch (error) {
                                console.error("Error navigating to chat:", error);
                              }
                            }}
                          >
                            Chat
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              try {
                                // Navigate to view patient details
                                navigate(`/profile?patientId=${patient.id}`);
                              } catch (error) {
                                console.error("Error navigating to patient details:", error);
                              }
                            }}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No patients available in the system.
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="analytics">
                {patientsLoading ? (
                  <div className="py-4 text-center">Loading patient data...</div>
                ) : patients && Array.isArray(patients) ? (
                  <div className="pt-4">
                    <PatientAnalytics patients={patients} />
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Unable to load patient data. Please try again later.
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}