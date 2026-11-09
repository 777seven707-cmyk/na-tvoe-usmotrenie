import { PlannedPage } from "@/components/layout/planned-page";
import { navItem } from "@/lib/navigation";

export const metadata = { title: navItem("/inspect/api").title };

export default function Page() {
  return (
    <PlannedPage
      href="/inspect/api"
      capabilities={[
        "OpenAPI 3 / Swagger 2 import and validation",
        "Endpoint, method and parameter inventory",
        "Security scheme review",
        "Schema inspection",
        "Spec-driven requests in authorized test environments only",
      ]}
    />
  );
}
