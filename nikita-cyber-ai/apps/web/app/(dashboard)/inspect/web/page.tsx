import { PlannedPage } from "@/components/layout/planned-page";
import { navItem } from "@/lib/navigation";

export const metadata = { title: navItem("/inspect/web").title };

export default function Page() {
  return (
    <PlannedPage
      href="/inspect/web"
      capabilities={[
        "HTTP response and security header review",
        "Cookie attribute review",
        "TLS certificate and configuration review",
        "Frontend framework and technology detection",
        "Page and resource map (same-origin, in scope only)",
      ]}
    />
  );
}
