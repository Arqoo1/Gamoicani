import { AuthResponse } from "@/features/auth/api/authApi";
import { File as ExpoFile, UploadType } from "expo-file-system";
import { API_BASE_URL, ApiEnvelope, fetchWithTimeout, getAuthToken, setAuthToken } from "@/shared/api/client";
import { Platform } from "react-native";

function getUploadFileInfo(uri: string) {
  const filename = uri.split("/").pop() || "photo.jpg";
  const match = /\.(\w+)$/.exec(filename);
  const extension = match?.[1]?.toLowerCase();
  const type = extension === "jpg" ? "image/jpeg" : extension ? `image/${extension}` : "image/jpeg";

  return { filename, type };
}

async function parseUploadResponse(status: number, body: string) {
  const payload = JSON.parse(body || "{}") as ApiEnvelope<AuthResponse> & {
    error?: { message?: string };
  };

  if (status < 200 || status >= 300) {
    throw new Error(payload.error?.message ?? `Upload failed with ${status}`);
  }

  return payload;
}

async function uploadFile(path: string, uri: string) {
  const token = await getAuthToken();
  const { filename, type } = getUploadFileInfo(uri);

  if (Platform.OS !== "web") {
    const file = new ExpoFile(uri);
    const result = await file.upload(`${API_BASE_URL}${path}`, {
      fieldName: "photo",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      httpMethod: "POST",
      mimeType: type,
      uploadType: UploadType.MULTIPART
    });

    return parseUploadResponse(result.status, result.body);
  }

  const blob = await fetch(uri).then((response) => response.blob());
  const formData = new FormData();
  formData.append("photo", blob, filename);

  const response = await fetchWithTimeout(`${API_BASE_URL}${path}`, {
    body: formData,
    headers: {
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    method: "POST"
  });

  return parseUploadResponse(response.status, await response.text());
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

export async function getPublicProfile(username: string) {
  const response = await fetchWithTimeout(`${API_BASE_URL}/users/${username}`, {
    headers: { Accept: "application/json" }
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error?.message || "User not found");
  }
  return data.data;
}
