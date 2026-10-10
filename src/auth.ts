// src/auth.ts
// Login con GitHub (OAuth web flow) + sesión en cookie httpOnly firmada con JWT.
import { Router, type Request, type Response, type NextFunction } from 'express';
import * as crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from './db';

const SESSION_COOKIE = 'techrag_session';
const STATE_COOKIE = 'techrag_oauth_state';
const SESSION_DAYS = 30;

const appUrl = () => (process.env.APP_URL || 'http://localhost:5173').replace(/\/$/, '');
const isSecure = () => appUrl().startsWith('https://');

function jwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) throw new Error('JWT_SECRET falta o tiene menos de 32 caracteres');
  return secret;
}

export interface SessionUser { id: string; login: string }

export function isAdmin(login: string): boolean {
  return login.toLowerCase() === (process.env.ADMIN_GITHUB_LOGIN || '').toLowerCase();
}

function readCookie(req: Request, name: string): string | undefined {
  const match = (req.headers.cookie || '').split(';').map(c => c.trim()).find(c => c.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

function cookieOptions(maxAgeMs: number) {
  return { httpOnly: true, secure: isSecure(), sameSite: 'lax' as const, maxAge: maxAgeMs, path: '/' };
}

function getSessionUser(req: Request): SessionUser | null {
  const token = readCookie(req, SESSION_COOKIE);
  if (!token) return null;
  try {
    const payload = jwt.verify(token, jwtSecret()) as jwt.JwtPayload;
    return { id: payload.sub as string, login: payload.login as string };
  } catch {
    return null;
  }
}

/** Exige sesión. Deja el usuario en res.locals.user */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const user = getSessionUser(req);
  if (!user) return res.status(401).json({ error: 'Inicia sesión con GitHub para continuar' });
  res.locals.user = user;
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    if (!isAdmin(res.locals.user.login)) return res.status(403).json({ error: 'Solo el administrador puede hacer esto' });
    next();
  });
}

const router = Router();

router.get('/auth/github', (req, res) => {
  const state = crypto.randomBytes(16).toString('hex');
  res.cookie(STATE_COOKIE, state, cookieOptions(10 * 60 * 1000));
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID || '',
    redirect_uri: `${appUrl()}/auth/github/callback`,
    state,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params}`);
});

router.get('/auth/github/callback', async (req, res) => {
  const { code, state } = req.query;
  const expectedState = readCookie(req, STATE_COOKIE);
  res.clearCookie(STATE_COOKIE, { path: '/' });

  // state evita que un tercero nos haga iniciar sesión con SU cuenta (CSRF de login)
  if (typeof code !== 'string' || typeof state !== 'string' || !expectedState || state !== expectedState) {
    return res.redirect(`${appUrl()}/?error=auth`);
  }

  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${appUrl()}/auth/github/callback`,
      }),
    });
    const { access_token } = await tokenRes.json() as { access_token?: string };
    if (!access_token) throw new Error('GitHub no devolvió access_token');

    const ghRes = await fetch('https://api.github.com/user', {
      headers: { Authorization: `Bearer ${access_token}`, Accept: 'application/vnd.github+json' },
    });
    if (!ghRes.ok) throw new Error(`GitHub /user respondió ${ghRes.status}`);
    const gh = await ghRes.json() as { id: number; login: string; name: string | null; avatar_url: string };

    const profile = { login: gh.login, name: gh.name, avatarUrl: gh.avatar_url };
    const user = await prisma.user.upsert({
      where: { githubId: gh.id },
      update: profile,
      create: { githubId: gh.id, ...profile },
    });

    const token = jwt.sign({ login: user.login }, jwtSecret(), { subject: user.id, expiresIn: `${SESSION_DAYS}d` });
    res.cookie(SESSION_COOKIE, token, cookieOptions(SESSION_DAYS * 24 * 60 * 60 * 1000));
    res.redirect(`${appUrl()}/`);
  } catch (err) {
    console.error('Error en login con GitHub:', err);
    res.redirect(`${appUrl()}/?error=auth`);
  }
});

router.post('/auth/logout', (req, res) => {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
  res.json({ ok: true });
});

router.get('/api/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: res.locals.user.id } });
  if (!user) return res.status(401).json({ error: 'Sesión inválida' });
  res.json({ id: user.id, login: user.login, name: user.name, avatarUrl: user.avatarUrl, isAdmin: isAdmin(user.login) });
});

export default router;
