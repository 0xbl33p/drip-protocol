import { TopNav } from "@/components/layout/top-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { OceanCanvas } from "@/components/scene/ocean-canvas";
import { PriceTicker } from "@/components/animations/price-ticker";
import { TradeNotifications } from "@/components/animations/trade-notification";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <OceanCanvas />
      <TopNav />
      <PriceTicker />
      <main className="flex-1 flex flex-col pb-16 md:pb-0">{children}</main>
      <MobileNav />
      <TradeNotifications />
    </>
  );
}
