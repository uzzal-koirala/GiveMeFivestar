// Owner: read / update / delete a review link
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ todo: true }, { status: 501 });
}

export async function PATCH() {
  return NextResponse.json({ todo: true }, { status: 501 });
}

export async function DELETE() {
  return NextResponse.json({ todo: true }, { status: 501 });
}
