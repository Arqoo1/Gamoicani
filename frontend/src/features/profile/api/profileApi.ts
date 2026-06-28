import { AuthResponse } from "@/features/auth/api/authApi";
import { API_BASE_URL, ApiEnvelope, getAuthToken, setAuthToken } from "@/shared/api/client";
import { Platform } from "react-native";

async function uploadFile(path: string, uri: string) {
  const token = await getAuthToken();
  const formData = new FormData();

  const filename = uri.split("/").pop() || "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : "image/jpeg";

  formData.append("photo", {
    name: filename,
    type,
    uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri
  } as any);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    body: formData,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    method: "POST"
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Upload failed with ${response.status}`);
  }

  return payload as ApiEnvelope<AuthResponse>;
}

export async function uploadProfilePhoto(uri: string) {
  const response = await uploadFile("/uploads/avatar", uri);
  await setAuthToken(response.data.token);
  return response.data;
}

export async function uploadCoverPhoto(uri: string) {
  const response = await uploadFile("/uploads/cover", uri);
  await setAuthToken(response.data.token);
  return response.data;
}
