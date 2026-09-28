// Owner: list / create review links
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ todo: true }, { status: 501 });
}

export async function POST() {
  return NextResponse.json({ todo: true }, { status: 501 });
}
