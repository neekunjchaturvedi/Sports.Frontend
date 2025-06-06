import axios, {
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

const AUTH_SERVICE_URL = `${import.meta.env.VITE_PORT}/api/v1/auth`;
const USER_SERVICE_URL = `${import.meta.env.VITE_PORT}/api/v1/user`;
const USERS_SERVICE_URL = `${import.meta.env.VITE_PORT}/api/v1/users`;

// Create an instance of axios for the auth service
const authService = axios.create({
  baseURL: AUTH_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Create an instance of axios for the user service
const userService = axios.create({
  baseURL: USER_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const usersService = axios.create({
  baseURL: USERS_SERVICE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to handle the token
const requestInterceptor = (
  config: InternalAxiosRequestConfig
): InternalAxiosRequestConfig => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
};

authService.interceptors.request.use(requestInterceptor);
userService.interceptors.request.use(requestInterceptor);
usersService.interceptors.request.use(requestInterceptor);

// Add a response interceptor
const responseInterceptor = (response: AxiosResponse): AxiosResponse =>
  response;
const errorInterceptor = (error: AxiosError): Promise<AxiosError> =>
  Promise.reject(error);

authService.interceptors.response.use(responseInterceptor, errorInterceptor);
userService.interceptors.response.use(responseInterceptor, errorInterceptor);
usersService.interceptors.response.use(responseInterceptor, errorInterceptor);

export { authService, userService, usersService };
