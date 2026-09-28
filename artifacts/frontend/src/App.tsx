import { lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/auth";
import { CookieBanner } from "@/components/cookie-banner";

const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/home"));
const Login = lazy(() => import("@/pages/login"));
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Admin = lazy(() => import("@/pages/admin"));
const TrackPage = lazy(() => import("@/pages/track"));
const Services = lazy(() => import("@/pages/services"));
const Calculator = lazy(() => import("@/pages/calculator"));
const Contact = lazy(() => import("@/pages/contact"));
const About = lazy(() => import("@/pages/about"));
const NewsPage = lazy(() => import("@/pages/news"));
const NewsArticlePage = lazy(() => import("@/pages/news-article"));
const PrivacyPolicy = lazy(() => import("@/pages/privacy"));
const Terms = lazy(() => import("@/pages/terms"));
const CookiePolicy = lazy(() => import("@/pages/cookies"));
const FaqPage = lazy(() => import("@/pages/faq"));
const ShippingPolicy = lazy(() => import("@/pages/shipping-policy"));
const InsurancePolicy = lazy(() => import("@/pages/insurance-policy"));
const ForgotPassword = lazy(() => import("@/pages/forgot-password"));
const ResetPassword = lazy(() => import("@/pages/reset-password"));
const ClaimQuote = lazy(() => import("@/pages/claim-quote"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageLoader() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: "3px solid #e5e7eb",
          borderTopColor: "#9CA763",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function AnimatedSwitch() {
  const [location] = useLocation();
  return (
    <Suspense fallback={<PageLoader />}>
      <div key={location} style={{ minHeight: "100vh" }}>
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/news/:slug" component={NewsArticlePage} />
          <Route path="/news" component={NewsPage} />
          <Route path="/services" component={Services} />
          <Route path="/calculator" component={Calculator} />
          <Route path="/contact" component={Contact} />
          <Route path="/privacy" component={PrivacyPolicy} />
          <Route path="/terms" component={Terms} />
          <Route path="/cookies" component={CookiePolicy} />
          <Route path="/faq" component={FaqPage} />
          <Route path="/shipping-policy" component={ShippingPolicy} />
          <Route path="/insurance-policy" component={InsurancePolicy} />
          <Route path="/track/:trackingNumber" component={TrackPage} />
          <Route path="/track" component={TrackPage} />
          <Route path="/login" component={Login} />
          <Route path="/forgot-password" component={ForgotPassword} />
          <Route path="/reset-password" component={ResetPassword} />
          <Route path="/claim-quote" component={ClaimQuote} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin" component={Admin} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </Suspense>
  );
}

function App() {
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <AnimatedSwitch />
              <CookieBanner />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
          <SonnerToaster position="bottom-right" theme="dark" richColors />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

export default App;
