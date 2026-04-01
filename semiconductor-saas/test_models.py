import pickle
import os

files = ['lightgbm_model.pkl', 'ml_service/lightgbm_model.pkl']

for file_path in files:
    print(f'\nTesting: {file_path}')
    if not os.path.exists(file_path):
        print(f'  File not found')
        continue
    
    try:
        with open(file_path, 'rb') as f:
            data = pickle.load(f)
        
        if isinstance(data, dict):
            print(f'  ✓ Valid pickle dict')
            print(f'    Keys: {list(data.keys())}')
            if 'model' in data:
                print(f'    Model type: {type(data["model"]).__name__}')
            if 'top_5_features' in data:
                print(f'    Top 5 features: {data["top_5_features"]}')
            if 'top_5_metadata' in data:
                print(f'    Metadata available: Yes')
        else:
            print(f'  ✓ Valid pickle (type: {type(data).__name__})')
    except Exception as e:
        print(f'  ✗ Error: {str(e)[:100]}')
