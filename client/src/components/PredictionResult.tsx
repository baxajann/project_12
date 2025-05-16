import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import html2canvas from "html2canvas";
import { Download, RefreshCw, TrendingUp, BarChart } from "lucide-react";

// Interface for model metrics
interface ModelResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  cv_scores: number[];
  cv_mean: number;
}

// Interface for model comparison
interface ModelComparison {
  results: {
    [key: string]: ModelResult;
  };
  best_model: string;
  feature_names: string[];
}

interface PredictionResultProps {
  result: {
    prediction: boolean;
    confidence: number;
    modelPredictions?: {
      [key: string]: {
        prediction: boolean;
        confidence: number;
      };
    };
    bestModel?: string;
    modelComparison?: ModelComparison | null;
    explanations: Array<{
      feature: string;
      value: number;
      impact: string;
    }>;
  };
  onReset: () => void;
}

export default function PredictionResult({ result, onReset }: PredictionResultProps) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [activeTab, setActiveTab] = useState("summary");

  const { 
    prediction, 
    confidence, 
    modelPredictions = {}, 
    bestModel = "Default", 
    modelComparison = null, 
    explanations 
  } = result;

  const downloadAsPNG = async () => {
    if (!reportRef.current) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        logging: false
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `heart-disease-prediction-${new Date().toISOString().split('T')[0]}.png`;
      link.href = image;
      link.click();
    } catch (error) {
      console.error("Error generating PNG:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  // Format percentage for display
  const formatPercent = (value: number) => {
    return `${Math.round(value * 100)}%`;
  };

  return (
    <div ref={reportRef} className="space-y-6 bg-white p-6 rounded-lg">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Prediction Results</h2>
        <div className="space-x-2">
          <Button variant="outline" onClick={downloadAsPNG} disabled={isDownloading}>
            <Download className="h-4 w-4 mr-2" />
            {isDownloading ? "Downloading..." : "Download Report"}
          </Button>
          <Button variant="outline" onClick={onReset}>
            <RefreshCw className="h-4 w-4 mr-2" />
            New Prediction
          </Button>
        </div>
      </div>

      <Tabs defaultValue="summary" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="models">Model Comparison</TabsTrigger>
          <TabsTrigger value="features">Key Factors</TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="mt-4">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-2">Risk Assessment</h3>
            <div className="flex justify-center items-center my-6">
              <div className={`text-6xl font-bold ${prediction ? "text-red-500" : "text-green-500"}`}>
                {confidence}%
              </div>
            </div>
            <p className="text-center text-lg">
              {prediction 
                ? "High risk of heart disease. Medical consultation recommended."
                : "Low risk of heart disease. Continue healthy lifestyle."
              }
            </p>
            {bestModel && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  Best performing model: <span className="font-semibold">{bestModel}</span>
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="models" className="mt-4">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">
              <div className="flex items-center">
                <BarChart className="h-5 w-5 mr-2" />
                Model Comparison
              </div>
            </h3>
            
            {Object.keys(modelPredictions).length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Model</th>
                        <th className="text-center p-2">Prediction</th>
                        <th className="text-center p-2">Confidence</th>
                        {modelComparison && (
                          <>
                            <th className="text-center p-2">Accuracy</th>
                            <th className="text-center p-2">F1 Score</th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(modelPredictions).map(([model, data]) => (
                        <tr 
                          key={model} 
                          className={`border-b ${bestModel === model ? 'bg-green-50' : ''}`}
                        >
                          <td className="p-2 font-medium">
                            {model} {bestModel === model && '★'}
                          </td>
                          <td className={`text-center p-2 ${data.prediction ? 'text-red-500' : 'text-green-500'}`}>
                            {data.prediction ? 'Positive' : 'Negative'}
                          </td>
                          <td className="text-center p-2">{data.confidence}%</td>
                          {modelComparison && modelComparison.results[model] && (
                            <>
                              <td className="text-center p-2">
                                {formatPercent(modelComparison.results[model].accuracy)}
                              </td>
                              <td className="text-center p-2">
                                {formatPercent(modelComparison.results[model].f1_score)}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {modelComparison && (
                  <div className="mt-6">
                    <h4 className="font-semibold mb-2">Model Performance Metrics</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      The model comparison shows how each algorithm performs on the heart disease dataset.
                      Higher values for accuracy, precision, recall, and F1 score indicate better performance.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries(modelComparison.results).map(([model, metrics]) => (
                        <div 
                          key={model} 
                          className={`border p-4 rounded-lg ${bestModel === model ? 'border-green-500' : ''}`}
                        >
                          <h5 className="font-medium mb-2">
                            {model} {bestModel === model && (
                              <span className="text-green-500 ml-1">★ Best Model</span>
                            )}
                          </h5>
                          <div className="grid grid-cols-2 gap-y-2 text-sm">
                            <div>Accuracy:</div>
                            <div>{formatPercent(metrics.accuracy)}</div>
                            <div>Precision:</div>
                            <div>{formatPercent(metrics.precision)}</div>
                            <div>Recall:</div>
                            <div>{formatPercent(metrics.recall)}</div>
                            <div>F1 Score:</div>
                            <div>{formatPercent(metrics.f1_score)}</div>
                            <div>Cross-Val Mean:</div>
                            <div>{formatPercent(metrics.cv_mean)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center py-4">No model comparison data available.</p>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="features" className="mt-4">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Key Factors
              </div>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {explanations.map((exp, idx) => (
                <div key={idx} className="border p-4 rounded-lg">
                  <h4 className="font-semibold">{exp.feature}</h4>
                  <p className="text-sm text-gray-600">Value: {exp.value}</p>
                  <p className={`text-sm ${exp.impact.includes('high') || exp.impact.includes('concerning') || exp.impact.includes('elevated') ? 'text-red-500' : 'text-green-500'}`}>
                    Impact: {exp.impact}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}