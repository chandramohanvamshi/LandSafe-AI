import axios from "axios";

const API_URL = " https://landslide-backend-lv7z.onrender.com";

export const predictRisk = async ({
  elevation_m,
  slope_degrees,
  rainfall_mm_24h,
  rainfall_mm_72h,
}) => {
  try {
    const response = await axios.post(`${API_URL}/predict`, {
      elevation_m,
      slope_degrees,
      rainfall_mm_24h,
      rainfall_mm_72h,
    });

    return response.data;
  } catch (error) {
    console.error("Prediction API error:", error);
    throw error;
  }
};