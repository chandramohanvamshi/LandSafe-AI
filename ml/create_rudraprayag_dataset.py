import pandas as pd
import os

# GPS Coordinates focused on Rudraprayag District, Uttarakhand
data = [

    # -------------------------------------------------
    # POSITIVE CLASS: Landslide Events
    # -------------------------------------------------

    {
        "lat": 30.5833,
        "lon": 79.0667,
        "date": "2013-06-16",
        "landslide": 1,
        "location": "Kedarnath Area",
        "soil_moisture_percent": 78
    },

    {
        "lat": 30.5167,
        "lon": 79.0833,
        "date": "2012-09-14",
        "landslide": 1,
        "location": "Okhimath Region",
        "soil_moisture_percent": 68
    },

    {
        "lat": 30.5689,
        "lon": 79.0521,
        "date": "2013-06-17",
        "landslide": 1,
        "location": "Rambara",
        "soil_moisture_percent": 85
    },

    {
        "lat": 30.4851,
        "lon": 79.0289,
        "date": "2017-08-14",
        "landslide": 1,
        "location": "Phata / Mandakini Valley",
        "soil_moisture_percent": 72
    },

    {
        "lat": 30.4072,
        "lon": 78.9811,
        "date": "2020-07-20",
        "landslide": 1,
        "location": "Agastyamuni slope",
        "soil_moisture_percent": 75
    },

    {
        "lat": 30.2844,
        "lon": 78.9811,
        "date": "2021-10-18",
        "landslide": 1,
        "location": "Rudraprayag Town Bypass",
        "soil_moisture_percent": 70
    },


    # -------------------------------------------------
    # NEGATIVE CLASS: Stable / Low-Risk Areas
    # -------------------------------------------------

    {
        "lat": 30.2850,
        "lon": 78.9800,
        "date": "2023-05-10",
        "landslide": 0,
        "location": "Alaknanda Riverbank Flat",
        "soil_moisture_percent": 35
    },

    {
        "lat": 30.3900,
        "lon": 78.9700,
        "date": "2023-06-15",
        "landslide": 0,
        "location": "Agastyamuni Valley Floor",
        "soil_moisture_percent": 42
    },

    {
        "lat": 30.4500,
        "lon": 79.0100,
        "date": "2023-07-01",
        "landslide": 0,
        "location": "Guptkashi Flat Terrain",
        "soil_moisture_percent": 38
    },

    {
        "lat": 30.2500,
        "lon": 78.9500,
        "date": "2023-08-10",
        "landslide": 0,
        "location": "Srinagar-Rudraprayag Border Plain",
        "soil_moisture_percent": 30
    },

    {
        "lat": 30.5000,
        "lon": 79.0000,
        "date": "2023-09-05",
        "landslide": 0,
        "location": "Valley Floor Settlement",
        "soil_moisture_percent": 45
    }
]


# -------------------------------------------------
# CREATE DATAFRAME
# -------------------------------------------------

df = pd.DataFrame(data)


# -------------------------------------------------
# CREATE RAW DATA DIRECTORY
# -------------------------------------------------

os.makedirs("ml/data/raw", exist_ok=True)


# -------------------------------------------------
# SAVE DATASET
# -------------------------------------------------

output_path = "ml/data/raw/landslides_rudraprayag.csv"

df.to_csv(
    output_path,
    index=False
)


# -------------------------------------------------
# DISPLAY RESULT
# -------------------------------------------------

print("SUCCESS!")
print("Saved dataset to:")
print(output_path)

print("\nDataset:")
print(df.to_string(index=False))