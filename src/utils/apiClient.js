import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const apiClient = axios.create({
  baseURL: "https://api-dev-mvp.hr-ms.com",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

// Add token automatically if exists
apiClient.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem("accessToken"); // RN Storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // console.log("API Error:", error.response?.data || error.message);
    return Promise.reject(error.response?.data || error);
  }
);

export default apiClient;
