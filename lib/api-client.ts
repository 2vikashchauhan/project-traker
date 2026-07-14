import axios from "axios";

const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response) {
      const { data, status } = error.response;
      const apiError = {
        status,
        error: data?.error || "UnknownError",
        message: data?.message || "An unexpected error occurred",
        fieldErrors: data?.fieldErrors,
      };
      return Promise.reject(apiError);
    }
    return Promise.reject({
      status: 500,
      error: "NetworkError",
      message: "Unable to connect to the server",
    });
  }
);

export default apiClient;
