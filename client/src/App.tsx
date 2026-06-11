// Thai Night Market – Dark Luxury Design
// App.tsx: Routing für alle SabaiSquad Screens
import { Switch, Route, useLocation } from "wouter";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import ErrorBoundary from "./components/ErrorBoundary";
import { useNetworkStatus } from "./hooks/useNetworkStatus";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import Home from "@/pages/Home";
import Dashboard from "@/pages/Dashboard";
import Timeline from "@/pages/Timeline";
import Finance from "@/pages/Finance";
import Destinations from "@/pages/Destinations";
import Chat from "@/pages/Chat";
import Dictionary from "@/pages/Dictionary";
import Currency from "@/pages/Currency";
import Activities from "@/pages/Activities";
import Vault from "@/pages/Vault";
import JoinTrip from "@/pages/JoinTrip";
import MyTrip from "@/pages/MyTrip";
import TripMap from "@/pages/TripMap";
import Tips from "@/pages/Tips";
import Accommodations from "@/pages/Accommodations";
import UsefulApps from "@/pages/UsefulApps";
import ShoppingList from "@/pages/ShoppingList";
import TaskList from "@/pages/TaskList";
import Transport from "@/pages/Transport";
import Contacts from "@/pages/Contacts";
import Preparation from "@/pages/Preparation";
import News from "@/pages/News";
import Settings from "@/pages/Settings";
import Legal from "@/pages/Legal";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";

// Scrolls to top on every route change
function ScrollToTop() {
  const [location] = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
  return null;
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[oklch(0.11_0.02_255)] text-white">
      <Navbar />
      {/* pt-16 ensures content starts below the fixed h-16 navbar */}
      <main className="pt-16">{children}</main>
      <Footer />
    </div>
  );
}

function NetworkStatusWatcher() {
  const { isOnline } = useNetworkStatus();
  const prevOnline = useRef(isOnline);

  useEffect(() => {
    if (prevOnline.current === isOnline) return;
    prevOnline.current = isOnline;
    if (!isOnline) {
      toast.warning("Keine Internetverbindung", {
        description: "Du bist offline. Einige Funktionen sind eingeschränkt.",
        duration: Infinity,
        id: "offline-toast",
      });
    } else {
      toast.dismiss("offline-toast");
      toast.success("Wieder online", { duration: 3000 });
    }
  }, [isOnline]);

  return null;
}

function Router() {
  return (
    <>
      <ScrollToTop />
      <NetworkStatusWatcher />
      <Switch>
        <Route path="/login" component={() => <Login />} />
        <Route path="/" component={() => <AppLayout><Home /></AppLayout>} />
        <Route path="/dashboard" component={() => <AppLayout><Dashboard /></AppLayout>} />
        <Route path="/timeline" component={() => <AppLayout><Timeline /></AppLayout>} />
        <Route path="/finance" component={() => <AppLayout><Finance /></AppLayout>} />
        <Route path="/destinations" component={() => <AppLayout><Destinations /></AppLayout>} />
        <Route path="/chat" component={() => <AppLayout><Chat /></AppLayout>} />
        <Route path="/dictionary" component={() => <AppLayout><Dictionary /></AppLayout>} />
        <Route path="/currency" component={() => <AppLayout><Currency /></AppLayout>} />
        <Route path="/activities" component={() => <AppLayout><Activities /></AppLayout>} />
        <Route path="/vault" component={() => <AppLayout><Vault /></AppLayout>} />
        <Route path="/join" component={() => <AppLayout><JoinTrip /></AppLayout>} />
        <Route path="/my-trip" component={() => <AppLayout><MyTrip /></AppLayout>} />
        <Route path="/map" component={() => <AppLayout><TripMap /></AppLayout>} />
        <Route path="/tips" component={() => <AppLayout><Tips /></AppLayout>} />
        <Route path="/accommodations" component={() => <AppLayout><Accommodations /></AppLayout>} />
        <Route path="/apps" component={() => <AppLayout><UsefulApps /></AppLayout>} />
        <Route path="/shopping" component={() => <AppLayout><ShoppingList /></AppLayout>} />
        <Route path="/tasks" component={() => <AppLayout><TaskList /></AppLayout>} />
        <Route path="/transport" component={() => <AppLayout><Transport /></AppLayout>} />
        <Route path="/contacts" component={() => <AppLayout><Contacts /></AppLayout>} />
        <Route path="/preparation" component={() => <AppLayout><Preparation /></AppLayout>} />
        <Route path="/news" component={() => <AppLayout><News /></AppLayout>} />
        <Route path="/settings" component={() => <AppLayout><Settings /></AppLayout>} />
        <Route path="/legal" component={() => <AppLayout><Legal /></AppLayout>} />
        <Route component={() => <AppLayout><NotFound /></AppLayout>} />
      </Switch>
    </>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
