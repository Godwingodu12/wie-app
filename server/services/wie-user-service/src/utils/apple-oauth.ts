import * as appleSignin from "apple-signin-auth";
import type { AppleIdTokenType } from "apple-signin-auth";
import jwt from "jsonwebtoken";

const getEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
};

const getPrivateKey = (): string =>
  getEnvVar("APPLE_PRIVATE_KEY").replace(/\\n/g, "\n");

export interface AppleUserInfo {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
}

interface AppleTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  id_token: string;
}

// Extend the library's own type to fix exp: string → number mismatch
interface AppleIdTokenPayload extends Omit<
  AppleIdTokenType,
  "exp" | "email_verified"
> {
  exp: number;
  email_verified?: boolean | string;
}

/** Generate Apple client_secret JWT (valid 6 months max) */
const generateClientSecret = (): string => {
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: getEnvVar("APPLE_TEAM_ID"),
    iat: now,
    exp: now + 15777000, // ~6 months
    aud: "https://appleid.apple.com",
    sub: getEnvVar("APPLE_CLIENT_ID"),
  };

  return jwt.sign(payload, getPrivateKey(), {
    algorithm: "ES256",
    keyid: getEnvVar("APPLE_KEY_ID"),
  });
};

export const getAppleAuthUrl = (): string => {
  const params = new URLSearchParams({
    client_id: getEnvVar("APPLE_CLIENT_ID"),
    redirect_uri: getEnvVar("APPLE_REDIRECT_URI"),
    response_type: "code",
    scope: "name email",
    response_mode: "form_post",
    state: crypto.randomUUID(),
  });

  return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
};

export const getAppleUserInfo = async (
  code: string,
  userPayload?: string,
): Promise<AppleUserInfo> => {
  const clientSecret = generateClientSecret();

  // Exchange code for tokens
  const tokenResponse = await fetch("https://appleid.apple.com/auth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: getEnvVar("APPLE_CLIENT_ID"),
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: getEnvVar("APPLE_REDIRECT_URI"),
    }).toString(),
  });

  if (!tokenResponse.ok) {
    const err = await tokenResponse.text();
    throw new Error(`Apple token exchange failed: ${err}`);
  }

  const tokenData = (await tokenResponse.json()) as AppleTokenResponse;

  // Verify and decode the id_token.
  // Cast via unknown: the library types exp as string but JWT spec (and runtime) gives number.
  const idToken = (await appleSignin.verifyIdToken(tokenData.id_token, {
    audience: getEnvVar("APPLE_CLIENT_ID"),
    ignoreExpiration: false,
  })) as unknown as AppleIdTokenPayload;

  // Apple only sends name on the very first auth — parse if present
  let name = "Apple User";
  if (userPayload) {
    try {
      const parsedUser = JSON.parse(userPayload);
      if (parsedUser?.name) {
        const { firstName = "", lastName = "" } = parsedUser.name;
        name = `${firstName} ${lastName}`.trim() || "Apple User";
      }
    } catch (_) {}
  }

  return {
    id: idToken.sub,
    email: idToken.email || "",
    name,
    emailVerified:
      idToken.email_verified === true || idToken.email_verified === "true",
  };
};
