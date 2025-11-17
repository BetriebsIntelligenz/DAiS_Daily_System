import { MobileShell } from "@/components/mobile-shell";
import { TimelineFeed } from "@/components/timeline-feed";

export default function TimelinePage() {
  return (
    <MobileShell
      title="Activity Timeline"
      description="Chronologischer Überblick über Programme, Eingaben und Journal-Aktionen."
    >
      <TimelineFeed />
    </MobileShell>
  );
}
