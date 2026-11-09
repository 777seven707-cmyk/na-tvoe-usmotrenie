import { PlannedPage } from "@/components/layout/planned-page";
import { navItem } from "@/lib/navigation";

export const metadata = { title: navItem("/workspace").title };

export default function Page() {
  return (
    <PlannedPage
      href="/workspace"
      capabilities={[
        "Natural-language research goal",
        "Claude-generated research plan with per-step policy verdicts",
        "Step-level approve / reject, hash-bound approvals",
        "Live execution timeline and logs over WebSocket",
        "Evidence and AI explanations, clearly labelled",
        "Per-job and global STOP",
      ]}
    />
  );
}
