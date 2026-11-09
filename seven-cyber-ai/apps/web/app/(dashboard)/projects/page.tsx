import { PlannedPage } from "@/components/layout/planned-page";
import { navItem } from "@/lib/navigation";

export const metadata = { title: navItem("/projects").title };

export default function Page() {
  return (
    <PlannedPage
      href="/projects"
      capabilities={[
        "Create, archive and delete projects",
        "Targets: URLs, APIs, APKs, PE files, repos, captures",
        "Scope rules with authorization note and expiry",
        "Per-project permissions and autonomy mode",
      ]}
    />
  );
}
