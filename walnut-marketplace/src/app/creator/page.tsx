import { redirect } from "next/navigation";

export default function CreatorHomeRedirectPage() {
  redirect("/creator/dashboard");
}
