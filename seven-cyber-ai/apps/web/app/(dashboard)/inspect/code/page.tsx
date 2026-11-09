import { PlannedPage } from "@/components/layout/planned-page";
import { navItem } from "@/lib/navigation";

export const metadata = { title: navItem("/inspect/code").title };

export default function Page() {
  return (
    <PlannedPage
      href="/inspect/code"
      capabilities={[
        "Repository structure and language breakdown",
        "Dependency manifests and lockfiles",
        "Component and module mapping",
        "Architecture graph from real import evidence",
      ]}
    />
  );
}
