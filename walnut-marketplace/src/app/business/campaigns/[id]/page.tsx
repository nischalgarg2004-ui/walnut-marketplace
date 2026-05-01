"use client";

import { useParams } from "next/navigation";
import { CampaignManageClient } from "@/components/business/campaigns/CampaignManageClient";

export default function CampaignManagePage() {
  const { id } = useParams<{ id: string }>();
  if (!id) return null;
  return <CampaignManageClient requirementId={id} />;
}
