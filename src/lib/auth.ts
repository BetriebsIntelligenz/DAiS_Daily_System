import { createHmac, timingSafeEqual } from "crypto";

export const SESSION_COOKIE_NAME = "dais_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 12;

interface AuthRecord {
  username: string;
  password: string;
  enterCodes: string[];
  user: SessionUser;
}

export interface SessionUser {
  username: string;
  name: string;
  email: string;
}

interface SessionPayload extends SessionUser {
  exp: number;
}

const AUTH_SECRET = process.env.AUTH_SECRET ?? "dais-local-dev-secret-change-me";

const AUTH_USERS: AuthRecord[] = [
  {
    username: "admin",
    password: "admin100",
    enterCodes: ["admin100"],
    user: {
      username: "admin",
      name: "admin",
      email: "admin@dais.app"
    }
  }
];

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padding = normalized.length % 4;
  const withPadding =
    padding === 0 ? normalized : normalized + "=".repeat(4 - padding);
  return Buffer.from(withPadding, "base64").toString("utf8");
}

function signPayload(payloadBase64: string) {
  return createHmac("sha256", AUTH_SECRET).update(payloadBase64).digest("base64url");
}

function getUserByUsername(username: string) {
  return AUTH_USERS.find((entry) => entry.username === username.toLowerCase()) ?? null;
}

export function authenticateByCredentials(input: {
  username: string;
  password: string;
}) {
  const username = input.username.trim().toLowerCase();
  if (!username || !input.password) return null;
  const candidate = getUserByUsername(username);
  if (!candidate || candidate.password !== input.password) {
    return null;
  }
  return candidate.user;
}

export function authenticateByEnterCode(enterCode: string) {
  const code = enterCode.trim();
  if (!code) return null;
  const candidate = AUTH_USERS.find((entry) => entry.enterCodes.includes(code));
  return candidate?.user ?? null;
}

export function createSessionToken(user: SessionUser) {
  const payload: SessionPayload = {
    username: user.username,
    name: user.name,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS
  };
  const payloadBase64 = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token: string) {
  const [payloadBase64, signature] = token.split(".");
  if (!payloadBase64 || !signature) return null;

  const expectedSignature = signPayload(payloadBase64);
  const providedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }
  if (!timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const decoded = JSON.parse(base64UrlDecode(payloadBase64)) as Partial<SessionPayload>;
    if (
      typeof decoded.username !== "string" ||
      typeof decoded.exp !== "number" ||
      decoded.exp < Math.floor(Date.now() / 1000)
    ) {
      return null;
    }
    const user = getUserByUsername(decoded.username);
    return user?.user ?? null;
  } catch {
    return null;
  }
}
