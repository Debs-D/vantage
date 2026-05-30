import { AppHeader } from "@/components/layout/AppHeader";
import { PanelLayout } from "@/components/layout/PanelLayout";

export default function Home() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <AppHeader />
      <PanelLayout />
    </div>
  );
}
