import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const requirement = await db.requirement.findUnique({
    where: { id },
    include: {
      eligibility: true,
      compensation: true,
      business: true
    }
  });
  if (!requirement) {
    return NextResponse.json({ error: "Requirement not found" }, { status: 404 });
  }
  return NextResponse.json({ data: requirement });
}
