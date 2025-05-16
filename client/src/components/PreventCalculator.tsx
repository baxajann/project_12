import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Heart, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Define the form schema for the PREVENT calculator
const preventFormSchema = z.object({
  age: z.string().refine(val => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 30 && num <= 79;
  }, { message: "Age must be between 30-79 years" }),
  sex: z.enum(["male", "female"], {
    required_error: "Sex selection is required",
  }),
  systolicBP: z.string().refine(val => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 90 && num <= 200;
  }, { message: "Systolic BP must be between 90-200 mmHg" }),
  totalCholesterol: z.string().refine(val => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 130 && num <= 320;
  }, { message: "Total cholesterol must be between 130-320 mg/dL" }),
  hdlCholesterol: z.string().refine(val => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 20 && num <= 100;
  }, { message: "HDL cholesterol must be between 20-100 mg/dL" }),
  smoker: z.enum(["yes", "no"], {
    required_error: "Smoking status is required",
  }),
  diabetes: z.enum(["yes", "no"], {
    required_error: "Diabetes status is required",
  }),
  bpMedication: z.enum(["yes", "no"], {
    required_error: "Blood pressure medication status is required",
  }),
});

type PreventFormValues = z.infer<typeof preventFormSchema>;

// Simple model for calculating risk based on PREVENT inputs
// Note: This is a simplified version for demonstration purposes
// The actual PREVENT calculator uses more complex models and equations
function calculateRisk(data: PreventFormValues) {
  // Convert string values to numbers
  const age = parseInt(data.age);
  const systolicBP = parseInt(data.systolicBP);
  const totalChol = parseInt(data.totalCholesterol);
  const hdlChol = parseInt(data.hdlCholesterol);
  
  // Base risk factors (simplified approximation)
  let riskScore = 0;
  
  // Age factor (increases with age)
  riskScore += (age - 30) * 0.05;
  
  // BP factor
  riskScore += (systolicBP - 120) * 0.03;
  
  // Cholesterol factors
  riskScore += (totalChol - 180) * 0.01;
  riskScore -= (hdlChol - 50) * 0.03; // Higher HDL is protective
  
  // Additional risk factors
  if (data.smoker === "yes") riskScore += 2;
  if (data.diabetes === "yes") riskScore += 2;
  if (data.bpMedication === "yes") riskScore += 1;
  
  // Sex adjustment
  if (data.sex === "male") {
    riskScore *= 1.2;
  }
  
  // Calculate 10-year and 30-year risk (simplified)
  const risk10Year = Math.min(Math.max(riskScore * 0.3, 0.1), 30).toFixed(1);
  const risk30Year = Math.min(Math.max(riskScore, 0.2), 60).toFixed(1);
  
  return {
    risk10Year: parseFloat(risk10Year),
    risk30Year: parseFloat(risk30Year)
  };
}

export default function PreventCalculator() {
  const [results, setResults] = useState<{ risk10Year: number; risk30Year: number } | null>(null);
  const [comparison, setComparison] = useState<{ 
    isPredictorHigher: boolean; 
    predictorRisk: number | null;
  }>({
    isPredictorHigher: false,
    predictorRisk: null
  });

  const form = useForm<PreventFormValues>({
    resolver: zodResolver(preventFormSchema),
    defaultValues: {
      age: "45",
      sex: "male",
      systolicBP: "120",
      totalCholesterol: "180",
      hdlCholesterol: "50",
      smoker: "no",
      diabetes: "no",
      bpMedication: "no",
    },
  });

  function onSubmit(data: PreventFormValues) {
    const risk = calculateRisk(data);
    setResults(risk);
    
    // Simulate comparison with the app's prediction model
    // In a real app, you would compare with actual results from your model
    const simulatedPredictorRisk = risk.risk10Year * (Math.random() * 0.4 + 0.8);
    setComparison({
      isPredictorHigher: simulatedPredictorRisk > risk.risk10Year,
      predictorRisk: parseFloat(simulatedPredictorRisk.toFixed(1))
    });
  }

  function resetForm() {
    form.reset();
    setResults(null);
    setComparison({
      isPredictorHigher: false,
      predictorRisk: null
    });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Heart className="h-6 w-6 text-red-500" />
          <h2 className="text-2xl font-bold">AHA PREVENT™ Calculator</h2>
        </div>
        <p className="text-muted-foreground">
          Calculate 10-year and 30-year cardiovascular disease risk based on the American Heart Association's PREVENT model.
        </p>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>For comparison purposes only</AlertTitle>
          <AlertDescription>
            This is a simplified implementation for educational purposes. For clinical use, please visit the official AHA PREVENT calculator.
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="calculator">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="calculator">Risk Calculator</TabsTrigger>
          <TabsTrigger value="about">About PREVENT</TabsTrigger>
        </TabsList>
        
        <TabsContent value="calculator" className="p-4 border rounded-md mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Patient Information</h3>
                  
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Age (30-79 years)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="30" max="79" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="sex"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Sex</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="male" />
                              </FormControl>
                              <FormLabel className="font-normal">Male</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="female" />
                              </FormControl>
                              <FormLabel className="font-normal">Female</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="smoker"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Smoker</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="yes" />
                              </FormControl>
                              <FormLabel className="font-normal">Yes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="no" />
                              </FormControl>
                              <FormLabel className="font-normal">No</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="diabetes"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>Diabetes</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="yes" />
                              </FormControl>
                              <FormLabel className="font-normal">Yes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="no" />
                              </FormControl>
                              <FormLabel className="font-normal">No</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium">Health Metrics</h3>
                  
                  <FormField
                    control={form.control}
                    name="systolicBP"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Systolic Blood Pressure (mmHg)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="90" max="200" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="totalCholesterol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Cholesterol (mg/dL)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="130" max="320" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="hdlCholesterol"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>HDL Cholesterol (mg/dL)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="20" max="100" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="bpMedication"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>On BP Medication</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex space-x-4"
                          >
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="yes" />
                              </FormControl>
                              <FormLabel className="font-normal">Yes</FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="no" />
                              </FormControl>
                              <FormLabel className="font-normal">No</FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div className="flex space-x-4">
                <Button type="submit" className="w-full">Calculate Risk</Button>
                <Button type="button" variant="outline" onClick={resetForm} className="w-full">Reset</Button>
              </div>
            </form>
          </Form>
          
          {results && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Risk Assessment Results</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>10-Year CVD Risk</CardTitle>
                    <CardDescription>Short-term cardiovascular disease risk</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-center my-4">
                      {results.risk10Year}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {results.risk10Year < 5 
                        ? "Low risk. Continue healthy habits."
                        : results.risk10Year < 10
                        ? "Moderate risk. Consider lifestyle modifications."
                        : "High risk. Medical guidance recommended."}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>30-Year CVD Risk</CardTitle>
                    <CardDescription>Long-term cardiovascular disease risk</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-center my-4">
                      {results.risk30Year}%
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {results.risk30Year < 15
                        ? "Low lifetime risk. Maintain preventive measures."
                        : results.risk30Year < 30
                        ? "Moderate lifetime risk. Focus on lifestyle improvements."
                        : "High lifetime risk. Comprehensive risk reduction advised."}
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              {comparison.predictorRisk !== null && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Comparison with App Prediction Model</h3>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">PREVENT Model</p>
                          <p className="text-xl font-semibold">{results.risk10Year}%</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground mb-2">Difference</p>
                          <div className={`px-3 py-1 rounded-full text-sm ${
                            Math.abs(results.risk10Year - comparison.predictorRisk) < 2
                              ? "bg-green-100 text-green-800"
                              : Math.abs(results.risk10Year - comparison.predictorRisk) < 5
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {Math.abs(results.risk10Year - comparison.predictorRisk).toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">App Prediction</p>
                          <p className="text-xl font-semibold">{comparison.predictorRisk}%</p>
                        </div>
                      </div>
                      
                      <Separator className="my-4" />
                      
                      <p className="text-sm">
                        {Math.abs(results.risk10Year - comparison.predictorRisk) < 2
                          ? "The predictions are very similar, indicating good alignment between models."
                          : Math.abs(results.risk10Year - comparison.predictorRisk) < 5
                          ? "There is a moderate difference between predictions. Both should be considered."
                          : "The predictions differ significantly. Consider consulting with a healthcare provider."}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="about" className="p-4 border rounded-md mt-4">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">What is the PREVENT Calculator?</h3>
              <p className="mt-2">
                The PREVENT calculator (Predicting Risk of cardiovascular disease EVENTs) is developed by the American 
                Heart Association to estimate an individual's risk of developing cardiovascular disease over the next 
                10 years and 30 years. It's designed for primary prevention patients without prior cardiovascular disease.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">Intended Use</h3>
              <p className="mt-2">
                This calculator is intended for primary prevention patients (those without coronary heart disease, stroke, 
                or heart failure) who are between the ages of 30-79 years. It helps estimate absolute risk to assist clinicians 
                and patients in shared decision-making for interventions targeting lifestyle behaviors and medication considerations.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold">How it Works</h3>
              <p className="mt-2">
                The calculator provides 10-year estimates for individuals 30-79 years of age and 30-year risk estimates for 
                individuals 30-59 years of age. The PREVENT equations were developed by the American Heart Association 
                Cardiovascular-Kidney-Metabolic Scientific Advisory Group and validated using data from over 6 million individuals.
              </p>
            </div>
            
            <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
              <Info className="h-4 w-4" />
              <AlertTitle>Official Resource</AlertTitle>
              <AlertDescription>
                For clinical use, please visit the official AHA PREVENT calculator at{" "}
                <a 
                  href="https://professional.heart.org/en/guidelines-and-statements/prevent-calculator" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="underline font-medium"
                >
                  professional.heart.org
                </a>
              </AlertDescription>
            </Alert>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}