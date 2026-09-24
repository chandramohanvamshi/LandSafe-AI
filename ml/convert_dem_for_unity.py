import rasterio
import numpy as np
import os
from scipy.ndimage import zoom

# Updated path to match your folder structure
dem_path = "ml/data/raw/P5_PAN_CD_N30_000_E079_000_DEM_30m.tif"
output_dir = "dashboard/unity_assets"
os.makedirs(output_dir, exist_ok=True)

if not os.path.exists(dem_path):
    print(f"ERROR: Could not find DEM file at {dem_path}")
    exit(1)

with rasterio.open(dem_path) as src:
    elevation_data = src.read(1)
    
    # Handle nodata/invalid values
    elevation_data = np.where(elevation_data < 0, 0, elevation_data)
    
    # Target resolution for Unity heightmap: 1025 x 1025
    target_res = 1025
    zoom_factors = (target_res / elevation_data.shape[0], target_res / elevation_data.shape[1])
    resized_data = zoom(elevation_data, zoom_factors, order=1)
    
    # Normalize elevation array to 0 - 65535 (16-bit integers)
    min_elev = np.min(resized_data)
    max_elev = np.max(resized_data)
    normalized = ((resized_data - min_elev) / (max_elev - min_elev) * 65535).astype(np.uint16)

    # Save as 16-bit RAW file
    raw_path = os.path.join(output_dir, "rudraprayag_heightmap.raw")
    normalized.tofile(raw_path)
    print(f"SUCCESS: Exported 16-bit RAW heightmap (1025x1025) at {raw_path}")
    print(f"Elevation Range: Min {min_elev:.1f}m, Max {max_elev:.1f}m")