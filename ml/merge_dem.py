import rasterio
from rasterio.merge import merge
import os

dem1 = "ml/data/raw/P5_PAN_CD_N30_000_E078_000_DEM_30m.tif"
dem2 = "ml/data/raw/P5_PAN_CD_N30_000_E079_000_DEM_30m.tif"

output = "ml/data/raw/rudraprayag_dem_merged.tif"

with rasterio.open(dem1) as src1, rasterio.open(dem2) as src2:

    mosaic, transform = merge([src1, src2])

    profile = src1.profile.copy()

    profile.update(
        height=mosaic.shape[1],
        width=mosaic.shape[2],
        transform=transform
    )

    with rasterio.open(output, "w", **profile) as dst:
        dst.write(mosaic)

print("Merged DEM created:")
print(output)