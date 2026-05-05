import { redirect } from "next/navigation";

import { getAuthenticatedUser } from "@/lib/supabase/server";

export default async function HomePage() {
  const user = await getAuthenticatedUser();

  if (user) {
    redirect("/dashboard");
  }

  redirect("/auth/login");
}
