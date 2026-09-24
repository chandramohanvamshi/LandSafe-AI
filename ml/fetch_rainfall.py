import pandas as pd
import requests
import os
import time
from datetime import datetime, timedelta

def get_rainfall_data(lat, lon, date_str):
    try:
        event_date = datetime.strptime(str(date_str).strip(), "%Y-%m-%d")
    except ValueError:
        print(f"Skipping invalid date: {date_str}")
        return 0.0, 0.0

    start_date = (event_date - timedelta(days=3)).strftime("%Y-%m-%d")
    
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": float(lat),
        "longitude": float(lon),
        "start_date": start_date,
        "end_date": date_str,
        "daily": "rain_sum",
        "timezone": "auto"
    }
    
    try:
        response = requests.get(url, params=params, timeout=10)
        
        # Check if HTTP request was successful (200 OK)
        if response.status_code == 200:
            data = response.json()
            if "daily" in data and "rain_sum" in data["daily"]:
                rain_list = [r for r in data["daily"]["rain_sum"] if r is not None]
                if rain_list:
                    rain_24h = rain_list[-1]
                    rain_72h = sum(rain_list)
                    return rain_24h, rain_72h
        else:
            print(f"Warning: API returned status {response.status_code} for ({lat}, {lon})")
            
    except Exception as e:
        print(f"Error fetching rainfall for ({lat}, {lon}) on {date_str}: {e}")
        
    return 0.0, 0.0

# 1. Read input dataset
input_path = "ml/data/processed/landslides_with_dem.csv"
if not os.path.exists(input_path):
    print(f"ERROR: {input_path} does not exist. Run extract_dem_features.py first!")
    exit(1)

df = pd.read_csv(input_path)

# 2. Fetch rainfall data with progress logging
rain_24h_list = []
rain_72h_list = []

print(f"Fetching rainfall data for {len(df)} locations...")
for idx, row in df.iterrows():
    r24, r72 = get_rainfall_data(row['lat'], row['lon'], row['date'])
    rain_24h_list.append(r24)
    rain_72h_list.append(r72)
    print(f"[{idx+1}/{len(df)}] Lat: {row['lat']}, Lon: {row['lon']} | Date: {row['date']} -> 24h: {r24}mm, 72h: {r72}mm")
    time.sleep(0.3)  # Delay to respect Open-Meteo free tier limits

df['rainfall_mm_24h'] = rain_24h_list
df['rainfall_mm_72h'] = rain_72h_list

# 3. Create directory if missing & save final dataset
output_dir = "ml/data/processed"
os.makedirs(output_dir, exist_ok=True)

output_path = os.path.join(output_dir, "model_training_dataset.csv")
df.to_csv(output_path, index=False)

print(f"\nSUCCESS: Full training dataset created at {output_path}!")