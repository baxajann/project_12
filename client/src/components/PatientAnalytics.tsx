import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer 
} from 'recharts';

// Sample colors for the charts
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

interface PatientAnalyticsProps {
  patients: any[];
}

export default function PatientAnalytics({ patients }: PatientAnalyticsProps) {
  // If no patients, display a message
  if (!patients || patients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Patient Analytics</CardTitle>
          <CardDescription>No patient data available to analyze</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">Add patients to your care list to see analytics</p>
        </CardContent>
      </Card>
    );
  }

  // Sample aggregated data (in a real app, this would be calculated from real patient data)
  const ageGroups = [
    { name: '18-30', count: patients.filter(() => Math.random() > 0.5).length || 1 },
    { name: '31-45', count: patients.filter(() => Math.random() > 0.5).length || 2 },
    { name: '46-60', count: patients.filter(() => Math.random() > 0.5).length || 1 },
    { name: '61+', count: patients.filter(() => Math.random() > 0.4).length || 1 },
  ];

  const healthCategories = [
    { name: 'Cardiovascular', count: patients.filter(() => Math.random() > 0.6).length || 2 },
    { name: 'Respiratory', count: patients.filter(() => Math.random() > 0.7).length || 1 },
    { name: 'Neurological', count: patients.filter(() => Math.random() > 0.5).length || 2 },
    { name: 'Metabolic', count: patients.filter(() => Math.random() > 0.8).length || 1 },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Patient Age Distribution</CardTitle>
          <CardDescription>Distribution of patients by age groups</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={ageGroups}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Number of Patients" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Health Categories</CardTitle>
          <CardDescription>Distribution of patients by primary health concern</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={healthCategories}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="name"
                  label={(entry) => entry.name}
                >
                  {healthCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name, props) => [`${value} patients`, props.payload.name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}