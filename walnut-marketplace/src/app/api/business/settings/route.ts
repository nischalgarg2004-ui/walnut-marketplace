import { UserRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getRequiredSessionUser } from "@/lib/auth";

const settingsSchema = z.object({
  accountData: z.record(z.any()).optional(),
  teamData: z.record(z.any()).optional(),
  notificationData: z.record(z.any()).optional(),
  billingData: z.record(z.any()).optional(),
  securityData: z.record(z.any()).optional(),
  integrationData: z.record(z.any()).optional(),
  preferenceData: z.record(z.any()).optional()
});

export async function GET(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    if (user.role !== UserRole.BUSINESS) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const settings = await db.businessSettings.upsert({
      where: { userId: user.userId },
      update: {},
      create: {
        userId: user.userId,
        accountData: {},
        teamData: { members: [] },
        notificationData: {},
        billingData: {},
        securityData: {},
        integrationData: {},
        preferenceData: {}
      }
    });

    return NextResponse.json({ data: settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to fetch settings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = getRequiredSessionUser(req);
    if (user.role !== UserRole.BUSINESS) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const payload = settingsSchema.parse(await req.json());

    const data: Record<string, unknown> = {};
    if (payload.accountData !== undefined) data.accountData = payload.accountData;
    if (payload.teamData !== undefined) data.teamData = payload.teamData;
    if (payload.notificationData !== undefined) data.notificationData = payload.notificationData;
    if (payload.billingData !== undefined) data.billingData = payload.billingData;
    if (payload.securityData !== undefined) data.securityData = payload.securityData;
    if (payload.integrationData !== undefined) data.integrationData = payload.integrationData;
    if (payload.preferenceData !== undefined) data.preferenceData = payload.preferenceData;

    const settings = await db.businessSettings.upsert({
      where: { userId: user.userId },
      create: {
        userId: user.userId,
        accountData: payload.accountData ?? {},
        teamData: payload.teamData ?? { members: [] },
        notificationData: payload.notificationData ?? {},
        billingData: payload.billingData ?? {},
        securityData: payload.securityData ?? {},
        integrationData: payload.integrationData ?? {},
        preferenceData: payload.preferenceData ?? {}
      },
      update: data
    });

    return NextResponse.json({ data: settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save settings";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
