import json
import os
import sys
import pickle
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.neural_network import MLPClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

# Ensure model directory exists
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

# Path to the dataset
DATASET_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 
                            'attached_assets', 'Heart Disease Dataset.csv')

def load_dataset():
    """Load the heart disease dataset"""
    try:
        # Load dataset
        df = pd.read_csv(DATASET_PATH)
        
        # Extract features and target
        X = df.iloc[:, :-1].values  # All columns except the last one
        y = df.iloc[:, -1].values   # Last column (target)
        
        return X, y, df.columns[:-1].tolist()
    except Exception as e:
        print(f"Error loading dataset: {str(e)}")
        sys.exit(1)

def train_and_compare_models(data=None):
    """Train multiple models and compare their performance"""
    # Load data if not provided
    if data is None:
        X, y, feature_names = load_dataset()
    else:
        X, y, feature_names = data
    
    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Standardize features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Save scaler
    with open(os.path.join(MODEL_DIR, 'scaler.pkl'), 'wb') as f:
        pickle.dump(scaler, f)
    
    # Define models to compare
    models = {
        'MLP': MLPClassifier(hidden_layer_sizes=(10, 5), max_iter=1000, random_state=42),
        'Random Forest': RandomForestClassifier(n_estimators=100, random_state=42),
        'SVM': SVC(probability=True, random_state=42),
        'Decision Tree': DecisionTreeClassifier(random_state=42),
        'Naive Bayes': GaussianNB()
    }
    
    # Train and evaluate models
    results = {}
    best_f1 = 0
    best_model_name = None
    
    for name, model in models.items():
        # Train model
        model.fit(X_train_scaled, y_train)
        
        # Save model
        with open(os.path.join(MODEL_DIR, f'{name.replace(" ", "_").lower()}.pkl'), 'wb') as f:
            pickle.dump(model, f)
        
        # Make predictions
        y_pred = model.predict(X_test_scaled)
        
        # Calculate metrics
        accuracy = accuracy_score(y_test, y_pred)
        precision = precision_score(y_test, y_pred, zero_division=0)
        recall = recall_score(y_test, y_pred, zero_division=0)
        f1 = f1_score(y_test, y_pred, zero_division=0)
        
        # Perform cross-validation
        cv_scores = cross_val_score(model, X, y, cv=5)
        
        # Store results
        results[name] = {
            'accuracy': float(accuracy),
            'precision': float(precision),
            'recall': float(recall),
            'f1_score': float(f1),
            'cv_scores': [float(score) for score in cv_scores],
            'cv_mean': float(cv_scores.mean())
        }
        
        # Track best model
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
    
    # Save comparison results
    comparison = {
        'results': results,
        'best_model': best_model_name,
        'feature_names': feature_names
    }
    
    with open(os.path.join(MODEL_DIR, 'comparison_results.json'), 'w') as f:
        json.dump(comparison, f)
    
    return comparison

def predict_with_all_models(input_data):
    """Make predictions using all models"""
    # Ensure models exist
    if not os.path.exists(os.path.join(MODEL_DIR, 'comparison_results.json')):
        train_models_if_needed()
    
    # Load comparison results
    with open(os.path.join(MODEL_DIR, 'comparison_results.json'), 'r') as f:
        comparison = json.load(f)
    
    # Load scaler
    with open(os.path.join(MODEL_DIR, 'scaler.pkl'), 'rb') as f:
        scaler = pickle.load(f)
    
    # Convert input data to array and scale
    input_array = np.array([
        [
            input_data['age'],
            input_data['sex'],
            input_data['cp'],
            input_data['trestbps'],
            input_data['chol'],
            input_data['fbs'],
            input_data['restecg'],
            input_data['thalach'],
            input_data['exang'],
            input_data['oldpeak'],
            input_data['slope'],
            input_data['ca'],
            input_data['thal']
        ]
    ])
    
    input_scaled = scaler.transform(input_array)
    
    # Make predictions with each model
    predictions = {}
    for model_name in comparison['results'].keys():
        model_path = os.path.join(MODEL_DIR, f'{model_name.replace(" ", "_").lower()}.pkl')
        
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        
        # Get prediction and probability
        pred = model.predict(input_scaled)[0]
        
        if hasattr(model, 'predict_proba'):
            prob = model.predict_proba(input_scaled)[0]
            confidence = int(prob[1] * 100) if pred == 1 else int(prob[0] * 100)
        else:
            confidence = 75  # Default confidence if model doesn't support probabilities
        
        predictions[model_name] = {
            'prediction': bool(pred == 1),
            'confidence': confidence
        }
    
    # Return all predictions with best model highlighted
    return predictions

def train_models_if_needed():
    """Check if models exist and train them if necessary"""
    comparison_path = os.path.join(MODEL_DIR, 'comparison_results.json')
    
    if not os.path.exists(comparison_path):
        print("Training models for the first time...")
        comparison = train_and_compare_models()
    else:
        with open(comparison_path, 'r') as f:
            comparison = json.load(f)
    
    return comparison

if __name__ == "__main__":
    # Train models and print comparison results
    comparison = train_models_if_needed()
    print(json.dumps(comparison))