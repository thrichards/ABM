import { redirect } from "next/navigation";

export default function ProtectedPage() {
  // Redirect to admin page since /protected is no longer used
  redirect("/protected/admin");
}