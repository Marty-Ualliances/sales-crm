import { Router, Request, Response, CookieOptions } from 'express';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import AuditLog from '../models/AuditLog';
import { auth, AuthRequest } from '../middleware/auth';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../services/email';

const router = Router();

import { env } from '../config/env';

const IS_PROD = env.NODE_ENV === 'production';

function getCookieOptions(): { base: CookieOptions; refreshPath: string; backupPath: string } {
  const configuredSameSite = env.COOKIE_SAMESITE as ('lax' | 'strict' | 'none' | undefined);
  const sameSite = configuredSameSite || (IS_PROD ? 'none' : 'lax');
  const secure = IS_PROD || sameSite === 'none';
  const domain = env.COOKIE_DOMAIN?.trim() || undefined;

  const base: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite,
    ...(domain ? { domain } : {}),
  };

  return {
    base,
    refreshPath: '/api/auth/refresh',
    backupPath: '/api/auth/exit-impersonation',
  };
}

function getJwtSecret(): string {
  const s = env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not configured');
  return s;
}

function getRefreshSecret(): string {
  if (env.JWT_REFRESH_SECRET) return env.JWT_REFRESH_SECRET;
  // Derive via HMAC to maintain cryptographic isolation from the primary secret
  return crypto.createHmac('sha256', env.JWT_SECRET).update('refresh_token_secret').digest('hex');
}

/** Set both httpOnly cookies: access (15 min) + refresh (7 days) */
function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const { base, refreshPath } = getCookieOptions();

  res.cookie('insurelead_access', accessToken, {
    ...base,
    maxAge: 15 * 60 * 1000,          // 15 minutes
    path: '/',
  });

  res.cookie('insurelead_refresh', refreshToken, {
    ...base,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: refreshPath,
  });
}

function clearAuthCookies(res: Response) {
  const { base, refreshPath } = getCookieOptions();
  res.clearCookie('insurelead_access', { ...base, path: '/' });
  res.clearCookie('insurelead_refresh', { ...base, path: refreshPath });
}

const BACKUP_SECRET_SUFFIX = '_admin_backup';

function getAdminBackupSecret(): string {
  return crypto.createHmac('sha256', getJwtSecret()).update('admin_backup_secret').digest('hex');
}

function setAdminBackupCookie(res: Response, adminId: string, adminEmail: string) {
  const { base, backupPath } = getCookieOptions();
  const token = jwt.sign(
    { adminId, adminEmail },
    getAdminBackupSecret(),
    { expiresIn: '2h' },
  );
  res.cookie('insurelead_admin_backup', token, {
    ...base,
    maxAge: 2 * 60 * 60 * 1000, // 2 hours
    path: backupPath,
  });
}

function clearAdminBackupCookie(res: Response) {
  const { base, backupPath } = getCookieOptions();
  res.clearCookie('insurelead_admin_backup', { ...base, path: backupPath });
}

function issueTokenPair(payload: { id: string; role: string; email: string; name?: string; team?: string; tokenVersion?: number; impersonatedBy?: string }) {
  const accessToken = jwt.sign(payload, getJwtSecret(), { expiresIn: '15m' });
  const refreshToken = jwt.sign({ id: payload.id, tokenVersion: payload.tokenVersion ?? 0 }, getRefreshSecret(), { expiresIn: '7d' });
  return { accessToken, refreshToken };
}

function validatePasswordFormat(password: string): boolean {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  return true;
}


// ─── POST /api/auth/login ────────────────────────────────────────────────────
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });
    if (!user) {
      console.warn(`[LOGIN] No user found for email: ${trimmedEmail}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.lockUntil && user.lockUntil > new Date()) {
      const waitMinutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return res.status(401).json({ error: `Account locked. Try again in ${waitMinutes} minutes.` });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts += 1;
      if (user.failedLoginAttempts >= 10) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();
      console.warn(`[LOGIN] Password mismatch for email: ${trimmedEmail}`);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    console.log(`[LOGIN] Successful login for: ${trimmedEmail} (role: ${user.role})`);

    const { accessToken, refreshToken } = issueTokenPair({
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      team: user.team?.toString(),
      tokenVersion: user.tokenVersion || 0,
    });

    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    user.refreshTokens.push(refreshHash);
    await user.save();

    setAuthCookies(res, accessToken, refreshToken);
    res.json({ user: user.toJSON() });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/auth/logout ───────────────────────────────────────────────────
router.post('/logout', async (req: Request, res: Response) => {
  const refreshToken = (req as any).cookies?.insurelead_refresh;
  if (refreshToken) {
    try {
      const payload = jwt.verify(refreshToken, getRefreshSecret()) as { id: string };
      const user = await User.findById(payload.id);
      if (user) {
        const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
        user.refreshTokens = user.refreshTokens.filter(t => t !== refreshHash);
        await user.save();
      }
    } catch (e) { /* ignore expired token on logout */ }
  }
  clearAuthCookies(res);
  res.json({ message: 'Logged out' });
});

// ─── POST /api/auth/logout-all ───────────────────────────────────────────────
router.post('/logout-all', auth, async (req: AuthRequest, res: Response) => {
  try {
    const user = await User.findById(req.user!.id);
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }
    clearAuthCookies(res);
    res.json({ message: 'Logged out from all devices' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/auth/refresh ──────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = (req as any).cookies?.insurelead_refresh;
    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    let payload: { id: string; tokenVersion?: number };
    try {
      payload = jwt.verify(refreshToken, getRefreshSecret()) as { id: string; tokenVersion?: number };
    } catch {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Refresh token expired' });
    }

    const user = await User.findById(payload.id);
    if (!user) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'User not found' });
    }

    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const tokenIndex = user.refreshTokens.indexOf(refreshHash);
    if (tokenIndex === -1) {
      user.refreshTokens = [];
      await user.save();
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Refresh token reuse detected' });
    }
    user.refreshTokens.splice(tokenIndex, 1);

    // Validate tokenVersion — reject if password was changed after token was issued
    const currentVersion = user.tokenVersion || 0;
    if (payload.tokenVersion !== undefined && payload.tokenVersion !== currentVersion) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Token invalidated by password change' });
    }

    const { accessToken, refreshToken: newRefresh } = issueTokenPair({
      id: user._id.toString(),
      role: user.role,
      email: user.email,
      name: user.name,
      team: user.team?.toString(),
      tokenVersion: currentVersion,
    });

    const newRefreshHash = crypto.createHash('sha256').update(newRefresh).digest('hex');
    user.refreshTokens.push(newRefreshHash);
    await user.save();

    setAuthCookies(res, accessToken, newRefresh);
    res.json({ user: user.toJSON() });
  } catch (err) {
    console.error('Refresh error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── GET /api/auth/me ────────────────────────────────────────────────────────
router.get('/me', auth, async (req: AuthRequest, res: Response) => {
  try {
    // Explicit projection to avoid leaking sensitive fields even if toJSON hook changes
    const user = await User.findById(req.user!.id)
      .select('-password -resetTokenHash -resetTokenExpiry -__v')
      .populate('team', 'name description');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user.toJSON());
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/auth/impersonate ──────────────────────────────────────────────
router.post('/impersonate', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const target = await User.findById(userId);
    if (!target) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Audit log
    await AuditLog.create({
      action: 'impersonate',
      adminId: req.user.id,
      adminEmail: req.user.email,
      targetId: target._id.toString(),
      targetEmail: target.email,
      targetRole: target.role,
      ip: req.ip,
      timestamp: new Date(),
    });

    // Store admin identity in a backup cookie so exit-impersonation can
    // restore the session without forcing re-login.
    setAdminBackupCookie(res, req.user.id, req.user.email);

    // Issue ONLY an access token for impersonation — no refresh token.
    // This limits impersonation sessions to the access token lifetime (15 min)
    // and prevents persistent impersonation via refresh.
    const accessToken = jwt.sign(
      {
        id: target._id.toString(),
        role: target.role,
        email: target.email,
        name: target.name,
        impersonatedBy: req.user.email,
      },
      getJwtSecret(),
      { expiresIn: '15m' },
    );

    // Set only the access cookie, clear any existing refresh cookie
    const { base } = getCookieOptions();
    res.cookie('insurelead_access', accessToken, {
      ...base,
      maxAge: 15 * 60 * 1000,
      path: '/',
    });
    const { refreshPath } = getCookieOptions();
    res.clearCookie('insurelead_refresh', { ...base, path: refreshPath });

    res.json({ user: target.toJSON(), impersonatedBy: req.user.email });
  } catch (err) {
    console.error('Impersonate error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/auth/exit-impersonation ───────────────────────────────────────
router.post('/exit-impersonation', async (req: Request, res: Response) => {
  try {
    const backupToken = (req as any).cookies?.insurelead_admin_backup;
    if (!backupToken) {
      return res.status(401).json({ error: 'No impersonation session found' });
    }

    let payload: { adminId: string; adminEmail: string };
    try {
      payload = jwt.verify(backupToken, getAdminBackupSecret()) as {
        adminId: string;
        adminEmail: string;
      };
    } catch {
      clearAdminBackupCookie(res);
      return res.status(401).json({ error: 'Impersonation session expired — please log in again' });
    }

    const admin = await User.findById(payload.adminId);
    if (!admin || admin.role !== 'admin') {
      clearAdminBackupCookie(res);
      return res.status(401).json({ error: 'Admin account not found' });
    }

    const { accessToken, refreshToken } = issueTokenPair({
      id: admin._id.toString(),
      role: admin.role,
      email: admin.email,
      name: admin.name,
      tokenVersion: admin.tokenVersion || 0,
    });

    // Store the refresh token hash so the next /refresh call succeeds
    const crypto = await import('crypto');
    const refreshHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    admin.refreshTokens.push(refreshHash);
    // Cap stored tokens to prevent unbounded array growth
    if (admin.refreshTokens.length > 10) {
      admin.refreshTokens = admin.refreshTokens.slice(-10);
    }
    await admin.save();

    setAuthCookies(res, accessToken, refreshToken);
    clearAdminBackupCookie(res);
    res.json({ user: admin.toJSON() });
  } catch (err) {
    console.error('Exit impersonation error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/auth/register (admin-only) ────────────────────────────────────
router.post('/register', auth, async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { name, email, role, avatar } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'name, email, and role are required' });
    }

    const VALID_ROLES = ['admin', 'lead_gen', 'sdr', 'closer', 'manager', 'hr'];
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const existing = await User.findOne({ email: String(email).trim().toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'A user with that email already exists' });
    }

    // Generate a temporary password
    const tempPassword = crypto.randomBytes(10).toString('base64url').slice(0, 14);

    const newUser = new User({
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      password: tempPassword,
      role,
      avatar: avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    });
    await newUser.save();

    // Send welcome email (fire-and-forget)
    sendWelcomeEmail(newUser.email, newUser.name, tempPassword, role).catch((e) =>
      console.error('Welcome email failed:', e)
    );

    res.status(201).json({ user: newUser.toJSON() });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: trimmedEmail });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Generate plain token, store its SHA-256 hash
    const plainToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');

    user.resetTokenHash = tokenHash;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await user.save();

    sendPasswordResetEmail(user.email, user.name, plainToken).catch((e) =>
      console.error('Reset email failed:', e)
    );

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/auth/reset-password ───────────────────────────────────────────
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (!validatePasswordFormat(String(password))) {
      return res.status(400).json({ error: 'Password must be at least 8 characters and include uppercase, lowercase, and a number' });
    }

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');

    const user = await User.findOne({
      resetTokenHash: tokenHash,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    user.password = password;
    // Clear token immediately
    user.resetTokenHash = undefined;
    user.resetTokenExpiry = undefined;
    await user.save(); // pre-save hook hashes password

    res.json({ message: 'Password has been reset. You can now log in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ─── POST /api/auth/change-password (authenticated) ──────────────────────────
router.post('/change-password', auth, async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (!validatePasswordFormat(String(newPassword))) {
      return res.status(400).json({ error: 'New password must be at least 8 characters and include uppercase, lowercase, and a number' });
    }

    const user = await User.findById(req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
