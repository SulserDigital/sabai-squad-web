// Thai Night Market – Dark Luxury Design
// Navbar: Glassmorphism, Gold-Akzente, sticky mit Blur
// Mobile: 5 aufklappbare Kategorien
import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home, LayoutDashboard, CalendarDays, Plane, Map, Wallet,
  MessageCircle, FolderLock, ArrowLeftRight, Languages, Palmtree, Lightbulb, Building2,
  ShoppingCart, CheckSquare, Smartphone, Users, Car, Briefcase, Newspaper,
  Globe, Compass, Settings, ChevronDown, User
} from "lucide-react";

// ── Category groups ──────────────────────────────────────────────────────
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
}

interface NavCategory {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  items: NavItem[];
}

const NAV_CATEGORIES: NavCategory[] = [
  {
    id: "reise",
    label: "Reise",
    icon: Globe,
    items: [
      { href: "/my-trip", label: "Meine Reise", icon: Plane },
      { href: "/preparation", label: "Reisevorbereitung", icon: Briefcase },
      { href: "/timeline", label: "Reiseverlauf", icon: CalendarDays },
      { href: "/transport", label: "Transport", icon: Car },
      { href: "/map", label: "Karte", icon: Map },
    ],
  },
  {
    id: "unterwegs",
    label: "Unterwegs",
    icon: Compass,
    items: [
      { href: "/dictionary", label: "Übersetzer", icon: Languages },
      { href: "/currency", label: "Währung", icon: ArrowLeftRight },
      { href: "/apps", label: "Apps", icon: Smartphone },
      { href: "/tips", label: "Tipps", icon: Lightbulb },
      { href: "/news", label: "News & Infos", icon: Newspaper },
    ],
  },
  {
    id: "gruppe",
    label: "Gruppe",
    icon: Users,
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/chat", label: "Chat", icon: MessageCircle },
      { href: "/tasks", label: "Aufgaben", icon: CheckSquare },
      { href: "/shopping", label: "Einkaufsliste", icon: ShoppingCart },
      { href: "/contacts", label: "Kontakte", icon: Users },
    ],
  },
  {
    id: "finanzen",
    label: "Finanzen",
    icon: Wallet,
    items: [
      { href: "/finance", label: "Finanzen", icon: Wallet },
      { href: "/vault", label: "Vault", icon: FolderLock },
      { href: "/accommodations", label: "Unterkünfte", icon: Building2 },
    ],
  },
  {
    id: "profil",
    label: "Profil",
    icon: User,
    items: [
      { href: "/", label: "Home", icon: Home },
      { href: "/settings", label: "Einstellungen", icon: Settings },
    ],
  },
];

// All hrefs for desktop nav (flat list for the scrollable top bar)
const ALL_NAV_ITEMS: NavItem[] = NAV_CATEGORIES.flatMap((c) => c.items);

// ── CategoryGroup ─────────────────────────────────────────────────────────
function CategoryGroup({
  category,
  location,
  onNavigate,
  defaultOpen,
}: {
  category: NavCategory;
  location: string;
  onNavigate: () => void;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const CategoryIcon = category.icon;
  const hasActive = category.items.some((item) => item.href === location);

  return (
    <div className="border-b border-white/5 last:border-0">
      {/* Category header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors ${
          hasActive
            ? "text-[oklch(0.78_0.14_75)]"
            : "text-[oklch(0.75_0.01_80)] hover:text-white"
        }`}
      >
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
            hasActive
              ? "bg-[oklch(0.78_0.14_75/15%)]"
              : "bg-white/5"
          }`}
        >
          <CategoryIcon
            className={`w-4 h-4 ${hasActive ? "text-[oklch(0.78_0.14_75)]" : "text-[oklch(0.65_0.01_80)]"}`}
            strokeWidth={1.5}
          />
        </div>
        <span className="flex-1 font-semibold text-sm tracking-wide uppercase">{category.label}</span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""} ${
            hasActive ? "text-[oklch(0.78_0.14_75)]" : "text-white/30"
          }`}
          strokeWidth={1.5}
        />
      </button>

      {/* Sub-items */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-2">
              {category.items.map((item) => {
                const ItemIcon = item.icon;
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <span
                      onClick={onNavigate}
                      className={`flex items-center gap-3 pl-[52px] pr-4 py-3 text-sm cursor-pointer transition-all min-h-[44px] ${
                        isActive
                          ? "text-[oklch(0.78_0.14_75)] bg-[oklch(0.78_0.14_75/8%)]"
                          : "text-[oklch(0.65_0.01_80)] hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <ItemIcon
                        className={`w-4 h-4 shrink-0 ${isActive ? "text-[oklch(0.78_0.14_75)]" : "text-white/30"}`}
                        strokeWidth={1.5}
                      />
                      <span className="truncate">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[oklch(0.78_0.14_75)] shrink-0" />
                      )}
                    </span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────
export function Navbar() {
  const [location] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Find which category the current page belongs to (auto-open it)
  const activeCategoryId = NAV_CATEGORIES.find((c) =>
    c.items.some((item) => item.href === location)
  )?.id;

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[oklch(0.11_0.02_255/90%)] backdrop-blur-xl border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
                <Palmtree className="w-4 h-4 text-[oklch(0.11_0.02_255)]" strokeWidth={2} />
              </div>
              <span
                className="text-xl font-bold text-gold-gradient"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                SabaiSquad
              </span>
            </div>
          </Link>

          {/* Desktop Nav - scrollable flat list */}
          <nav className="hidden lg:flex items-center gap-0.5 max-w-[700px] overflow-x-auto scrollbar-hide">
            {ALL_NAV_ITEMS.map((link) => (
              <Link key={link.href} href={link.href}>
                <span
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                    location === link.href
                      ? "text-[oklch(0.78_0.14_75)] bg-[oklch(0.78_0.14_75/10%)]"
                      : "text-[oklch(0.75_0.01_80)] hover:text-[oklch(0.78_0.14_75)] hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="hidden lg:flex items-center">
            <Link href="/dashboard">
              <span className="px-4 py-2 rounded-lg bg-gold-gradient text-[oklch(0.11_0.02_255)] text-sm font-semibold hover:opacity-90 transition-opacity cursor-pointer glow-gold">
                App öffnen
              </span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center text-[oklch(0.75_0.01_80)] hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menü öffnen"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className={`block h-0.5 bg-current transition-all duration-200 ${mobileOpen ? "rotate-45 translate-y-1.5" : ""}`} />
              <span className={`block h-0.5 bg-current transition-all duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
              <span className={`block h-0.5 bg-current transition-all duration-200 ${mobileOpen ? "-rotate-45 -translate-y-1.5" : ""}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu – 5 collapsible categories */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}
            className="lg:hidden bg-[oklch(0.13_0.025_255/97%)] backdrop-blur-xl border-t border-white/10 overflow-hidden"
          >
            <div className="overflow-y-auto max-h-[80vh]">
              {NAV_CATEGORIES.map((category) => (
                <CategoryGroup
                  key={category.id}
                  category={category}
                  location={location}
                  onNavigate={closeMobile}
                  defaultOpen={category.id === activeCategoryId}
                />
              ))}

              {/* App öffnen CTA */}
              <div className="px-4 py-4 border-t border-white/10">
                <Link href="/dashboard">
                  <span
                    onClick={closeMobile}
                    className="block px-4 py-3 rounded-xl bg-gold-gradient text-[oklch(0.11_0.02_255)] text-sm font-semibold text-center cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    App öffnen
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
