import { setOAuthState } from "../../../utils/auth"

export default defineEventHandler((event) => {
  const clientId = process.env.GOOGLE_CLIENT_ID
  const redirectUri = process.env.GOOGLE_REDIRECT_URI

  if (!clientId || !redirectUri) {
    throw createError({ statusCode: 500, statusMessage: "Google OAuth is not configured." })
  }

  const state = setOAuthState(event)
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth")
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("redirect_uri", redirectUri)
  url.searchParams.set("response_type", "code")
  url.searchParams.set("scope", "openid email profile")
  url.searchParams.set("state", state)
  url.searchParams.set("prompt", "select_account")

  return sendRedirect(event, url.toString())
})
