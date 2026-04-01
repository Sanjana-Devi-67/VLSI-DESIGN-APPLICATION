import pickle

with open('ml_service/lightgbm_model.pkl', 'rb') as f:
    data = pickle.load(f)

print('TOP 5 SENSOR PARAMETERS FOR MANUAL PREDICTION:\n')
metadata = data.get('top_5_metadata', [])
for i, feature in enumerate(metadata, 1):
    print(f'{i}. {feature["id"]} - {feature["description"]}')
    print(f'   Min: {feature.get("min", "N/A")}')
    print(f'   Max: {feature.get("max", "N/A")}')
    print(f'   Ideal: {feature.get("ideal", "N/A")}')
    print()
