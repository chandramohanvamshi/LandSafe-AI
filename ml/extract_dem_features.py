import pandas as pd
import numpy as np
import rasterio
import os

DEM_PATH = "ml/data/raw/P5_PAN_CD_N30_000_E079_000_DEM_30m.tif"


def calculate_slope(dem, row, col, latitude, lon_pixel_size, lat_pixel_size):

    if row < 1 or row >= dem.shape[0] - 1:
        return np.nan

    if col < 1 or col >= dem.shape[1] - 1:
        return np.nan

    z1 = dem[row - 1, col - 1]
    z2 = dem[row - 1, col]
    z3 = dem[row - 1, col + 1]

    z4 = dem[row, col - 1]
    z6 = dem[row, col + 1]

    z7 = dem[row + 1, col - 1]
    z8 = dem[row + 1, col]
    z9 = dem[row + 1, col + 1]

    # Convert DEM pixel size from degrees to meters
    meters_per_degree_lat = 111320

    meters_per_degree_lon = (
        111320 * np.cos(np.radians(latitude))
    )

    pixel_width_m = lon_pixel_size * meters_per_degree_lon
    pixel_height_m = lat_pixel_size * meters_per_degree_lat

    # Horn's method
    dzdx = (
        (z3 + 2 * z6 + z9)
        - (z1 + 2 * z4 + z7)
    ) / (8 * pixel_width_m)

    dzdy = (
        (z7 + 2 * z8 + z9)
        - (z1 + 2 * z2 + z3)
    ) / (8 * pixel_height_m)

    slope = np.degrees(
        np.arctan(
            np.sqrt(dzdx ** 2 + dzdy ** 2)
        )
    )

    return slope


def get_elevation_and_slope(df, dem_path):

    elevations = []
    slopes = []

    with rasterio.open(dem_path) as src:

        dem = src.read(1).astype(float)

        if src.nodata is not None:
            dem[dem == src.nodata] = np.nan

        lon_pixel_size = abs(src.transform.a)
        lat_pixel_size = abs(src.transform.e)

        print("DEM CRS:", src.crs)
        print("Pixel size:", lon_pixel_size, lat_pixel_size)

        for _, row in df.iterrows():

            row_idx, col_idx = src.index(
                row["lon"],
                row["lat"]
            )

            if (
                row_idx < 1
                or row_idx >= dem.shape[0] - 1
                or col_idx < 1
                or col_idx >= dem.shape[1] - 1
            ):
                elevations.append(np.nan)
                slopes.append(np.nan)
                continue

            elevation = dem[row_idx, col_idx]

            slope = calculate_slope(
                dem,
                row_idx,
                col_idx,
                row["lat"],
                lon_pixel_size,
                lat_pixel_size
            )

            elevations.append(elevation)
            slopes.append(slope)

    df["elevation_m"] = elevations
    df["slope_degrees"] = slopes

    return df


# -------------------------------
# LOAD DATA
# -------------------------------

input_path = "ml/data/raw/landslides_rudraprayag.csv"

df = pd.read_csv(input_path)

print("Loaded records:", len(df))


# -------------------------------
# EXTRACT FEATURES
# -------------------------------

df = get_elevation_and_slope(df, DEM_PATH)

df = df.dropna(
    subset=["elevation_m", "slope_degrees"]
)


# -------------------------------
# SAVE
# -------------------------------

os.makedirs(
    "ml/data/processed",
    exist_ok=True
)

output_path = (
    "ml/data/processed/"
    "landslides_with_dem.csv"
)

df.to_csv(
    output_path,
    index=False
)


print("\nSUCCESS!")
print("Processed dataset saved at:")
print(output_path)

print("\nExtracted features:")

print(
    df[
        [
            "lat",
            "lon",
            "elevation_m",
            "slope_degrees",
            "landslide"
        ]
    ]
)