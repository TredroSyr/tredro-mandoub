import { jwtDecode } from "jwt-decode";
import { AuthUser } from "../types";

interface JWTPayload extends AuthUser {
  exp: number;
}

export const decodeToken = (token: string): JWTPayload | null => {
  try {
    return jwtDecode<JWTPayload>(token);
  } catch (error) {
    console.error("❌ Error decoding token:", error);
    return null;
  }
};

export const isTokenExpired = (
  token: string,
  bufferSeconds: number = 60,
): boolean => {
  if (!token) {
    return true;
  }

  try {
    const { exp } = jwtDecode<{ exp: number }>(token);

    if (!exp) {
      return true;
    }

    const currentTime = Date.now();
    const expiryTime = exp * 1000;
    const remainingMs = expiryTime - currentTime;
    const remainingSec = Math.floor(remainingMs / 1000);

    return remainingSec <= bufferSeconds;
  } catch (error) {
    console.error("❌ Error decoding token:", error);
    return true;
  }
};

export const getTokenRemainingTime = (token: string): number => {
  if (!token) {
    return 0;
  }

  try {
    const { exp } = jwtDecode<{ exp: number }>(token);

    if (!exp) {
      return 0;
    }

    const currentTime = Date.now();
    const expiryTime = exp * 1000;
    const remainingSec = Math.floor((expiryTime - currentTime) / 1000);

    return Math.max(0, remainingSec);
  } catch (error) {
    console.error("❌ Error getting token remaining time:", error);
    return 0;
  }
};

export const shouldRefreshToken = (token: string): boolean => {
  const remainingTime = getTokenRemainingTime(token);

  // Refresh if less than 5 minutes remaining
  const refreshThreshold = 5 * 60;
  return remainingTime > 0 && remainingTime <= refreshThreshold;
};

export const getTokenStatus = (token: string) => {
  if (!token) {
    return {
      isValid: false,
      isExpired: true,
      shouldRefresh: false,
      remainingSeconds: 0,
      remainingMinutes: 0,
    };
  }

  const remainingSeconds = getTokenRemainingTime(token);
  const remainingMinutes = Math.floor(remainingSeconds / 60);
  const isExpired = isTokenExpired(token);
  const shouldRefresh = shouldRefreshToken(token);

  return {
    isValid: remainingSeconds > 0,
    isExpired,
    shouldRefresh,
    remainingSeconds,
    remainingMinutes,
  };
};
