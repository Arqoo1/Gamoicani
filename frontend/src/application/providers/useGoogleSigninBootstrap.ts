import { GoogleSignin } from "@react-native-google-signin/google-signin";

import { getGoogleWebClientId } from "@/shared/config/env";

let googleSigninConfigured = false;

export function configureGoogleSignin() {
  if (googleSigninConfigured) return;

  GoogleSignin.configure({
    webClientId: getGoogleWebClientId() || "",
  });

  googleSigninConfigured = true;
}

export function useGoogleSigninBootstrap() {
  configureGoogleSignin();
}
