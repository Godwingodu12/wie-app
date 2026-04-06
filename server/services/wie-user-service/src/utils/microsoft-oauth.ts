const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID!;
const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET!;
const MICROSOFT_REDIRECT_URI = process.env.MICROSOFT_REDIRECT_URI!;

if (
  !MICROSOFT_CLIENT_ID ||
  !MICROSOFT_CLIENT_SECRET ||
  !MICROSOFT_REDIRECT_URI
) {
  throw new Error("Microsoft OAuth environment variables are not set");
}

export interface MicrosoftUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface MicrosoftTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  id_token?: string;
}

interface MicrosoftGraphUser {
  id: string;
  displayName?: string;
  mail?: string;
  userPrincipalName?: string;
}

export const getMicrosoftAuthUrl = (isMobile = false): string => {
  const params = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    response_type: "code",
    redirect_uri: MICROSOFT_REDIRECT_URI,
    response_mode: "query",
    scope: "openid profile email User.Read",
    // Encode mobile flag inside state so it survives the redirect
    state: JSON.stringify({ id: crypto.randomUUID(), mobile: isMobile }),
  });

  return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
};

export const getMicrosoftUserInfo = async (
  code: string,
): Promise<MicrosoftUserInfo> => {
  // Exchange code for tokens
  const tokenBody = new URLSearchParams({
    client_id: MICROSOFT_CLIENT_ID,
    client_secret: MICROSOFT_CLIENT_SECRET,
    code,
    grant_type: "authorization_code",
    redirect_uri: MICROSOFT_REDIRECT_URI,
    scope: "openid profile email User.Read",
  });

  const tokenResponse = await fetch(
    "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody.toString(),
    },
  );

  const tokenData = (await tokenResponse.json()) as MicrosoftTokenResponse;

  if (!tokenResponse.ok) {
    // Log the FULL error from Microsoft so we know exactly what's wrong
    console.error(
      "[MS OAuth] Token exchange FAILED:",
      JSON.stringify(tokenData, null, 2),
    );
    throw new Error(
      `Microsoft token exchange failed: ${(tokenData as any).error} — ${(tokenData as any).error_description}`,
    );
  }

  // Fetch user profile
  const userResponse = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  });

  if (!userResponse.ok) {
    const userErr = await userResponse.text();
    console.error("[MS OAuth] Graph API FAILED:", userErr);
    throw new Error("Failed to fetch Microsoft user profile");
  }

  const msUser = (await userResponse.json()) as MicrosoftGraphUser;
  // Try to fetch profile photo (optional — fails gracefully)
  let picture: string | undefined;
  try {
    const photoRes = await fetch(
      "https://graph.microsoft.com/v1.0/me/photo/$value",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      },
    );
    if (photoRes.ok) {
      const blob = await photoRes.arrayBuffer();
      const base64 = Buffer.from(blob).toString("base64");
      picture = `data:image/jpeg;base64,${base64}`;
    }
  } catch (_) {
    // Photo is optional
  }

  return {
    id: msUser.id,
    email: msUser.mail || msUser.userPrincipalName || "",
    name: msUser.displayName || "Microsoft User",
    picture,
  };
};
