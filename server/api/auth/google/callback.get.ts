import { createSession, getGoogleRedirectUri, normalizeEmail, verifyOAuthState } from "../../../utils/auth"
import { prisma } from "../../../utils/db"

interface GoogleTokenResponse {
  access_token?: string
  error?: string
}

interface GoogleUserInfo {
  sub: string
  email: string
  email_verified: boolean
  name?: string
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const code = typeof query.code === "string" ? query.code : ""
  const state = typeof query.state === "string" ? query.state : ""

  if (!code || !verifyOAuthState(event, state)) {
    throw createError({ statusCode: 400, statusMessage: "Invalid Google sign-in response." })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET
  const redirectUri = getGoogleRedirectUri(event)

  if (!clientId || !clientSecret) {
    throw createError({ statusCode: 500, statusMessage: "Google OAuth is not configured." })
  }

  const tokenResponse = await $fetch<GoogleTokenResponse>("https://oauth2.googleapis.com/token", {
    method: "POST",
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code"
    }).toString(),
    headers: { "content-type": "application/x-www-form-urlencoded" }
  })

  if (!tokenResponse.access_token) {
    throw createError({ statusCode: 401, statusMessage: "Google sign-in failed." })
  }

  const profile = await $fetch<GoogleUserInfo>("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: "Bearer " + tokenResponse.access_token }
  })

  if (!profile.email || !profile.email_verified) {
    throw createError({ statusCode: 401, statusMessage: "Google email must be verified." })
  }

  const normalizedEmail = normalizeEmail(profile.email)
  const user = await prisma.$transaction(async (tx) => {
    const linked = await tx.oAuthAccount.findUnique({
      where: { provider_providerAccountId: { provider: "google", providerAccountId: profile.sub } },
      include: { user: { include: { oauthAccounts: { select: { provider: true } } } } }
    })

    if (linked) {
      return linked.user
    }

    const existing = await tx.user.findUnique({ where: { normalizedEmail } })
    const accountUser = existing || await tx.user.create({
      data: {
        id: crypto.randomUUID(),
        email: profile.email,
        normalizedEmail,
        displayName: profile.name || null
      }
    })

    await tx.oAuthAccount.create({
      data: {
        id: crypto.randomUUID(),
        provider: "google",
        providerAccountId: profile.sub,
        userId: accountUser.id,
        providerEmail: profile.email,
        emailVerified: profile.email_verified
      }
    })

    return tx.user.findUniqueOrThrow({
      where: { id: accountUser.id },
      include: { oauthAccounts: { select: { provider: true } } }
    })
  })

  await createSession(event, user.id)
  return sendRedirect(event, "/home")
})
