import { redirect } from "next/navigation";

/** The old "My Space" preview now lives under Me. */
export default function MySpacePage() {
  redirect("/me");
}
