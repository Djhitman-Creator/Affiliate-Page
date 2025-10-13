export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest } from "next/server";
import { importCsv } from "@/lib/importers";


export async function POST(req: NextRequest) {
  const form = await req.formData()
  const source = (form.get('source') || '') as 'Karaoke Version' | 'Party Tyme'
  const file = form.get('file') as File | null
  const rawCsv = form.get('csv') as string | null

  if (!source) return new Response('Missing source', { status: 400 })

  let csv = ''
  if (file) {
    csv = await (file as File).text()
  } else if (rawCsv) {
    csv = rawCsv
  } else {
    return new Response('No CSV provided', { status: 400 })
  }

  const result = await importCsv(source, csv)
  return Response.json({ ok: true, ...result })
}
