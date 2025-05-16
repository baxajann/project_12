
import fs from 'fs';
import path from 'path';
import { HeartDiseaseData } from '@shared/schema';
import pickle from 'pickle';
import { predictWithAllModels, trainModelsIfNeeded } from './model_bridge';

// This uses both statistical KNN and advanced ML approaches (MLP, SVM, DT, RF, NB)
interface DataPoint {
  features: number[];
  target: number;
}

// Interface for model comparison metrics
export interface ModelResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  cv_scores: number[];
  cv_mean: number;
}

// Interface for model comparison results
export interface ModelComparison {
  results: {
    [key: string]: ModelResult;
  };
  best_model: string;
  feature_names: string[];
}

// Load and parse the heart disease dataset
function loadDataset(): DataPoint[] {
  const csvPath = path.join(process.cwd(), 'attached_assets', 'Heart Disease Dataset.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  // Skip header
  const dataLines = lines.slice(1);
  
  return dataLines.map(line => {
    const values = line.split(',').map(v => parseFloat(v.trim()));
    if (values.length < 14) return null;
    
    // Last value is the target (1 = heart disease, 0 = no heart disease)
    const target = values[13];
    const features = values.slice(0, 13);
    
    return { features, target };
  }).filter(Boolean) as DataPoint[];
}

// Simple K-Nearest Neighbors implementation (for fallback if Python bridge fails)
function predictKNN(dataset: DataPoint[], newDataPoint: number[], k: number = 5): { prediction: number, confidence: number } {
  // Calculate Euclidean distance between points
  const distances = dataset.map(dataPoint => {
    const sum = dataPoint.features.reduce((acc, feature, index) => {
      return acc + Math.pow(feature - newDataPoint[index], 2);
    }, 0);
    return {
      distance: Math.sqrt(sum),
      target: dataPoint.target
    };
  });
  
  // Sort by distance and take k nearest neighbors
  const nearestNeighbors = distances.sort((a, b) => a.distance - b.distance).slice(0, k);
  
  // Count votes for each class
  const votes = nearestNeighbors.reduce((acc, neighbor) => {
    acc[neighbor.target] = (acc[neighbor.target] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);
  
  // Find the class with the most votes
  let maxVotes = 0;
  let predictedClass = 0;
  
  for (const [target, count] of Object.entries(votes)) {
    if (count > maxVotes) {
      maxVotes = count;
      predictedClass = parseInt(target);
    }
  }
  
  // Calculate confidence (percentage of votes for the winning class)
  const confidence = Math.round((maxVotes / k) * 100);
  
  return { prediction: predictedClass, confidence };
}

// Function to normalize input data based on dataset ranges
function normalizeInput(input: HeartDiseaseData, dataset: DataPoint[]): number[] {
  // Extract features from dataset to find min/max values
  const features = dataset.map(d => d.features);
  
  const featureRanges = Array(13).fill(0).map((_, i) => {
    const values = features.map(f => f[i]);
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  });
  
  // Convert HeartDiseaseData to array in the same order as the dataset
  const inputArray = [
    input.age,
    input.sex,
    input.cp,
    input.trestbps,
    input.chol,
    input.fbs,
    input.restecg,
    input.thalach,
    input.exang,
    input.oldpeak,
    input.slope,
    input.ca,
    input.thal
  ];
  
  // Normalize each feature to be in the same range as the dataset
  return inputArray.map((value, i) => {
    const { min, max } = featureRanges[i];
    if (max === min) return value; // Avoid division by zero
    return (value - min) / (max - min);
  });
}

// Generate feature explanations
function generateExplanations(input: HeartDiseaseData): { feature: string, value: number, impact: string }[] {
  return [
    {
      feature: "Age",
      value: input.age,
      impact: input.age > 50 ? "high risk" : "low risk"
    },
    {
      feature: "Sex",
      value: input.sex,
      impact: input.sex === 1 ? "higher risk (male)" : "lower risk (female)"
    },
    {
      feature: "Chest Pain Type",
      value: input.cp,
      impact: input.cp > 1 ? "concerning" : "normal"
    },
    {
      feature: "Resting Blood Pressure",
      value: input.trestbps,
      impact: input.trestbps > 140 ? "elevated" : "normal"
    },
    {
      feature: "Cholesterol",
      value: input.chol,
      impact: input.chol > 240 ? "high" : "normal"
    },
    {
      feature: "Max Heart Rate",
      value: input.thalach,
      impact: input.thalach < 150 ? "reduced capacity" : "good capacity"
    },
    {
      feature: "ST Depression",
      value: input.oldpeak,
      impact: input.oldpeak > 1.5 ? "concerning" : "normal"
    }
  ];
}

// Main prediction function that uses multiple ML models
export async function predictHeartDisease(input: HeartDiseaseData): Promise<{ 
  prediction: boolean, 
  confidence: number,
  modelPredictions: { [key: string]: { prediction: boolean, confidence: number } },
  bestModel: string,
  modelComparison: ModelComparison | null,
  explanations: { feature: string, value: number, impact: string }[] 
}> {
  try {
    // Try to use the Python models first
    const multiModelResult = await predictWithAllModels(input);
    
    return {
      prediction: multiModelResult.overallResult.prediction,
      confidence: multiModelResult.overallResult.confidence,
      modelPredictions: multiModelResult.allModels,
      bestModel: multiModelResult.bestModel,
      modelComparison: multiModelResult.comparison,
      explanations: multiModelResult.explanations
    };
  } catch (error) {
    console.error("Error using Python models:", error);
    
    // Fall back to JavaScript KNN implementation
    const dataset = loadDataset();
    const normalizedInput = normalizeInput(input, dataset);
    const { prediction: knnPrediction, confidence } = predictKNN(dataset, normalizedInput, 7);
    
    return {
      prediction: knnPrediction === 1,
      confidence,
      modelPredictions: {
        "KNN": { prediction: knnPrediction === 1, confidence }
      },
      bestModel: "KNN (Fallback)",
      modelComparison: null,
      explanations: generateExplanations(input)
    };
  }
}

// Function to train models if needed and return comparison metrics
export async function getModelComparison(): Promise<ModelComparison> {
  try {
    return await trainModelsIfNeeded();
  } catch (error) {
    console.error("Error getting model comparison:", error);
    throw error;
  }
}

// Function to simulate processing a CSV file from user uploads  
export function processHeartDataFromCSV(csvContent: string): { 
  processed: boolean, 
  data?: HeartDiseaseData, 
  error?: string 
} {
  try {
    // Parse CSV content
    const lines = csvContent.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return { processed: false, error: "CSV file must contain a header row and at least one data row" };
    }
    
    // Get header and values
    const header = lines[0].split(',').map(h => h.trim());
    const values = lines[1].split(',').map(v => parseFloat(v.trim()));
    
    // Check if we have the expected number of columns
    if (header.length < 13 || values.length < 13) {
      return { 
        processed: false, 
        error: "CSV must contain all required columns: age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal" 
      };
    }
    
    // Map to HeartDiseaseData
    const data: HeartDiseaseData = {
      age: values[header.indexOf('age')] || 0,
      sex: values[header.indexOf('sex')] || 0,
      cp: values[header.indexOf('cp')] || 0,
      trestbps: values[header.indexOf('trestbps')] || 0,
      chol: values[header.indexOf('chol')] || 0,
      fbs: values[header.indexOf('fbs')] || 0,
      restecg: values[header.indexOf('restecg')] || 0,
      thalach: values[header.indexOf('thalach')] || 0,
      exang: values[header.indexOf('exang')] || 0,
      oldpeak: values[header.indexOf('oldpeak')] || 0,
      slope: values[header.indexOf('slope')] || 0,
      ca: values[header.indexOf('ca')] || 0,
      thal: values[header.indexOf('thal')] || 0
    };
    
    return { processed: true, data };
  } catch (error) {
    return { 
      processed: false, 
      error: "Failed to process CSV file: " + (error instanceof Error ? error.message : String(error)) 
    };
  }
}
