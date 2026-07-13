import { NextAuthOptions, getServerSession } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

/** Normalise an email for case-insensitive comparison. */
function normalizeEmail(email?: string | null): string {
  return (email ?? '').trim().toLowerCase()
}

/** The single admin account (full access). */
export function isAdminEmail(email?: string | null): boolean {
  const admin = normalizeEmail(process.env.ADMIN_EMAIL)
  return admin.length > 0 && normalizeEmail(email) === admin
}

/**
 * Coach accounts (Personal Trainer, Ernährungsberater) — read-only access to
 * the coach dashboard only. Configured via COACH_EMAILS (comma-separated).
 */
export function getCoachEmails(): string[] {
  return (process.env.COACH_EMAILS ?? '')
    .split(',')
    .map((e) => normalizeEmail(e))
    .filter((e) => e.length > 0)
}

export function isCoachEmail(email?: string | null): boolean {
  const e = normalizeEmail(email)
  return e.length > 0 && getCoachEmails().includes(e)
}

/** Anyone allowed to view data: the admin or a coach. */
export function isViewerEmail(email?: string | null): boolean {
  return isAdminEmail(email) || isCoachEmail(email)
}

export type ViewerRole = 'admin' | 'coach'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      // Admin and configured coaches may sign in; everyone else is rejected.
      return isViewerEmail(user.email)
    },
    async session({ session }) {
      if (session.user) {
        const admin = isAdminEmail(session.user.email)
        session.user.isAdmin = admin
        session.user.isCoach = !admin && isCoachEmail(session.user.email)
        session.user.role = admin ? 'admin' : 'coach'
      }
      return session
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
}

export function getAuthSession() {
  return getServerSession(authOptions)
}

export async function requireAdmin() {
  const session = await getAuthSession()
  if (!session?.user?.isAdmin) {
    return null
  }
  return session
}

/**
 * Guard for read-only viewers: the admin OR a coach. Use in coach-facing
 * server components and API routes. Never grants write access on its own —
 * callers must not expose mutations behind this guard.
 */
export async function requireViewer() {
  const session = await getAuthSession()
  if (!session?.user || !isViewerEmail(session.user.email)) {
    return null
  }
  return session
}
