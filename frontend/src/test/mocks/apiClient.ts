export const API_BASE_URL = "http://localhost:4000/api";

export function getApiOrigin() {
  return API_BASE_URL.replace(/\/api\/?$/, "");
}
