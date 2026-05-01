import { redirect } from "next/navigation";

export default function NewCampaignPage() {
  redirect("/business/campaigns/create");
}
