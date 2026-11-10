import type { NextRequest } from 'next/server';
import { getAdmin } from '@/lib/auth';
import { query } from '@/lib/db';
import { inquiryFilter } from '@/lib/inquiry-filter';

/** GET /admin/inquiries/export?status=&q= — CSV of the filtered inquiries (opens in Excel). */
export async function GET(req: NextRequest) {
  if (!(await getAdmin())) return Response.redirect(new URL('/admin/login', req.url), 303);
  const sp = req.nextUrl.searchParams;
  const f = inquiryFilter(sp.get('status') || '', sp.get('q') || '');
  const rows = await query<Record<string, unknown>>(
    `SELECT id, created_at, name, phone, email, city, product, message, source, status FROM inquiries${f.sql} ORDER BY created_at DESC`,
    f.args,
  );
  const cell = (v: unknown) => {
    let s = v == null ? '' : String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // stop spreadsheets running it as a formula
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const header = ['ID', 'Date', 'Name', 'Phone', 'Email', 'City', 'Product', 'Message', 'Source', 'Status'];
  const keys = ['id', 'created_at', 'name', 'phone', 'email', 'city', 'product', 'message', 'source', 'status'];
  const csv = '﻿' + [header.join(','), ...rows.map((r) => keys.map((k) => cell(r[k])).join(','))].join('\r\n');
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="inquiries-${date}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}
