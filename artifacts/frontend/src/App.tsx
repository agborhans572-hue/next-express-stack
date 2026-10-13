import { lazy, Suspense, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Helmet, HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/auth";
import { CookieBanner } from "@/components/cookie-banner";

const PublicPageLayout = lazy(() => import("@/shiprion/PublicPageLayout"));

const NotFound = lazy(() => import("@/pages/not-found"));
const Shiprion = lazy(() => import("@/shiprion/Shiprion"));
const Login = lazy(() => import("@/pages/login"));
const AdminLogin = lazy(() => import("@/pages/admin-login"));
const Dashboard = lazy(() => import("@/pages/dashboard"));
const Admin = lazy(() => import("@/pages/admin"));
const TrackPage = lazy(() => import("@/pages/track"));
const Services = lazy(() => import("@/pages/services"));
const Calculator = lazy(() => import("@/pages/calculator"));
const Contact = lazy(() => import("@/pages/contact"));
const NewsArticlePage = lazy(() => import("@/pages/news-article"));
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
          <Route path="/">
            <Shiprion page="home" />
          </Route>
          <Route path="/about">
            <Shiprion page="about" />
          </Route>
          <Route path="/tech">
            <Shiprion page="tech" />
          </Route>
          <Route path="/legal">
            <Shiprion page="legal" />
          </Route>
          <Route path="/news/:slug">
            <PublicPageLayout page="news">
              <NewsArticlePage />
            </PublicPageLayout>
          </Route>
          <Route path="/news">
            <Shiprion page="news" />
          </Route>
          <Route path="/services" component={Services} />
          <Route path="/calculator" component={Calculator} />
          <Route path="/contact" component={Contact} />
          <Route path="/privacy">
            <Shiprion page="privacy" />
          </Route>
          <Route path="/terms">
            <PublicPageLayout page="terms">
              <Terms />
            </PublicPageLayout>
          </Route>
          <Route path="/cookies">
            <PublicPageLayout page="cookies">
              <CookiePolicy />
            </PublicPageLayout>
          </Route>
          <Route path="/faq">
            <PublicPageLayout page="faq">
              <FaqPage />
            </PublicPageLayout>
          </Route>
          <Route path="/shipping-policy">
            <PublicPageLayout page="shipping-policy">
              <ShippingPolicy />
            </PublicPageLayout>
          </Route>
          <Route path="/insurance-policy">
            <PublicPageLayout page="insurance-policy">
              <InsurancePolicy />
            </PublicPageLayout>
          </Route>
          <Route path="/track/:trackingNumber" component={TrackPage} />
          <Route path="/track" component={TrackPage} />
          <Route path="/login" component={Login} />
          <Route path="/forgot-password">
            <PublicPageLayout page="forgot-password">
              <ForgotPassword />
            </PublicPageLayout>
          </Route>
          <Route path="/reset-password">
            <PublicPageLayout page="reset-password">
              <ResetPassword />
            </PublicPageLayout>
          </Route>
          <Route path="/claim-quote">
            <PublicPageLayout page="claim-quote">
              <ClaimQuote />
            </PublicPageLayout>
          </Route>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/admin/login" component={AdminLogin} />
          <Route path="/admin" component={Admin} />
          <Route>
            <PublicPageLayout page="not-found">
              <NotFound />
            </PublicPageLayout>
          </Route>
        </Switch>
      </div>
    </Suspense>
  );
}

function App() {
  useEffect(() => {
    document.getElementById("default-description")?.remove();
  }, []);
  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <DefaultDescription />
              <AnimatedSwitch />
              <LegacyCookieBanner />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
          <SonnerToaster position="bottom-right" theme="dark" richColors />
        </TooltipProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}

function DefaultDescription() {
  const [location] = useLocation();
  const hasPageDescription =
    [
      "/",
      "/about",
      "/tech",
      "/news",
      "/privacy",
      "/legal",
      "/services",
      "/calculator",
      "/contact",
      "/terms",
      "/cookies",
      "/faq",
      "/shipping-policy",
      "/insurance-policy",
      "/login",
    ].includes(location) ||
    location.startsWith("/track") ||
    location.startsWith("/news/");
  return hasPageDescription ? null : (
    <Helmet>
      <meta
        name="description"
        content="Ship smarter with Shiprion — enterprise logistics across 180+ countries. AI-optimized routing, real-time shipment tracking, air freight, road freight, and ocean freight with 24/7 support."
      />
    </Helmet>
  );
}

function LegacyCookieBanner() {
  const [location] = useLocation();
  return ["/login", "/dashboard", "/admin", "/admin/login"].includes(
    location,
  ) ? (
    <CookieBanner />
  ) : null;
}

export default App;
