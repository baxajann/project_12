import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Legend, 
  Tooltip as RechartTooltip, 
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import { Separator } from "@/components/ui/separator";
import { Activity, ArrowLeft, BadgeInfo, BarChart3, CircleCheck } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function ModelValidation() {
  const [activeTab, setActiveTab] = useState("metrics");
  
  const { data: modelComparison, isLoading } = useQuery({
    queryKey: ['/api/predict/models'],
  });
  
  const metricsData = modelComparison ? Object.entries(modelComparison.results).map(([model, metrics]) => ({
    name: model,
    accuracy: parseFloat((metrics.accuracy * 100).toFixed(2)),
    precision: parseFloat((metrics.precision * 100).toFixed(2)),
    recall: parseFloat((metrics.recall * 100).toFixed(2)),
    f1_score: parseFloat((metrics.f1_score * 100).toFixed(2)),
    cv_mean: parseFloat((metrics.cv_mean * 100).toFixed(2)),
  })) : [];
  
  const cvScoresData = modelComparison ? Object.entries(modelComparison.results).map(([model, metrics]) => {
    const data = metrics.cv_scores.map((score, index) => ({
      name: `Fold ${index + 1}`,
      score: parseFloat((score * 100).toFixed(2)),
    }));
    return { model, data };
  }) : [];
  
  const radarData = modelComparison ? Object.entries(modelComparison.results).map(([model, metrics]) => ({
    model,
    accuracy: parseFloat((metrics.accuracy * 100).toFixed(1)),
    precision: parseFloat((metrics.precision * 100).toFixed(1)),
    recall: parseFloat((metrics.recall * 100).toFixed(1)),
    f1_score: parseFloat((metrics.f1_score * 100).toFixed(1)),
    cv_mean: parseFloat((metrics.cv_mean * 100).toFixed(1)),
  })) : [];
  
  const COLORS = [
    "#8884d8", 
    "#82ca9d", 
    "#ffc658", 
    "#ff8042", 
    "#0088fe"
  ];
  
  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm" className="mr-4">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Model Validation</h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Loading model comparison data...</CardTitle>
            <CardDescription>Please wait while we analyze the models</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full bg-gray-100 animate-pulse rounded-md"></div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center mb-6">
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Heart Disease Prediction Models</h1>
      </div>
      
      {modelComparison && (
        <div className="mb-6">
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center">
                <CircleCheck className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <h2 className="text-xl font-bold">Best Performing Model: {modelComparison.best_model}</h2>
                  <p className="text-sm text-gray-600">
                    Based on F1 score, the {modelComparison.best_model} model performs best with {' '}
                    {parseFloat((modelComparison.results[modelComparison.best_model].f1_score * 100).toFixed(1))}% F1 score
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="metrics" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance Metrics
          </TabsTrigger>
          <TabsTrigger value="cross-validation" className="flex items-center">
            <Activity className="h-4 w-4 mr-2" />
            Cross-Validation
          </TabsTrigger>
          <TabsTrigger value="comparison" className="flex items-center">
            <BadgeInfo className="h-4 w-4 mr-2" />
            Model Comparison
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="metrics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Metrics</CardTitle>
              <CardDescription>
                Comparison of accuracy, precision, recall, and F1 score across all models
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart
                  data={metricsData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
                  <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                  <RechartTooltip formatter={(value) => [`${value}%`, '']} />
                  <Legend />
                  <Bar dataKey="accuracy" name="Accuracy" fill="#8884d8" />
                  <Bar dataKey="precision" name="Precision" fill="#82ca9d" />
                  <Bar dataKey="recall" name="Recall" fill="#ffc658" />
                  <Bar dataKey="f1_score" name="F1 Score" fill="#ff8042" />
                </BarChart>
              </ResponsiveContainer>
              
              <Separator className="my-6" />
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Model</th>
                      <th className="text-center p-2">Accuracy</th>
                      <th className="text-center p-2">Precision</th>
                      <th className="text-center p-2">Recall</th>
                      <th className="text-center p-2">F1 Score</th>
                      <th className="text-center p-2">CV Mean</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metricsData.map((model, idx) => (
                      <tr 
                        key={model.name} 
                        className={`border-b ${modelComparison && modelComparison.best_model === model.name ? 'bg-green-50' : ''}`}
                      >
                        <td className="p-2 font-medium">
                          {model.name} {modelComparison && modelComparison.best_model === model.name && '★'}
                        </td>
                        <td className="text-center p-2">{model.accuracy}%</td>
                        <td className="text-center p-2">{model.precision}%</td>
                        <td className="text-center p-2">{model.recall}%</td>
                        <td className="text-center p-2">{model.f1_score}%</td>
                        <td className="text-center p-2">{model.cv_mean}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="cross-validation" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Cross-Validation Scores</CardTitle>
              <CardDescription>
                5-fold cross-validation results for each model
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue={cvScoresData[0]?.model || "MLP"} className="w-full">
                <TabsList className="w-full flex justify-start overflow-x-auto">
                  {cvScoresData.map(({ model }) => (
                    <TabsTrigger key={model} value={model} className="flex-shrink-0">
                      {model}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                {cvScoresData.map(({ model, data }, index) => (
                  <TabsContent key={model} value={model}>
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 mb-4">
                        Cross-validation helps assess how the model will perform on unseen data by splitting the dataset 
                        into 5 folds and training on 4 while testing on 1.
                      </p>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                          data={data}
                          margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
                          <RechartTooltip formatter={(value) => [`${value}%`, 'Accuracy']} />
                          <Bar dataKey="score" name="Accuracy" fill={COLORS[index % COLORS.length]} />
                        </BarChart>
                      </ResponsiveContainer>
                      
                      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-medium mb-2">Cross-Validation Statistics: {model}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">Mean</p>
                            <p className="font-medium">{parseFloat((data.reduce((acc, fold) => acc + fold.score, 0) / data.length).toFixed(2))}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Min</p>
                            <p className="font-medium">{Math.min(...data.map(fold => fold.score))}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Max</p>
                            <p className="font-medium">{Math.max(...data.map(fold => fold.score))}%</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Std. Dev.</p>
                            <p className="font-medium">
                              {parseFloat(Math.sqrt(
                                data.reduce((acc, fold) => {
                                  const mean = data.reduce((sum, f) => sum + f.score, 0) / data.length;
                                  return acc + Math.pow(fold.score - mean, 2);
                                }, 0) / data.length
                              ).toFixed(2))}%
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="comparison" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Model Comparison</CardTitle>
              <CardDescription>
                Visual comparison of all models across multiple metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">Radar Chart Comparison</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                      { metric: "Accuracy", ...radarData.reduce((acc, model) => ({ ...acc, [model.model]: model.accuracy }), {}) },
                      { metric: "Precision", ...radarData.reduce((acc, model) => ({ ...acc, [model.model]: model.precision }), {}) },
                      { metric: "Recall", ...radarData.reduce((acc, model) => ({ ...acc, [model.model]: model.recall }), {}) },
                      { metric: "F1 Score", ...radarData.reduce((acc, model) => ({ ...acc, [model.model]: model.f1_score }), {}) },
                      { metric: "CV Mean", ...radarData.reduce((acc, model) => ({ ...acc, [model.model]: model.cv_mean }), {}) },
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} />
                      {radarData.map((model, index) => (
                        <Radar 
                          key={model.model}
                          name={model.model} 
                          dataKey={model.model} 
                          stroke={COLORS[index % COLORS.length]} 
                          fill={COLORS[index % COLORS.length]} 
                          fillOpacity={0.2} 
                        />
                      ))}
                      <Legend />
                      <RechartTooltip formatter={(value) => [`${value}%`, '']} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-3">Model Insights</h3>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium mb-2">Key Findings</h4>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>
                          <span className="font-medium">{modelComparison?.best_model}</span> shows the highest overall performance
                        </li>
                        <li>
                          Highest accuracy achieved: {Math.max(...metricsData.map(m => m.accuracy))}%
                        </li>
                        <li>
                          Highest F1 score: {Math.max(...metricsData.map(m => m.f1_score))}%
                        </li>
                        <li>
                          Most stable model in cross-validation: {
                            cvScoresData.reduce((stable, current) => {
                              const currentStdDev = Math.sqrt(
                                current.data.reduce((acc, fold) => {
                                  const mean = current.data.reduce((sum, f) => sum + f.score, 0) / current.data.length;
                                  return acc + Math.pow(fold.score - mean, 2);
                                }, 0) / current.data.length
                              );
                              
                              const previousStdDev = Math.sqrt(
                                stable.data.reduce((acc, fold) => {
                                  const mean = stable.data.reduce((sum, f) => sum + f.score, 0) / stable.data.length;
                                  return acc + Math.pow(fold.score - mean, 2);
                                }, 0) / stable.data.length
                              );
                              
                              return currentStdDev < previousStdDev ? current : stable;
                            }, cvScoresData[0]).model
                          }
                        </li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium mb-2">Feature Importance</h4>
                      <p className="text-sm mb-2">
                        The following features were most important in the prediction models:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        <li>Age</li>
                        <li>ST Depression (oldpeak)</li>
                        <li>Maximum Heart Rate</li>
                        <li>Number of Major Vessels</li>
                        <li>Chest Pain Type</li>
                      </ul>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-medium mb-2">Recommendations</h4>
                      <p className="text-sm">
                        Based on the analysis, we recommend:
                      </p>
                      <ul className="list-disc pl-5 space-y-1 text-sm mt-2">
                        <li>Use {modelComparison?.best_model} for production predictions</li>
                        <li>For high recall requirements (minimizing false negatives), consider Random Forest model</li>
                        <li>For high precision needs (minimizing false positives), SVM may be preferable</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}