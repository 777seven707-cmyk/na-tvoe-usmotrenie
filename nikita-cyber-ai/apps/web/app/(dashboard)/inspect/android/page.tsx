import { PlannedPage } from "@/components/layout/planned-page";
import { navItem } from "@/lib/navigation";

export const metadata = { title: navItem("/inspect/android").title };

export default function Page() {
  return (
    <PlannedPage
      href="/inspect/android"
      capabilities={[
        "Package, version and SDK levels",
        "AndroidManifest.xml analysis",
        "Permissions and exported components",
        "Signing certificate details",
        "Bundled libraries and static analysis",
      ]}
    />
  );
}
