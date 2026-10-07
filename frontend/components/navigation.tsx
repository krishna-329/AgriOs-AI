"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFarm } from "@/components/farm-provider";
import { useWeather } from "@/components/weather-provider";
import { useState } from "react";
import {
  Leaf,
  House,
  Sprout,
  Radio,
  Warehouse,
  ShieldCheck,
  ChartNoAxesColumnIncreasing,
  Settings,
  MapPin,
  CloudSun,
  Bell,
  Search,
  ChevronDown,
  Menu,
  X,
  MoreHorizontal,
  Droplet,
} from "lucide-react";
import { mockFarmData as farm } from "@/data/mockFarmData";
export const navigation = [
  { href: "/overview", label: "Overview", icon: House },
  { href: "/crop-planner", label: "Crop Planner", icon: Leaf },
  { href: "/field-monitor", label: "Field Monitor", icon: Radio },
  { href: "/grainguard", label: "GrainGuard", icon: Warehouse },
  { href: "/risk-center", label: "Risk Center", icon: ShieldCheck },
  { href: "/expert", label: "Analytics", icon: ChartNoAxesColumnIncreasing },
  { href: "/settings", label: "Settings", icon: Settings },
];
export function Brand() {
  return (
    <Link className="reference-brand" href="/overview">
      <span className="leaf-logo">
        <Leaf size={28} />
      </span>
      <span>AgriOS AI</span>
    </Link>
  );
}
export function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const path = usePathname();
  return (
    <>
      <button
        className={`sidebar-scrim ${open ? "is-open" : ""}`}
        aria-label="Close navigation"
        onClick={onClose}
      />
      <aside className={`sidebar reference-sidebar ${open ? "is-open" : ""}`}>
        <Brand />
        <p className="brand-tagline">
          Smarter Farms
          <br />
          Brighter Tomorrows
        </p>
        <button
          className="sidebar-close"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <X size={19} />
        </button>
        <nav aria-label="Main navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              onClick={onClose}
              href={href}
              key={href}
              className={path === href ? "active" : ""}
              aria-current={path === href ? "page" : undefined}
            >
              <Icon size={19} />
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-landscape">
          <div>
            <Sprout size={27} />
            <span>
              Good farming today,
              <br />a healthier tomorrow.
            </span>
          </div>
        </div>
      </aside>
    </>
  );
}
export function TopNavbar({ onMenu }: { onMenu: () => void }) {
  const [query, setQuery] = useState("");
  const { weather, status } = useWeather();
  const { farms, selectedFarm, selectFarm, status: farmStatus, saving } = useFarm();
  const [popover, setPopover] = useState<string | null>(null);
  const results = navigation.filter((n) =>
    `${n.label} ${n.href}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <header className="app-header reference-navbar">
      <button
        className="tablet-menu icon-button"
        onClick={onMenu}
        aria-label="Open sidebar"
      >
        <Menu size={21} />
      </button>
      <div className="mobile-brand">
        <Brand />
      </div>
      <div className="search-wrap">
        <Search size={17} />
        <input
          type="search"
          aria-label="Search fields, crops, insights"
          placeholder="Search fields, crops, insights..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setQuery("");
          }}
        />
        {query && (
          <div className="nav-popover search-results">
            {results.length ? (
              results.map((r) => (
                <Link key={r.href} href={r.href} onClick={() => setQuery("")}>
                  {r.label}
                  <ChevronDown size={12} />
                </Link>
              ))
            ) : (
              <p>No matching pages. Try “crop” or “field”.</p>
            )}
          </div>
        )}
      </div>
      <label className="location-select">
        <MapPin size={17} />
        <select
          aria-label="Selected farm"
          value={selectedFarm?.id || ""}
          onChange={event => selectFarm(event.target.value)}
          disabled={farmStatus !== "ready" || saving || !farms.length}
        >
          {!selectedFarm && <option value="">{farmStatus === "loading" ? "Loading farms…" : farmStatus === "error" ? "Farms unavailable" : "No farms yet"}</option>}
          {farms.map(item => <option key={item.id} value={item.id}>{item.name}{item.location_name ? ` · ${item.location_name}` : ""}</option>)}
        </select>
      </label>
      <div className="navbar-weather">
        <CloudSun size={29} />
        <span>
          <b>{weather ? `${Math.round(weather.temperature)}°C` : "—"}</b>
          <small>{weather ? weather.condition : status === "loading" ? "Loading weather…" : "Weather unavailable"}</small>
        </span>
      </div>
      <div className="nav-menu-wrap">
        <button
          className="icon-button notification-button"
          aria-label="Notifications, 3 demo alerts"
          aria-expanded={popover === "notifications"}
          onClick={() =>
            setPopover(popover === "notifications" ? null : "notifications")
          }
        >
          <Bell size={22} />
          <span>3</span>
        </button>
        {popover === "notifications" && (
          <div className="nav-popover notifications">
            <strong>
              Farm notifications <small>Mock data</small>
            </strong>
            {farm.actions.map((a) => (
              <Link
                key={a.id}
                href="/risk-center"
                onClick={() => setPopover(null)}
              >
                <span className={`notification-dot ${a.level.toLowerCase()}`} />
                <span>
                  {a.title}
                  <small>{a.reason}</small>
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="nav-menu-wrap">
        <button
          className="profile-trigger"
          aria-expanded={popover === "profile"}
          onClick={() => setPopover(popover === "profile" ? null : "profile")}
        >
          <span className="farmer-avatar">{selectedFarm?.farmer_name?.split(/\s+/).map(part => part[0]).slice(0, 2).join("") || "—"}</span>
          <span className="profile-name">
            <strong>{selectedFarm?.farmer_name || "Farm profile"}</strong>
            <small>Farmer</small>
          </span>
          <ChevronDown size={14} />
        </button>
        {popover === "profile" && (
          <div className="nav-popover profile-popover">
            <strong>{selectedFarm?.farmer_name || "Farm profile"}</strong>
            <p>{selectedFarm?.name || "Choose or create a farm"}</p>
            <Link href="/farm-profile" onClick={() => setPopover(null)}>
              Edit farm profile →
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
export const Header = TopNavbar;
export function MobileBottomNav() {
  const path = usePathname();
  const [more, setMore] = useState(false);
  const items = [
    { href: "/overview", label: "Home", icon: House },
    { href: "/crop-planner", label: "Crops", icon: Sprout },
    { href: "/field-monitor", label: "Monitor", icon: Droplet },
    { href: "/expert", label: "Insights", icon: ChartNoAxesColumnIncreasing },
  ];
  return (
    <>
      {more && (
        <div className="mobile-more">
          <div>
            <strong>More from your farm</strong>
            <button
              className="icon-button"
              aria-label="Close more menu"
              onClick={() => setMore(false)}
            >
              <X size={18} />
            </button>
          </div>
          {navigation
            .filter((n) =>
              ["/grainguard", "/risk-center", "/settings"].includes(n.href),
            )
            .map(({ href, label, icon: Icon }) => (
              <Link href={href} key={href} onClick={() => setMore(false)}>
                <Icon size={19} />
                {label}
              </Link>
            ))}
        </div>
      )}
      <nav
        className="mobile-nav reference-mobile-nav"
        aria-label="Mobile navigation"
      >
        {items.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            onClick={() => setMore(false)}
            className={path === href ? "active" : ""}
            aria-current={path === href ? "page" : undefined}
          >
            <Icon size={20} />
            <span>{label}</span>
          </Link>
        ))}
        <button
          onClick={() => setMore(!more)}
          aria-expanded={more}
          className={
            more || ["/grainguard", "/risk-center", "/settings"].includes(path)
              ? "active"
              : ""
          }
        >
          <MoreHorizontal size={20} />
          <span>More</span>
        </button>
      </nav>
    </>
  );
}
export const MobileNavigation = MobileBottomNav;
