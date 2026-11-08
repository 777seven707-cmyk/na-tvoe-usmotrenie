import { PlannedPage } from "@/components/layout/planned-page";
import { navItem } from "@/lib/navigation";

export const metadata = { title: navItem("/inspect/windows").title };

export default function Page() {
  return (
    <PlannedPage
      href="/inspect/windows"
      capabilities={[
        "PE headers, sections and architecture",
        "Authenticode signature verification",
        "Imports, exports and dependencies",
        "Version resources",
        "Static indicators — never executed on the host",
      ]}
    />
  );
}
