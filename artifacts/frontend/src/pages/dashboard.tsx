import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  Bell,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Package,
  type Settings,
  ShieldCheck,
  Truck,
  UserCircle,
  X,
} from "lucide-react";
import { useAuth } from "@/context/auth";
import {
  apiFetch,
  type Notification,
  type Page,
  type Quote,
  type Shipment,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LiveChat from "@/components/LiveChat";
import { toast } from "sonner";

type Section =
  | "overview"
  | "shipments"
  | "quotes"
  | "notifications"
  | "profile"
  | "support";
const money = (cents: number | null) =>
  cents == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(cents / 100);
const sectionFromUrl = (): Section => {
  const value = new URLSearchParams(window.location.search).get("section");
  return (
    [
      "overview",
      "shipments",
      "quotes",
      "notifications",
      "profile",
      "support",
    ] as Section[]
  ).includes(value as Section)
    ? (value as Section)
    : "overview";
};

export default function DashboardPage() {
  const { user, isLoading, refetch } = useAuth();
  const [, navigate] = useLocation();
  const [section, setSection] = useState<Section>(sectionFromUrl);
  const [mobile, setMobile] = useState(false);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [shipmentData, quoteData, notificationData] = await Promise.all([
        apiFetch<Page<Shipment>>("/shipments?pageSize=100"),
        apiFetch<Page<Quote>>("/quotes?pageSize=100"),
        apiFetch<Page<Notification> & { unread: number }>(
          "/notifications?pageSize=100",
        ),
      ]);
      setShipments(shipmentData.items);
      setQuotes(quoteData.items);
      setNotifications(notificationData.items);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load dashboard.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isLoading && !user) navigate("/login");
    else if (user && user.role !== "customer") navigate("/admin");
  }, [user, isLoading]);
  useEffect(() => {
    void refresh();
  }, [user?.id]);
  useEffect(() => {
    const socketHandler = () => void refresh();
    window.addEventListener("focus", socketHandler);
    return () => window.removeEventListener("focus", socketHandler);
  }, [user?.id]);
  useEffect(() => {
    if (__SOCKET_IO_ENABLED__ || !user) return;
    const timer = window.setInterval(() => void refresh(), 30_000);
    return () => window.clearInterval(timer);
  }, [user?.id]);

  function go(next: Section) {
    setSection(next);
    setMobile(false);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?section=${next}`,
    );
  }
  async function logout() {
    await apiFetch<void>("/auth/logout", { method: "POST" });
    refetch();
    navigate("/");
  }
  if (isLoading || !user || user.role !== "customer") return <ScreenLoader />;

  const unread = notifications.filter((item) => !item.readAt).length;
  return (
    <div className="min-h-screen bg-[#080d16] text-white flex">
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-72 bg-[#0d131f] border-r border-white/10 flex flex-col transition-transform ${mobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="h-20 px-6 flex items-center justify-between border-b border-white/10">
          <button
            onClick={() => navigate("/")}
            className="text-xl font-extrabold tracking-tight"
          >
            Shiprion<span className="text-olive-400">.</span>
          </button>
          <button className="md:hidden" onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>
        <div className="px-5 py-5 border-b border-white/10">
          <p className="font-semibold truncate">
            {user.fullName || user.email}
          </p>
          <p className="text-xs text-gray-500 truncate mt-1">{user.email}</p>
        </div>
        <nav className="p-3 flex-1 space-y-1">
          <Nav
            icon={LayoutDashboard}
            label="Overview"
            active={section === "overview"}
            onClick={() => go("overview")}
          />
          <Nav
            icon={Package}
            label="Shipments"
            count={shipments.length}
            active={section === "shipments"}
            onClick={() => go("shipments")}
          />
          <Nav
            icon={CircleDollarSign}
            label="Quotes"
            count={quotes.filter((q) => q.status === "offered").length}
            active={section === "quotes"}
            onClick={() => go("quotes")}
          />
          <Nav
            icon={Bell}
            label="Notifications"
            count={unread}
            active={section === "notifications"}
            onClick={() => go("notifications")}
          />
          <Nav
            icon={UserCircle}
            label="Profile & security"
            active={section === "profile"}
            onClick={() => go("profile")}
          />
          <Nav
            icon={MessageSquare}
            label="Support"
            active={section === "support"}
            onClick={() => go("support")}
          />
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          aria-label="Close menu"
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => setMobile(false)}
        />
      )}
      <main className="flex-1 min-w-0">
        <header className="h-20 border-b border-white/10 px-5 md:px-8 flex items-center justify-between sticky top-0 z-20 bg-[#080d16]/90 backdrop-blur">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setMobile(true)}>
              <Menu />
            </button>
            <div>
              <h1 className="font-bold capitalize">
                {section === "profile" ? "Profile & security" : section}
              </h1>
              <p className="text-xs text-gray-500 hidden sm:block">
                Your Shiprion customer portal
              </p>
            </div>
          </div>
          <button
            onClick={() => go("notifications")}
            className="relative w-10 h-10 rounded-xl bg-white/5 grid place-items-center"
          >
            <Bell className="w-4 h-4" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-olive-500 text-[10px] font-bold grid place-items-center">
                {unread}
              </span>
            )}
          </button>
        </header>
        <div className="p-5 md:p-8 max-w-7xl mx-auto">
          {loading ? (
            <div className="py-24 grid place-items-center">
              <Loader2 className="animate-spin text-olive-400" />
            </div>
          ) : (
            <>
              {section === "overview" && (
                <Overview
                  shipments={shipments}
                  quotes={quotes}
                  onSection={go}
                />
              )}
              {section === "shipments" && (
                <Shipments shipments={shipments} navigate={navigate} />
              )}
              {section === "quotes" && (
                <Quotes quotes={quotes} refresh={refresh} />
              )}
              {section === "notifications" && (
                <Notifications items={notifications} refresh={refresh} />
              )}
              {section === "profile" && (
                <Profile user={user} authRefresh={refetch} />
              )}
              {section === "support" && <Support />}
            </>
          )}
        </div>
      </main>
      <LiveChat />
    </div>
  );
}

function Overview({
  shipments,
  quotes,
  onSection,
}: {
  shipments: Shipment[];
  quotes: Quote[];
  onSection: (s: Section) => void;
}) {
  const active = shipments.filter(
    (s) => !["delivered", "cancelled"].includes(s.status),
  ).length;
  const delivered = shipments.filter((s) => s.status === "delivered").length;
  const offers = quotes.filter((q) => q.status === "offered").length;
  const recent = [...shipments]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 5);
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold">Welcome back</h2>
        <p className="text-gray-500 mt-1">
          Here’s the latest from your account.
        </p>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        <Metric label="Active shipments" value={active} icon={Truck} />
        <Metric label="Delivered" value={delivered} icon={Check} />
        <Metric
          label="Quotes to review"
          value={offers}
          icon={CircleDollarSign}
        />
      </div>
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="font-bold">Recent shipments</h3>
          <button
            onClick={() => onSection("shipments")}
            className="text-xs text-olive-400"
          >
            View all
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {recent.length ? (
            recent.map((s) => <ShipmentRow key={s.id} shipment={s} />)
          ) : (
            <Empty
              text="No shipments have been assigned yet."
              action="Request a quote"
              href="/calculator"
            />
          )}
        </div>
      </Card>
    </div>
  );
}

function Shipments({
  shipments,
  navigate,
}: {
  shipments: Shipment[];
  navigate: (path: string) => void;
}) {
  const [search, setSearch] = useState("");
  const filtered = shipments.filter((s) =>
    `${s.trackingNumber} ${s.origin} ${s.destination}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold">Shipments</h2>
          <p className="text-gray-500 text-sm mt-1">
            Shipments assigned to your account.
          </p>
        </div>
        <Button
          onClick={() => navigate("/calculator")}
          className="bg-olive-500 hover:bg-olive-600"
        >
          Request a quote
        </Button>
      </div>
      <Input
        className="bg-white/5 border-white/10 text-white max-w-md"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search tracking number or route"
      />
      <div className="space-y-3">
        {filtered.map((s) => (
          <Card key={s.id}>
            <ShipmentRow shipment={s} />
            <div className="mt-4 pt-4 border-t border-white/10 flex gap-3">
              <Button
                variant="outline"
                className="border-white/10 text-gray-300"
                onClick={() => navigate(`/track/${s.trackingNumber}`)}
              >
                Open tracking
              </Button>
              {s.status === "delivered" && <ProofButton shipmentId={s.id} />}
            </div>
          </Card>
        ))}
        {!filtered.length && (
          <Card>
            <Empty
              text="No matching shipments."
              action="Request a quote"
              href="/calculator"
            />
          </Card>
        )}
      </div>
    </div>
  );
}

function Quotes({
  quotes,
  refresh,
}: {
  quotes: Quote[];
  refresh: () => Promise<void>;
}) {
  const action = async (quote: Quote, name: "accept" | "reject") => {
    try {
      await apiFetch(`/quotes/${quote.id}/${name}`, { method: "POST" });
      toast.success(name === "accept" ? "Quote accepted." : "Quote declined.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed.");
    }
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">Quotes</h2>
          <p className="text-gray-500 text-sm mt-1">
            Review requests and approved offers.
          </p>
        </div>
        <Button
          onClick={() => window.location.assign("/calculator")}
          className="bg-olive-500 hover:bg-olive-600"
        >
          New request
        </Button>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        {quotes.map((q) => (
          <Card key={q.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500">{q.reference}</p>
                <h3 className="font-bold mt-1">
                  {q.origin} <span className="text-gray-600">→</span>{" "}
                  {q.destination}
                </h3>
              </div>
              <Status value={q.status} />
            </div>
            <dl className="grid grid-cols-2 gap-4 mt-5 text-sm">
              <Data
                label="Service estimate"
                value={money(q.estimatedPriceCents)}
              />
              <Data label="Final offer" value={money(q.finalPriceCents)} />
              <Data label="Cargo" value={`${q.cargoType} · ${q.weightKg} kg`} />
              <Data
                label="Valid until"
                value={
                  q.validUntil
                    ? new Date(q.validUntil).toLocaleDateString()
                    : "—"
                }
              />
            </dl>
            {q.status === "offered" && (
              <div className="flex gap-3 mt-5">
                <Button
                  onClick={() => action(q, "accept")}
                  className="bg-olive-500 hover:bg-olive-600"
                >
                  Accept offer
                </Button>
                <Button
                  onClick={() => action(q, "reject")}
                  variant="outline"
                  className="border-white/10 text-gray-300"
                >
                  Decline
                </Button>
              </div>
            )}
          </Card>
        ))}
        {!quotes.length && (
          <Card>
            <Empty
              text="You have not requested a quote yet."
              action="Request a quote"
              href="/calculator"
            />
          </Card>
        )}
      </div>
    </div>
  );
}

function Notifications({
  items,
  refresh,
}: {
  items: Notification[];
  refresh: () => Promise<void>;
}) {
  const read = async (id?: number) => {
    await apiFetch(
      id ? `/notifications/${id}/read` : "/notifications/read-all",
      { method: id ? "PATCH" : "POST" },
    );
    await refresh();
  };
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold">Notifications</h2>
          <p className="text-gray-500 text-sm mt-1">
            Account, quote, and shipment updates.
          </p>
        </div>
        <Button
          variant="outline"
          className="border-white/10 text-gray-300"
          onClick={() => read()}
        >
          Mark all read
        </Button>
      </div>
      <Card>
        {items.length ? (
          <div className="divide-y divide-white/10">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => !item.readAt && read(item.id)}
                className="w-full text-left py-4 flex gap-4"
              >
                <span
                  className={`mt-1 w-2 h-2 rounded-full ${item.readAt ? "bg-gray-700" : "bg-olive-400"}`}
                />
                <span className="flex-1">
                  <span className="font-semibold text-sm block">
                    {item.title}
                  </span>
                  <span className="text-sm text-gray-400 mt-1 block">
                    {item.message}
                  </span>
                  <span className="text-xs text-gray-600 mt-2 block">
                    {new Date(item.createdAt).toLocaleString()}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <Empty text="You’re all caught up." />
        )}
      </Card>
    </div>
  );
}

function Profile({
  user,
  authRefresh,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  authRefresh: () => void;
}) {
  type SessionRecord = { id: string; current: boolean; expiresAt: string };
  const [form, setForm] = useState({
    fullName: user.fullName ?? "",
    phone: user.phone ?? "",
    company: user.company ?? "",
  });
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [saving, setSaving] = useState(false);
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const loadSessions = async () => {
    try {
      const data = await apiFetch<{ items: SessionRecord[] }>("/auth/sessions");
      setSessions(data.items);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not load sessions.",
      );
    }
  };
  useEffect(() => {
    void loadSessions();
  }, []);
  const save = async () => {
    setSaving(true);
    try {
      await apiFetch("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(form),
      });
      authRefresh();
      toast.success("Profile updated.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };
  const changePassword = async () => {
    try {
      await apiFetch("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(password),
      });
      setPassword({ currentPassword: "", newPassword: "" });
      toast.success("Password changed and other sessions signed out.");
      await loadSessions();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Password change failed.");
    }
  };
  const revokeSession = async (id: string) => {
    try {
      await apiFetch(`/auth/sessions/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      toast.success("Session signed out.");
      await loadSessions();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not revoke session.",
      );
    }
  };
  return (
    <div className="grid lg:grid-cols-2 gap-5">
      <Card>
        <h2 className="text-lg font-bold">Profile</h2>
        <div className="space-y-4 mt-5">
          <Field label="Email">
            <Input
              disabled
              value={user.email}
              className="bg-white/5 border-white/10 text-gray-500"
            />
          </Field>
          <Field label="Full name">
            <Input
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </Field>
          <Field label="Company">
            <Input
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              className="bg-white/5 border-white/10 text-white"
            />
          </Field>
          <Button
            onClick={save}
            disabled={saving}
            className="bg-olive-500 hover:bg-olive-600"
          >
            Save profile
          </Button>
        </div>
      </Card>
      <Card>
        <h2 className="text-lg font-bold">Security</h2>
        <p className="text-sm text-gray-500 mt-1">
          Changing your password signs out every other session.
        </p>
        <div className="space-y-4 mt-5">
          <Field label="Current password">
            <Input
              type="password"
              value={password.currentPassword}
              onChange={(e) =>
                setPassword({ ...password, currentPassword: e.target.value })
              }
              className="bg-white/5 border-white/10 text-white"
            />
          </Field>
          <Field label="New password">
            <Input
              type="password"
              minLength={8}
              value={password.newPassword}
              onChange={(e) =>
                setPassword({ ...password, newPassword: e.target.value })
              }
              className="bg-white/5 border-white/10 text-white"
            />
          </Field>
          <Button
            onClick={changePassword}
            disabled={
              !password.currentPassword || password.newPassword.length < 8
            }
            variant="outline"
            className="border-white/10 text-gray-200"
          >
            <ShieldCheck className="w-4 h-4" /> Change password
          </Button>
        </div>
      </Card>
      <div className="lg:col-span-2">
        <Card>
          <h2 className="text-lg font-bold">Active sessions</h2>
          <p className="text-sm text-gray-500 mt-1">
            Review signed-in browsers and revoke access you no longer recognize.
          </p>
          <div className="divide-y divide-white/10 mt-5">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <p className="text-sm font-semibold">
                    {session.current ? "Current session" : "Signed-in session"}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Expires {new Date(session.expiresAt).toLocaleString()}
                  </p>
                </div>
                {session.current ? (
                  <span className="text-xs text-emerald-400">This browser</span>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-white/10 text-gray-200"
                    onClick={() => revokeSession(session.id)}
                  >
                    Sign out session
                  </Button>
                )}
              </div>
            ))}
            {!sessions.length && (
              <p className="py-4 text-sm text-gray-500">
                No active sessions are available.
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Support() {
  return (
    <Card>
      <div className="max-w-xl">
        <MessageSquare className="w-10 h-10 text-olive-400" />
        <h2 className="text-2xl font-extrabold mt-5">
          Talk to Shiprion support
        </h2>
        <p className="text-gray-400 mt-2">
          Use the chat button in the lower corner for account, quote, or
          shipment help. Your conversation is linked securely to this account.
        </p>
      </div>
    </Card>
  );
}
function ProofButton({ shipmentId }: { shipmentId: number }) {
  const open = async () => {
    try {
      const proof = await apiFetch<{ downloadUrl: string }>(
        `/shipments/${shipmentId}/proof-of-delivery`,
      );
      window.open(proof.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Proof is unavailable.");
    }
  };
  return (
    <Button
      onClick={open}
      variant="outline"
      className="border-white/10 text-gray-300"
    >
      <FileCheck2 className="w-4 h-4" /> Proof of delivery
    </Button>
  );
}
function ShipmentRow({ shipment }: { shipment: Shipment }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
      <div className="w-10 h-10 rounded-xl bg-olive-500/10 grid place-items-center">
        <Package className="w-5 h-5 text-olive-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold">{shipment.trackingNumber}</p>
        <p className="text-xs text-gray-500 mt-1 truncate">
          <MapPin className="w-3 h-3 inline mr-1" />
          {shipment.origin} → {shipment.destination}
        </p>
      </div>
      <Status value={shipment.status} />
    </div>
  );
}
function Status({ value }: { value: string }) {
  return (
    <span className="inline-flex self-start rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] font-semibold text-gray-300 capitalize">
      {value.replaceAll("_", " ")}
    </span>
  );
}
function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Truck;
}) {
  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-extrabold mt-2">{value}</p>
        </div>
        <span className="w-12 h-12 rounded-2xl bg-olive-500/10 grid place-items-center">
          <Icon className="w-5 h-5 text-olive-400" />
        </span>
      </div>
    </Card>
  );
}
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/[.035] border border-white/10 rounded-2xl p-5 md:p-6">
      {children}
    </div>
  );
}
function Nav({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: typeof Settings;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${active ? "bg-olive-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
    >
      <Icon className="w-4 h-4" />
      <span className="flex-1 text-left">{label}</span>
      {count ? (
        <span className="text-[10px] bg-black/20 px-2 py-0.5 rounded-full">
          {count}
        </span>
      ) : null}
    </button>
  );
}
function Empty({
  text,
  action,
  href,
}: {
  text: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-gray-500">{text}</p>
      {action && href && (
        <a
          href={href}
          className="inline-flex items-center gap-1 text-sm text-olive-400 mt-3"
        >
          {action}
          <ChevronRight className="w-4 h-4" />
        </a>
      )}
    </div>
  );
}
function Data({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="mt-1 text-gray-200">{value}</dd>
    </div>
  );
}
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-gray-300">{label}</Label>
      {children}
    </div>
  );
}
function ScreenLoader() {
  return (
    <div className="min-h-screen bg-[#080d16] grid place-items-center">
      <Loader2 className="w-7 h-7 animate-spin text-olive-400" />
    </div>
  );
}
