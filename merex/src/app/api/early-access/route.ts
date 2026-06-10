import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const submitSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits").max(20),
  instagramUsername: z.string().min(1, "Instagram username is required").max(100),
  roleType: z.enum(["CLIPPER", "UGC"], {
    errorMap: () => ({ message: "Please select either Clipper or UGC Creator" })
  })
});

export async function POST(req: NextRequest) {
  try {
    const body = submitSchema.parse(await req.json());

    // Sanitize instagram username by stripping leading '@' if present
    const cleanIg = body.instagramUsername.trim().replace(/^@/, "");

    // Check for existing pending/granted requests to prevent spam
    const existing = await db.earlyAccessRequest.findFirst({
      where: {
        OR: [
          { mobileNumber: body.mobileNumber.trim() },
          { instagramUsername: { equals: cleanIg, mode: "insensitive" } }
        ]
      }
    });

    if (existing) {
      if (existing.status === "GRANTED") {
        return NextResponse.json(
          { error: "This mobile number or Instagram username has already been granted access." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "A request with this mobile number or Instagram username is already pending." },
        { status: 400 }
      );
    }

    const request = await db.earlyAccessRequest.create({
      data: {
        name: body.name.trim(),
        mobileNumber: body.mobileNumber.trim(),
        instagramUsername: cleanIg,
        roleType: body.roleType
      }
    });

    return NextResponse.json({ success: true, data: request });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
