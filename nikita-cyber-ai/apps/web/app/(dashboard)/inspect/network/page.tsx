import { PlannedPage } from "@/components/layout/planned-page";
import { navItem } from "@/lib/navigation";

export const metadata = { title: navItem("/inspect/network").title };

export default function Page() {
  return (
    <PlannedPage
      href="/inspect/network"
      capabilities={[
        "PCAP / PCAPNG import",
        "Protocol and conversation statistics",
        "DNS queries and TLS handshake metadata",
        "HTTP request inventory",
        "Timeline and connection graph",
      ]}
    />
  );
}
