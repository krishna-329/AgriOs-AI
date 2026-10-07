"use client";
import { FarmProvider } from "@/components/farm-provider";
import { WeatherProvider } from "@/components/weather-provider";
import { useState } from "react";
import { DashboardProvider } from "@/components/dashboard-provider";
import { TopNavbar, MobileBottomNav, Sidebar } from "@/components/navigation";
export function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DashboardProvider><FarmProvider><WeatherProvider>
      <div className="app-shell reference-shell">
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="workspace">
          <TopNavbar onMenu={() => setOpen(!open)} />
          <main>{children}</main>
          <footer>
            AgriOS AI · Smarter Farms. Brighter Tomorrows.
            <span>
              Saved farm profile · External weather · Other cards are demo · <a href="/image-credits">Image credits</a>
            </span>
          </footer>
        </div>
        <MobileBottomNav />
      </div>
    </WeatherProvider></FarmProvider></DashboardProvider>
  );
}
