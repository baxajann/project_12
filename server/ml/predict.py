import json
import sys
import os
from model_comparison import predict_with_all_models

# Get the input file path from command line arguments or use default
input_file = 'server/ml/temp_input.json'
if len(sys.argv) > 1:
    input_file = sys.argv[1]

# Read input data from file
try:
    with open(input_file, 'r') as f:
        input_data = json.load(f)
except Exception as e:
    print(json.dumps({
        "error": f"Failed to read input data: {str(e)}"
    }))
    sys.exit(1)

try:
    # Make predictions
    predictions = predict_with_all_models(input_data)
    
    # Print JSON result
    print(json.dumps(predictions))
except Exception as e:
    print(json.dumps({
        "error": f"Prediction failed: {str(e)}"
    }))
    sys.exit(1)