import { NextResponse, type NextRequest } from "next/server";
import { rangeQuerySchema, upsertRangeSchema } from "@/lib/schema";
import { deleteRange, getRange, upsertRange } from "@/lib/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const parsed = rangeQuerySchema.safeParse({
    from: sp.get("from"),
    to: sp.get("to"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const rows = await getRange(parsed.data.from, parsed.data.to);
  return NextResponse.json({ days: rows });
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = upsertRangeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const count = await upsertRange({
    from: parsed.data.from,
    to: parsed.data.to,
    status: parsed.data.status,
    location: parsed.data.location ?? null,
    note: parsed.data.note ?? null,
  });
  return NextResponse.json({ upserted: count });
}

export async function DELETE(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const parsed = rangeQuerySchema.safeParse({
    from: sp.get("from"),
    to: sp.get("to"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const count = await deleteRange(parsed.data.from, parsed.data.to);
  return NextResponse.json({ deleted: count });
}
