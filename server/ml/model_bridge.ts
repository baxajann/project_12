import { HeartDiseaseData } from '@shared/schema';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

interface ModelPrediction {
  prediction: boolean;
  confidence: number;
}

interface ModelResult {
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  cv_scores: number[];
  cv_mean: number;
}

interface ModelComparison {
  results: {
    [key: string]: ModelResult;
  };
  best_model: string;
  feature_names: string[];
}

interface MultiModelPrediction {
  allModels: {
    [key: string]: ModelPrediction;
  };
  bestModel: string;
  overallResult: ModelPrediction;
  comparison: ModelComparison | null;
  explanations: Array<{ feature: string; value: number; impact: string }>;
}

/**
 * Executes a Python script and returns the output as a Promise
 */
async function runPythonScript(scriptPath: string, args: string[] = []): Promise<string> {
  return new Promise((resolve, reject) => {
    // Use python3 command explicitly
    const process = spawn('python3', [scriptPath, ...args]);
    
    let output = '';
    let errorOutput = '';
    
    process.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });
    
    process.on('close', (code) => {
      if (code !== 0) {
        console.error(`Python script exited with code ${code}`);
        console.error(`Error output: ${errorOutput}`);
        reject(new Error(`Python script exited with code ${code}: ${errorOutput}`));
      } else {
        resolve(output);
      }
    });
  });
}

/**
 * Trains models if they don't exist and returns comparison results
 */
export async function trainModelsIfNeeded(): Promise<ModelComparison> {
  try {
    const scriptPath = path.join(process.cwd(), 'server/ml/model_comparison.py');
    
    // Execute the script
    const output = await runPythonScript(scriptPath);
    
    // Parse the output as JSON
    const lines = output.split('\n').filter(line => line.trim());
    const lastLine = lines[lines.length - 1];
    
    try {
      return JSON.parse(lastLine) as ModelComparison;
    } catch (error) {
      console.error('Error parsing Python output:', error);
      console.error('Python output:', output);
      throw new Error('Failed to parse model comparison results');
    }
  } catch (error) {
    console.error('Error training models:', error);
    throw error;
  }
}

/**
 * Makes predictions using multiple models
 */
export async function predictWithAllModels(data: HeartDiseaseData): Promise<MultiModelPrediction> {
  try {
    // Ensure models exist
    const modelDir = path.join(process.cwd(), 'server/ml/models');
    const comparisonPath = path.join(modelDir, 'comparison_results.json');
    
    let comparison: ModelComparison | null = null;
    
    // Check if comparison results exist
    if (fs.existsSync(comparisonPath)) {
      comparison = JSON.parse(fs.readFileSync(comparisonPath, 'utf-8')) as ModelComparison;
    } else {
      // Train models if needed
      comparison = await trainModelsIfNeeded();
    }
    
    // Create a temporary JSON file with the input data
    const inputPath = path.join(process.cwd(), 'server/ml/temp_input.json');
    fs.writeFileSync(inputPath, JSON.stringify(data));
    
    // Execute prediction script
    const scriptPath = path.join(process.cwd(), 'server/ml/predict.py');
    
    // Create the prediction script if it doesn't exist
    if (!fs.existsSync(scriptPath)) {
      const predictScript = `
import json
import sys
import os
from model_comparison import predict_with_all_models

# Read input data from file
with open('server/ml/temp_input.json', 'r') as f:
    input_data = json.load(f)

# Make predictions
predictions = predict_with_all_models(input_data)

# Print JSON result
print(json.dumps(predictions))
`;
      fs.writeFileSync(scriptPath, predictScript);
    }
    
    // Run the prediction script
    const output = await runPythonScript(scriptPath);
    
    // Parse the output
    const predictions = JSON.parse(output.trim()) as { [key: string]: ModelPrediction };
    
    // Clean up temporary file
    if (fs.existsSync(inputPath)) {
      fs.unlinkSync(inputPath);
    }
    
    // Determine the best model
    const bestModel = comparison ? comparison.best_model : 'Random Forest';
    
    // Generate explanations (simplified version)
    const explanations = [
      {
        feature: "Age",
        value: data.age,
        impact: data.age > 50 ? "high risk" : "low risk"
      },
      {
        feature: "Sex",
        value: data.sex,
        impact: data.sex === 1 ? "higher risk (male)" : "lower risk (female)"
      },
      {
        feature: "Chest Pain Type",
        value: data.cp,
        impact: data.cp > 1 ? "concerning" : "normal"
      },
      {
        feature: "Resting Blood Pressure",
        value: data.trestbps,
        impact: data.trestbps > 140 ? "elevated" : "normal"
      },
      {
        feature: "Cholesterol",
        value: data.chol,
        impact: data.chol > 240 ? "high" : "normal"
      },
      {
        feature: "Max Heart Rate",
        value: data.thalach,
        impact: data.thalach < 150 ? "reduced capacity" : "good capacity"
      },
      {
        feature: "ST Depression",
        value: data.oldpeak,
        impact: data.oldpeak > 1.5 ? "concerning" : "normal"
      }
    ];
    
    // Return combined results
    return {
      allModels: predictions,
      bestModel,
      overallResult: predictions[bestModel] || { prediction: false, confidence: 0 },
      comparison,
      explanations
    };
  } catch (error) {
    console.error('Error predicting with all models:', error);
    
    // Fall back to a default prediction if the Python integration fails
    return {
      allModels: {
        "Fallback": { prediction: false, confidence: 0 }
      },
      bestModel: "None",
      overallResult: { prediction: false, confidence: 0 },
      comparison: null,
      explanations: []
    };
  }
}