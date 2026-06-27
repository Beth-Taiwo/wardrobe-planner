import { createHmac, randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto"
import { promisify } from "node:util"
import type { H3Event } from "h3"
import { createError, deleteCookie, getCookie, getRequestURL, setCookie } from "h3"
import { prisma } from "./db"

const scryptAsync = promisify(scrypt)
const sessionCookieName = "wardrobe_session"
const oauthStateCookieName = "wardrobe_oauth_state"
const sessionDurationMs = 1000 * 60 * 60 * 24 * 30

export interface PublicUser {
  id: string
  email: string
  displayName: string | null
  hasPassword: boolean
  linkedProviders: string[]
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function hashPassword(password: string) {
  const salt = randomUUID().replace(/-/g, "")
  const derived = (await scryptAsync(password, salt, 64)) as Buffer
  return "scrypt:" + salt + ":" + derived.toString("hex")
}

export async function verifyPassword(password: string, storedHash: string | null | undefined) {
  if (!storedHash) {
    return false
  }

  const [scheme, salt, hash] = storedHash.split(":")
  if (scheme !== "scrypt" || !salt || !hash) {
    return false
  }

  const expected = Buffer.from(hash, "hex")
  const actual = (await scryptAsync(password, salt, expected.length)) as Buffer
  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

export function hashToken(token: string) {
  return createHmac("sha256", getSessionSecret()).update(token).digest("hex")
}

function getSessionSecret() {
  if (process.env.AUTH_SESSION_SECRET) {
    return process.env.AUTH_SESSION_SECRET
  }

  if (process.env.NODE_ENV === "production") {
    throw createError({ statusCode: 500, statusMessage: "AUTH_SESSION_SECRET is not configured." })
  }

  return "local-development-session-secret"
}

export function generateToken() {
  const bytes = new Uint8Array(32)
  return randomBytes(bytes.length).toString("base64url")
}

export function publicUser(user: {
  id: string
  email: string
  displayName: string | null
  passwordHash: string | null
  oauthAccounts?: Array<{ provider: string }>
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    hasPassword: Boolean(user.passwordHash),
    linkedProviders: [...new Set((user.oauthAccounts || []).map((account) => account.provider))]
  }
}

export async function createSession(event: H3Event, userId: string) {
  const token = generateToken()
  const expiresAt = new Date(Date.now() + sessionDurationMs)

  await prisma.session.create({
    data: {
      id: randomUUID(),
      tokenHash: hashToken(token),
      userId,
      expiresAt
    }
  })

  setCookie(event, sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt
  })
}

export async function clearAuthSession(event: H3Event) {
  const token = getCookie(event, sessionCookieName)
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } })
  }

  deleteCookie(event, sessionCookieName, { path: "/" })
}

export async function getCurrentUser(event: H3Event) {
  const token = getCookie(event, sessionCookieName)
  if (!token) {
    return null
  }

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: { oauthAccounts: { select: { provider: true } } }
      }
    }
  })

  if (!session || session.expiresAt <= new Date()) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } })
    deleteCookie(event, sessionCookieName, { path: "/" })
    return null
  }

  return publicUser(session.user)
}

export async function requireUser(event: H3Event) {
  const user = await getCurrentUser(event)
  if (!user) {
    throw createError({ statusCode: 401, statusMessage: "Authentication required." })
  }

  return user
}

export function setOAuthState(event: H3Event) {
  const state = generateToken()
  setCookie(event, oauthStateCookieName, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600
  })
  return state
}

export function verifyOAuthState(event: H3Event, state: string) {
  const expected = getCookie(event, oauthStateCookieName)
  deleteCookie(event, oauthStateCookieName, { path: "/" })
  return Boolean(expected && state && expected === state)
}

// Only allow same-origin redirects (paths), never external URLs. Requires a single leading slash
// not followed by another slash or a backslash — both "//evil.com" and "/\evil.com" are treated as
// protocol-relative (→ external) by some browsers, so they are rejected.
export function safeInternalPath(path: unknown, fallback = "/home") {
  if (typeof path !== "string" || !/^\/(?![/\\])/.test(path)) {
    return fallback
  }
  return path
}

// The OAuth `state` carries both the CSRF token and the intended redirect, so the callback can
// return the user to where they started. The CSRF token (base64url, no ".") stays comparable to
// the cookie; the redirect is appended after a "." as base64url.
export function encodeOAuthState(csrf: string, redirect: string) {
  return csrf + "." + Buffer.from(redirect, "utf8").toString("base64url")
}

export function decodeOAuthState(state: string): { csrf: string, redirect: string } {
  const dot = state.indexOf(".")
  if (dot === -1) {
    return { csrf: state, redirect: "/home" }
  }

  let redirect = "/home"
  try {
    redirect = Buffer.from(state.slice(dot + 1), "base64url").toString("utf8")
  } catch {
    redirect = "/home"
  }

  return { csrf: state.slice(0, dot), redirect }
}

export function getGoogleRedirectUri(event: H3Event) {
  if (process.env.GOOGLE_REDIRECT_URI) {
    return process.env.GOOGLE_REDIRECT_URI
  }

  const url = getRequestURL(event)
  return url.origin + "/api/auth/google/callback"
}
