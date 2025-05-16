
import { useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { AlertCircle, FileUp, HardDrive } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import PredictionResult from "@/components/PredictionResult";

const formSchema = z.object({
  age: z.string().transform(val => parseInt(val)),
  sex: z.string().transform(val => parseInt(val)),
  cp: z.string().transform(val => parseInt(val)),
  trestbps: z.string().transform(val => parseInt(val)),
  chol: z.string().transform(val => parseInt(val)), 
  fbs: z.string().transform(val => parseInt(val)),
  restecg: z.string().transform(val => parseInt(val)),
  thalach: z.string().transform(val => parseInt(val)),
  exang: z.string().transform(val => parseInt(val)),
  oldpeak: z.string().transform(val => parseFloat(val)),
  slope: z.string().transform(val => parseInt(val)),
  ca: z.string().transform(val => parseInt(val)),
  thal: z.string().transform(val => parseInt(val))
});

export default function DiseasePredictor() {
  const [prediction, setPrediction] = useState<any>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      age: "",
      sex: "1",
      cp: "0",
      trestbps: "",
      chol: "",
      fbs: "0",
      restecg: "0",
      thalach: "",
      exang: "0",
      oldpeak: "0",
      slope: "0",
      ca: "0",
      thal: "0"
    }
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      
      const result = await response.json();
      setPrediction(result);
    } catch (error) {
      console.error("Error making prediction:", error);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    setUploadError(null);
    
    try {
      // Check file extension
      if (!file.name.endsWith('.csv')) {
        setUploadError("Please upload a CSV file");
        return;
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/predict/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        setUploadError(error.message || "Failed to process file");
        return;
      }

      const result = await response.json();
      setPrediction(result);
    } catch (error) {
      setUploadError(`Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  // Description of the feature values
  const featureDescriptions = {
    age: "Age in years (29-77)",
    sex: "Sex (1=male, 0=female)",
    cp: "Chest pain type (0=typical angina, 1=atypical angina, 2=non-anginal pain, 3=asymptomatic)",
    trestbps: "Resting blood pressure in mm Hg (94-200)",
    chol: "Serum cholesterol in mg/dl (126-564)",
    fbs: "Fasting blood sugar > 120 mg/dl (1=true, 0=false)",
    restecg: "Resting ECG results (0=normal, 1=ST-T wave abnormality, 2=left ventricular hypertrophy)",
    thalach: "Maximum heart rate achieved (71-202)",
    exang: "Exercise induced angina (1=yes, 0=no)",
    oldpeak: "ST depression induced by exercise relative to rest (0-6.2)",
    slope: "Slope of the peak exercise ST segment (0=upsloping, 1=flat, 2=downsloping)",
    ca: "Number of major vessels colored by fluoroscopy (0-3)",
    thal: "Thalassemia (0=normal, 1=fixed defect, 2=reversible defect, 3=irreversible)"
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Heart Disease Prediction</h1>
      
      <Tabs defaultValue="manual">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="manual">Manual Input</TabsTrigger>
          <TabsTrigger value="file">CSV Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="manual" className="space-y-4">
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Patient Data Input</CardTitle>
              <CardDescription>
                Enter a patient's data to predict their heart disease risk using a hybrid KNN and MLP model.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="age"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Age</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="Age (29-77)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="sex"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sex (1 = male, 0 = female)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Chest Pain Type (0-3)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="3" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="trestbps"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resting Blood Pressure</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="mm Hg (94-200)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="chol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Serum Cholesterol</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="mg/dl (126-564)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="fbs"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fasting Blood Sugar {'>'} 120 mg/dl (1=true, 0=false)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="restecg"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resting ECG Results (0-2)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="thalach"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Heart Rate</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="BPM (71-202)" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="exang"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exercise Induced Angina (1=yes, 0=no)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="oldpeak"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ST Depression</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.1" placeholder="0.0-6.2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slope"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slope of Peak Exercise ST Segment (0-2)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ca"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Major Vessels (0-3)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="3" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="thal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Thal (0-3)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="3" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Button type="submit" className="w-full">
                    Make Prediction
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="file" className="space-y-4">
          <Card className="p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Upload Patient Data</CardTitle>
              <CardDescription>
                Upload a CSV file with patient data. The file should have the same format as the Heart Disease Dataset.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <HardDrive className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="mb-2 font-medium">Upload a CSV file</p>
                  <p className="text-xs text-gray-500 mb-4">The file should contain patient heart health data</p>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    variant="outline"
                  >
                    <FileUp className="h-4 w-4 mr-2" />
                    {isUploading ? "Uploading..." : "Choose File"}
                  </Button>
                </div>
                
                {uploadError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">CSV Format Information</h3>
                  <p className="text-sm text-gray-700 mb-2">
                    Your CSV file should have the following columns:
                  </p>
                  <div className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto whitespace-nowrap mb-2">
                    age,sex,cp,trestbps,chol,fbs,restecg,thalach,exang,oldpeak,slope,ca,thal,target
                  </div>
                  <p className="text-xs text-gray-600">
                    The system will use a Neural Network (MLP) model and KNN classifier to predict heart disease risk.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {prediction && (
        <div className="mt-6">
          <PredictionResult result={prediction} onReset={() => setPrediction(null)} />
        </div>
      )}
      
      <Card className="mt-6 p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle>About the Heart Disease Prediction Model</CardTitle>
          <CardDescription>
            This prediction system uses both a MLP (Multi-Layer Perceptron) neural network and a KNN (K-Nearest Neighbors) algorithm for enhanced accuracy.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="space-y-4">
            <p>
              The system analyzes 13 key health features to assess a patient's risk of heart disease. The prediction is enhanced by using both statistical and neural network approaches.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-blue-700 mb-2">Features Used in Prediction</h3>
                <ul className="space-y-1 text-sm">
                  {Object.entries(featureDescriptions).map(([key, desc]) => (
                    <li key={key} className="flex">
                      <span className="font-semibold mr-2 min-w-[80px]">{key}:</span> 
                      <span>{desc}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-bold text-green-700 mb-2">Model Information</h3>
                <ul className="space-y-2 text-sm">
                  <li><span className="font-semibold">MLP Model:</span> Neural network trained on heart disease dataset</li>
                  <li><span className="font-semibold">KNN Algorithm:</span> Statistical nearest-neighbor approach</li>
                  <li><span className="font-semibold">Dataset:</span> Heart Disease Dataset from UCI Machine Learning Repository</li>
                  <li><span className="font-semibold">Prediction Output:</span> Risk assessment with confidence score and feature importance</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
