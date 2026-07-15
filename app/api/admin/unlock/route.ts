import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// ============================================================================
// POST /api/admin/unlock   body: { password }
// ============================================================================
// Server-side check for the on-page admin section. The password used to be
// hardcoded in the client bundle where anyone could read it with view-source;
// now it lives only in the ADMIN_PASSWORD environment variable (set in
// .env.local and in the Vercel project) and is compared on the server.
// ============================================================================

export async function POST(request: Request) {
  const expected = (process.env.ADMIN_PASSWORD ?? '').trim();
  if (!expected) {
    return NextResponse.json({ ok: false, error: 'NOT_CONFIGURED' }, { status: 500 });
  }

  const body = (await request.json().catch(() => ({}))) as { password?: unknown };
  const given = typeof body.password === 'string' ? body.password : '';

  if (given !== expected) {
    return NextResponse.json({ ok: false, error: 'WRONG_PASSWORD' }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
