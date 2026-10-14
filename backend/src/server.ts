import express, { type NextFunction, type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pg from 'pg';
import { z } from 'zod';
import {
  constantTimeTextEqual, createSessionToken, hashPassword, hashSessionToken, normalizeEmail,
  SESSION_TTL_MS, verifyPassword,
} from './security.js';

const { Pool } = pg;
const app = express();
const port = Number(process.env.PORT || 4000);
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL is required. Copy backend/.env.example to backend/.env and configure PostgreSQL.');
  process.exit(1);
}
const pool = new Pool({ connectionString: databaseUrl, max: 10, connectionTimeoutMillis: 5000 });
const cookieName = 'procura_session';
const cookieSecure = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
const frontendOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';

type Role = 'Platform Admin' | 'Organization Admin' | 'Request Officer' | 'Department Head' | 'Procurement Officer' | 'Finance Officer' | 'Approving Authority' | 'Vendor';
type SessionUser = { id: string; organizationId: string | null; departmentId: string | null; fullName: string; email: string; role: Role; status: string; mustChangePassword: boolean };
declare global {
  namespace Express { interface Request { user?: SessionUser; sessionId?: string } }
}

app.disable('x-powered-by');
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: frontendOrigin, credentials: true, methods: ['GET','POST','PATCH','DELETE','OPTIONS'], allowedHeaders: ['Content-Type'] }));
app.use(express.json({ limit: '1mb' }));

function setSessionCookie(res: Response, token: string, expires: Date) {
  const parts = [
    `${cookieName}=${token}`, 'HttpOnly', 'SameSite=Lax', 'Path=/',
    `Expires=${expires.toUTCString()}`, 'Max-Age=43200',
  ];
  if (cookieSecure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}
function clearSessionCookie(res: Response) {
  const parts = [`${cookieName}=`, 'HttpOnly', 'SameSite=Lax', 'Path=/', 'Max-Age=0'];
  if (cookieSecure) parts.push('Secure');
  res.setHeader('Set-Cookie', parts.join('; '));
}
function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const [key, ...value] = part.trim().split('=');
    if (key === name) return value.join('=');
  }
  return undefined;
}
function publicUser(row: Record<string, unknown>): SessionUser {
  return {
    id: String(row.id), organizationId: row.organization_id ? String(row.organization_id) : null,
    departmentId: row.department_id ? String(row.department_id) : null,
    fullName: String(row.full_name), email: String(row.email), role: row.role as Role,
    status: String(row.status), mustChangePassword: Boolean(row.must_change_password),
  };
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected', service: 'procura-api' });
  } catch {
    res.status(503).json({ status: 'unavailable', database: 'disconnected' });
  }
});

app.use('/api', async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = readCookie(req, cookieName);
    if (!token) return next();
    const result = await pool.query(
      `SELECT s.id AS session_id, u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now() AND u.status = 'active' LIMIT 1`,
      [hashSessionToken(token)],
    );
    if (result.rowCount) {
      req.user = publicUser(result.rows[0]);
      req.sessionId = String(result.rows[0].session_id);
      void pool.query('UPDATE sessions SET last_seen_at = now() WHERE id = $1', [req.sessionId]).catch(() => {});
    }
    return next();
  } catch (error) { return next(error); }
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  return next();
}
function allowRoles(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Your role is not permitted to perform this action.' });
    return next();
  };
}
function requireOrganization(req: Request, res: Response, next: NextFunction) {
  if (!req.user?.organizationId) return res.status(403).json({ error: 'This action requires an organization account.' });
  return next();
}

const loginSchema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) });
const registerSchema = z.object({
  organization: z.object({
    name: z.string().trim().min(2).max(160),
    type: z.enum(['sole_proprietorship','enterprise','mega_corporation']),
    industry: z.string().trim().min(2).max(120),
    address: z.string().trim().min(3).max(300),
    phone: z.string().trim().min(5).max(40),
    email: z.string().email().max(254),
    currency: z.string().length(3).default('NGN'),
  }),
  admin: z.object({
    fullName: z.string().trim().min(2).max(120),
    email: z.string().email().max(254),
    phone: z.string().trim().min(5).max(40),
    password: z.string().min(8).max(200),
  }),
});
const staffSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().email().max(254),
  phone: z.string().trim().max(40).default(''),
  role: z.enum(['Request Officer','Department Head','Procurement Officer','Finance Officer','Approving Authority']),
  departmentId: z.string().uuid().optional(),
  temporaryPassword: z.string().min(8).max(200),
});
const recordSchema = z.object({
  recordType: z.enum(['request','tender','bid','purchase_order','delivery','payment','vendor','award','notification']),
  referenceNumber: z.string().trim().max(100).nullable().optional(),
  status: z.string().trim().min(1).max(80).default('Draft'),
  data: z.record(z.string(), z.unknown()).default({}),
});


const bootstrapSchema = z.object({
  bootstrapKey: z.string().min(24).max(256),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().email().max(254),
  password: z.string().min(12).max(200),
});

// Bootstrap is intentionally disabled unless a high-entropy secret is configured at deployment.
// Remove BOOTSTRAP_ADMIN_KEY after the first platform administrator has been created.
app.post('/api/admin/bootstrap', async (req, res, next) => {
  const configuredKey = process.env.BOOTSTRAP_ADMIN_KEY;
  if (!configuredKey || configuredKey.length < 24) {
    return res.status(404).json({ error: 'Bootstrap is not enabled.' });
  }
  const parsed = bootstrapSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid bootstrap details.', issues: parsed.error.issues });
  if (!constantTimeTextEqual(parsed.data.bootstrapKey, configuredKey)) {
    return res.status(403).json({ error: 'Invalid bootstrap key.' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query("SELECT 1 FROM users WHERE role = 'Platform Admin' LIMIT 1");
    if (existing.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'A platform administrator has already been created. Disable bootstrap now.' });
    }
    const hashed = await hashPassword(parsed.data.password);
    const created = await client.query(
      `INSERT INTO users(organization_id,full_name,email,password_hash,role,status)
       VALUES(NULL,$1,$2,$3,'Platform Admin','active')
       RETURNING id,organization_id,department_id,full_name,email,phone,role,status,must_change_password`,
      [parsed.data.fullName,normalizeEmail(parsed.data.email),hashed],
    );
    await client.query('COMMIT');
    return res.status(201).json({ user: publicUser(created.rows[0]), message: 'Platform administrator created. Remove BOOTSTRAP_ADMIN_KEY from the environment.' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally { client.release(); }
});

app.post('/api/admin/organizations/:organizationId/approve', requireAuth, allowRoles('Platform Admin'), async (req, res, next) => {
  const organizationId = z.string().uuid().safeParse(req.params.organizationId);
  if (!organizationId.success) return res.status(400).json({ error: 'Invalid organization ID.' });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const org = await client.query(
      "UPDATE organizations SET status = 'active' WHERE id = $1 AND status = 'pending' RETURNING id,name,status",
      [organizationId.data],
    );
    if (!org.rowCount) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pending organization not found.' });
    }
    await client.query(
      "UPDATE users SET status = 'active' WHERE organization_id = $1 AND role = 'Organization Admin' AND status = 'pending'",
      [organizationId.data],
    );
    await client.query(
      "INSERT INTO audit_events(organization_id,actor_user_id,action,entity_type,entity_id) VALUES($1,$2,'organization.approved','organization',$1)",
      [organizationId.data,req.user!.id],
    );
    await client.query('COMMIT');
    return res.json({ organization: org.rows[0], message: 'Organization approved. Its administrator can now sign in.' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally { client.release(); }
});

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
function loginRateLimited(key: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    loginAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return false;
  }
  entry.count += 1;
  return entry.count > 10;
}

app.post('/api/auth/register-organization', async (req, res, next) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid registration details.', issues: parsed.error.issues });
  const { organization, admin } = parsed.data;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT 1 FROM users WHERE lower(email) = lower($1)', [normalizeEmail(admin.email)]);
    const orgExisting = await client.query('SELECT 1 FROM organizations WHERE lower(email) = lower($1)', [normalizeEmail(organization.email)]);
    if (existing.rowCount || orgExisting.rowCount) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'An account or organization already uses that email address.' });
    }
    const org = await client.query(
      `INSERT INTO organizations(name,type,industry,address,phone,email,currency,status)
       VALUES($1,$2,$3,$4,$5,$6,$7,'pending') RETURNING id,name,type,industry,address,phone,email,currency,created_at`,
      [organization.name,organization.type,organization.industry,organization.address,organization.phone,normalizeEmail(organization.email),organization.currency.toUpperCase()],
    );
    const hashed = await hashPassword(admin.password);
    const user = await client.query(
      `INSERT INTO users(organization_id,full_name,email,phone,password_hash,role,status)
       VALUES($1,$2,$3,$4,$5,'Organization Admin','pending')
       RETURNING id,organization_id,department_id,full_name,email,phone,role,status,must_change_password,created_at`,
      [org.rows[0].id,admin.fullName,normalizeEmail(admin.email),admin.phone,hashed],
    );
    await client.query('COMMIT');
    return res.status(201).json({ organization: org.rows[0], user: publicUser(user.rows[0]), message: 'Registration received and awaiting approval.' });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    return next(error);
  } finally { client.release(); }
});

app.post('/api/auth/login', async (req, res, next) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Enter a valid email and password.' });
  const email = normalizeEmail(parsed.data.email);
  const remote = req.ip || 'unknown';
  const rateKey = `${remote}:${email}`;
  if (loginRateLimited(rateKey)) return res.status(429).json({ error: 'Too many login attempts. Try again in 15 minutes.' });
  try {
    const result = await pool.query('SELECT * FROM users WHERE lower(email) = $1 LIMIT 1', [email]);
    const user = result.rows[0];
    if (!user || !(await verifyPassword(parsed.data.password, String(user.password_hash)))) {
      return res.status(401).json({ error: 'Incorrect email or password.' });
    }
    if (user.status === 'pending') return res.status(403).json({ error: 'Your account is waiting for administrator approval.' });
    if (user.status !== 'active') return res.status(403).json({ error: 'This account is not active. Contact your administrator.' });
    const token = createSessionToken();
    const expires = new Date(Date.now() + SESSION_TTL_MS);
    await pool.query('INSERT INTO sessions(user_id,token_hash,expires_at) VALUES($1,$2,$3)', [user.id,hashSessionToken(token),expires]);
    setSessionCookie(res, token, expires);
    await pool.query(
      'INSERT INTO audit_events(organization_id,actor_user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5,$6)',
      [user.organization_id,user.id,'auth.login','user',user.id,JSON.stringify({ method: 'password' })],
    );
    return res.json({ user: publicUser(user) });
  } catch (error) { return next(error); }
});

app.get('/api/auth/me', requireAuth, (req, res) => res.json({ user: req.user }));

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    const token = readCookie(req, cookieName);
    if (token) await pool.query('DELETE FROM sessions WHERE token_hash = $1', [hashSessionToken(token)]);
    clearSessionCookie(res);
    return res.status(204).end();
  } catch (error) { return next(error); }
});

app.post('/api/auth/change-password', requireAuth, async (req, res, next) => {
  const schema = z.object({ currentPassword: z.string().min(1).max(200), newPassword: z.string().min(8).max(200) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'A new password of at least 8 characters is required.' });
  try {
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user!.id]);
    if (!result.rowCount || !(await verifyPassword(parsed.data.currentPassword, result.rows[0].password_hash))) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }
    const hashed = await hashPassword(parsed.data.newPassword);
    await pool.query('UPDATE users SET password_hash = $1, must_change_password = false WHERE id = $2', [hashed,req.user!.id]);
    await pool.query('DELETE FROM sessions WHERE user_id = $1 AND id <> $2', [req.user!.id,req.sessionId]);
    await pool.query('INSERT INTO audit_events(organization_id,actor_user_id,action,entity_type,entity_id) VALUES($1,$2,$3,$4,$5)',
      [req.user!.organizationId,req.user!.id,'auth.password_changed','user',req.user!.id]);
    return res.json({ success: true });
  } catch (error) { return next(error); }
});

app.post('/api/auth/staff', requireAuth, requireOrganization, allowRoles('Organization Admin'), async (req, res, next) => {
  const parsed = staffSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid staff details.', issues: parsed.error.issues });
  try {
    const input = parsed.data;
    const duplicate = await pool.query('SELECT 1 FROM users WHERE lower(email) = $1', [normalizeEmail(input.email)]);
    if (duplicate.rowCount) return res.status(409).json({ error: 'An account already uses this email.' });
    if (input.departmentId) {
      const dept = await pool.query('SELECT 1 FROM departments WHERE id = $1 AND organization_id = $2', [input.departmentId,req.user!.organizationId]);
      if (!dept.rowCount) return res.status(400).json({ error: 'Department does not belong to your organization.' });
    }
    const passwordHash = await hashPassword(input.temporaryPassword);
    const created = await pool.query(
      `INSERT INTO users(organization_id,department_id,full_name,email,phone,password_hash,role,must_change_password)
       VALUES($1,$2,$3,$4,$5,$6,$7,true)
       RETURNING id,organization_id,department_id,full_name,email,phone,role,status,must_change_password,created_at`,
      [req.user!.organizationId,input.departmentId || null,input.fullName,normalizeEmail(input.email),input.phone,passwordHash,input.role],
    );
    await pool.query('INSERT INTO audit_events(organization_id,actor_user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5,$6)',
      [req.user!.organizationId,req.user!.id,'staff.created','user',created.rows[0].id,JSON.stringify({ role: input.role })]);
    return res.status(201).json({ user: publicUser(created.rows[0]) });
  } catch (error) { return next(error); }
});

app.get('/api/organizations/current', requireAuth, requireOrganization, async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT id,name,type,industry,address,phone,email,approval_threshold,currency,status,created_at FROM organizations WHERE id = $1',
      [req.user!.organizationId],
    );
    if (!result.rowCount) return res.status(404).json({ error: 'Organization not found.' });
    return res.json({ organization: result.rows[0] });
  } catch (error) { return next(error); }
});

const readableRoles: Role[] = ['Organization Admin','Request Officer','Department Head','Procurement Officer','Finance Officer','Approving Authority','Vendor'];
app.get('/api/records/:recordType', requireAuth, requireOrganization, async (req, res, next) => {
  const recordType = typeof req.params.recordType === 'string' ? req.params.recordType : '';
  if (!['request','tender','bid','purchase_order','delivery','payment','vendor','award','notification'].includes(recordType)) {
    return res.status(400).json({ error: 'Unsupported record type.' });
  }
  if (!readableRoles.includes(req.user!.role)) return res.status(403).json({ error: 'Not permitted.' });
  try {
    const result = await pool.query(
      `SELECT id,organization_id,record_type,reference_number,status,data,created_by,created_at,updated_at
       FROM procurement_records WHERE organization_id = $1 AND record_type = $2 ORDER BY created_at DESC LIMIT 500`,
      [req.user!.organizationId,recordType],
    );
    return res.json({ records: result.rows });
  } catch (error) { return next(error); }
});

app.post('/api/records', requireAuth, requireOrganization, async (req, res, next) => {
  const parsed = recordSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid procurement record.', issues: parsed.error.issues });
  const { recordType, referenceNumber, status, data } = parsed.data;
  const rolePermissions: Record<string, Role[]> = {
    request: ['Organization Admin','Request Officer'],
    tender: ['Organization Admin','Procurement Officer'],
    bid: ['Vendor'],
    purchase_order: ['Organization Admin','Procurement Officer'],
    delivery: ['Organization Admin','Procurement Officer'],
    payment: ['Organization Admin','Finance Officer'],
    vendor: ['Vendor','Organization Admin'],
    award: ['Procurement Officer','Finance Officer'],
    notification: ['Organization Admin'],
  };
  if (!rolePermissions[recordType]?.includes(req.user!.role)) return res.status(403).json({ error: 'Your role cannot create this record type.' });
  try {
    if (recordType === 'bid' && typeof data.tenderId === 'string') {
      const tender = await pool.query(
        "SELECT id FROM procurement_records WHERE id = $1 AND organization_id = $2 AND record_type = 'tender' AND status = 'Open'",
        [data.tenderId,req.user!.organizationId],
      );
      if (!tender.rowCount) return res.status(400).json({ error: 'The tender is not open or does not belong to this organization.' });
    }
    const result = await pool.query(
      `INSERT INTO procurement_records(organization_id,record_type,reference_number,status,data,created_by)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING id,organization_id,record_type,reference_number,status,data,created_by,created_at,updated_at`,
      [req.user!.organizationId,recordType,referenceNumber || null,status,JSON.stringify(data),req.user!.id],
    );
    await pool.query('INSERT INTO audit_events(organization_id,actor_user_id,action,entity_type,entity_id,details) VALUES($1,$2,$3,$4,$5,$6)',
      [req.user!.organizationId,req.user!.id,'record.created',recordType,result.rows[0].id,JSON.stringify({ referenceNumber: referenceNumber || null })]);
    return res.status(201).json({ record: result.rows[0] });
  } catch (error) { return next(error); }
});

app.use((_req, res) => res.status(404).json({ error: 'Endpoint not found.' }));
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Procura API error:', error instanceof Error ? error.message : 'Unknown error');
  if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
    return res.status(409).json({ error: 'A record with these details already exists.' });
  }
  return res.status(500).json({ error: 'An unexpected server error occurred.' });
});

const server = app.listen(port, () => console.log(`Procura API listening on port ${port}`));
async function shutdown() {
  server.close();
  await pool.end();
}
process.on('SIGTERM', () => { void shutdown(); });
process.on('SIGINT', () => { void shutdown(); });