import { jwtVerify } from 'jose';

const secret = new TextEncoder().encode(process.env.DASHBOARD_SSO_SECRET);

export interface SSOPayload {
  sub: string;
  email: string;
  full_name: string;
  role: string;
  course_id: string;
  tenant_id?: string;
  tenant_slug?: string;
}

export async function verifySSOToken(token: string): Promise<SSOPayload> {
  const { payload } = await jwtVerify(token, secret);
  return payload as unknown as SSOPayload;
}

/** The dashboard URL — course apps redirect here for auth and enrollment */
export const DASHBOARD_URL = process.env.DASHBOARD_URL || 'https://courses.esdesigns.org';

/** The slug for this course on the dashboard (used for redirects) */
export const COURSE_SLUG = process.env.COURSE_SLUG || 'introduction-to-business';
