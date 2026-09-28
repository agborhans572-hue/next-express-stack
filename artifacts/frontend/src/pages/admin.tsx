import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  BarChart3,
  Bell,
  Check,
  CircleDollarSign,
  FileCheck2,
  LayoutDashboard,
  Loader2,
  LogOut,
  Map,
  Menu,
  MessageSquare,
  Package,
  Plus,
  Search,
  Settings,
  Shield,
  Truck,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/context/auth";
import {
  apiFetch,
  type Page,
  type Quote,
  type ServiceRate,
  type Shipment,
  type UserRecord,
  type UserRole,
  type UserStatus,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Panel =
  | "overview"
  | "quotes"
  | "shipments"
  | "map"
  | "rates"
  | "users"
  | "support";
type Contact = {
  id: number;
  name: string;
  email: string;
  message: string;
  status: string;
  createdAt: string;
};
type MapShipment = {
  id: number;
  trackingNumber: string;
  status: string;
  origin: string;
  destination: string;
  latitude: number | null;
  longitude: number | null;
  location: string | null;
  occurredAt: string | null;
};
type ChatSession = {
  id: number;
  userEmail: string;
  guestName: string | null;
  status: string;
  updatedAt: string;
};
type ChatMessage = {
  id: number;
  sessionId: number;
  senderRole: string;
  content: string;
  createdAt: string;
};
const money = (cents: number | null) =>
  cents == null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
      }).format(cents / 100);

export default function AdminPage() {
  const { user, isLoading, refetch } = useAuth();
  const [, navigate] = useLocation();
  const [panel, setPanel] = useState<Panel>("overview");
  const [mobile, setMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [rates, setRates] = useState<ServiceRate[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [map, setMap] = useState<MapShipment[]>([]);
  const isOperations = user?.role === "admin" || user?.role === "operator";
  const isSupport = user?.role === "admin" || user?.role === "support";

  async function refresh() {
    if (!user || user.role === "customer") return;
    setLoading(true);
    try {
      const jobs: Promise<void>[] = [];
      if (isOperations || user.role === "support")
        jobs.push(
          apiFetch<Page<Shipment>>("/shipments?pageSize=100").then((r) =>
            setShipments(r.items),
          ),
        );
      if (isOperations)
        jobs.push(
          apiFetch<Page<Quote>>("/quotes?pageSize=100").then((r) =>
            setQuotes(r.items),
          ),
          apiFetch<{ items: MapShipment[] }>("/shipments/map").then((r) =>
            setMap(r.items),
          ),
        );
      if (user.role === "operator")
        jobs.push(
          apiFetch<{ items: UserRecord[] }>("/customers").then((r) =>
            setUsers(r.items),
          ),
        );
      if (user.role === "admin")
        jobs.push(
          apiFetch<Page<UserRecord>>("/users?pageSize=100").then((r) =>
            setUsers(r.items),
          ),
          apiFetch<{ items: ServiceRate[] }>("/admin/rates").then((r) =>
            setRates(r.items),
          ),
        );
      if (isSupport)
        jobs.push(
          apiFetch<Page<Contact>>("/contact").then((r) => setContacts(r.items)),
        );
      await Promise.all(jobs);
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Could not load the operations console.",
      );
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    if (!isLoading && !user) navigate("/admin/login");
    else if (user?.role === "customer") navigate("/dashboard");
  }, [user, isLoading]);
  useEffect(() => {
    void refresh();
  }, [user?.id]);
  async function logout() {
    await apiFetch<void>("/auth/logout", { method: "POST" });
    refetch();
    navigate("/");
  }
  if (isLoading || !user || user.role === "customer") return <Loader />;

  const nav: {
    panel: Panel;
    label: string;
    icon: typeof Settings;
    show: boolean;
  }[] = [
    { panel: "overview", label: "Overview", icon: LayoutDashboard, show: true },
    {
      panel: "quotes",
      label: "Quotes",
      icon: CircleDollarSign,
      show: isOperations,
    },
    { panel: "shipments", label: "Shipments", icon: Package, show: true },
    { panel: "map", label: "Shipment map", icon: Map, show: isOperations },
    {
      panel: "rates",
      label: "Service rates",
      icon: Settings,
      show: user.role === "admin",
    },
    {
      panel: "users",
      label: "Users & access",
      icon: Users,
      show: user.role === "admin",
    },
    {
      panel: "support",
      label: "Support",
      icon: MessageSquare,
      show: isSupport,
    },
  ];
  return (
    <div className="min-h-screen bg-[#080b12] text-white flex">
      <aside
        className={`fixed lg:sticky top-0 z-40 h-screen w-72 bg-[#10141c] border-r border-white/10 transition-transform flex flex-col ${mobile ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div className="h-20 px-6 flex items-center justify-between border-b border-white/10">
          <button
            onClick={() => navigate("/")}
            className="font-extrabold text-xl"
          >
            Shiprion<span className="text-olive-400">.</span>
          </button>
          <button className="lg:hidden" onClick={() => setMobile(false)}>
            <X />
          </button>
        </div>
        <div className="p-5 border-b border-white/10">
          <p className="font-semibold truncate">
            {user.fullName || user.email}
          </p>
          <p className="text-xs text-olive-400 capitalize mt-1">{user.role}</p>
        </div>
        <nav className="p-3 space-y-1 flex-1">
          {nav
            .filter((n) => n.show)
            .map((n) => (
              <Nav
                key={n.panel}
                {...n}
                active={panel === n.panel}
                onClick={() => {
                  setPanel(n.panel);
                  setMobile(false);
                }}
              />
            ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white text-sm"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>
      </aside>
      {mobile && (
        <button
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setMobile(false)}
        />
      )}
      <main className="flex-1 min-w-0">
        <header className="h-20 px-5 md:px-8 border-b border-white/10 sticky top-0 bg-[#080b12]/90 backdrop-blur z-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setMobile(true)}>
              <Menu />
            </button>
            <div>
              <h1 className="font-bold capitalize">
                {panel.replaceAll("_", " ")}
              </h1>
              <p className="text-xs text-gray-500">
                Shiprion operations console
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Live
          </span>
        </header>
        <div className="p-5 md:p-8 max-w-[1500px] mx-auto">
          {loading ? (
            <div className="py-24 grid place-items-center">
              <Loader2 className="animate-spin text-olive-400" />
            </div>
          ) : (
            <>
              {panel === "overview" && (
                <Overview
                  shipments={shipments}
                  quotes={quotes}
                  contacts={contacts}
                  role={user.role}
                />
              )}{" "}
              {panel === "quotes" && isOperations && (
                <QuotesPanel quotes={quotes} refresh={refresh} />
              )}{" "}
              {panel === "shipments" && (
                <ShipmentsPanel
                  shipments={shipments}
                  users={users}
                  canEdit={isOperations}
                  refresh={refresh}
                />
              )}{" "}
              {panel === "map" && isOperations && <MapPanel items={map} />}{" "}
              {panel === "rates" && user.role === "admin" && (
                <RatesPanel rates={rates} refresh={refresh} />
              )}{" "}
              {panel === "users" && user.role === "admin" && (
                <UsersPanel users={users} refresh={refresh} />
              )}{" "}
              {panel === "support" && isSupport && (
                <SupportPanel contacts={contacts} refresh={refresh} />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function Overview({
  shipments,
  quotes,
  contacts,
  role,
}: {
  shipments: Shipment[];
  quotes: Quote[];
  contacts: Contact[];
  role: UserRole;
}) {
  const active = shipments.filter(
    (s) => !["delivered", "cancelled"].includes(s.status),
  ).length;
  const delivered = shipments.filter((s) => s.status === "delivered").length;
  const offered = quotes.filter((q) =>
    ["submitted", "under_review", "accepted"].includes(q.status),
  ).length;
  const openContacts = contacts.filter((c) => c.status !== "closed").length;
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-extrabold">Operational overview</h2>
        <p className="text-gray-500 mt-1">
          Live totals derived from Shiprion records.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Metric label="Active shipments" value={active} icon={Truck} />
        <Metric label="Delivered" value={delivered} icon={Check} />
        {role !== "support" && (
          <Metric
            label="Quotes requiring action"
            value={offered}
            icon={CircleDollarSign}
          />
        )}{" "}
        {role !== "operator" && (
          <Metric
            label="Open support messages"
            value={openContacts}
            icon={MessageSquare}
          />
        )}
      </div>
      <Card>
        <h3 className="font-bold">Recent shipments</h3>
        <div className="mt-5 divide-y divide-white/10">
          {shipments
            .slice(-8)
            .reverse()
            .map((s) => (
              <div key={s.id} className="py-4 flex items-center gap-4">
                <Package className="w-4 h-4 text-olive-400" />
                <div className="flex-1">
                  <p className="text-sm font-semibold">{s.trackingNumber}</p>
                  <p className="text-xs text-gray-500">
                    {s.origin} → {s.destination}
                  </p>
                </div>
                <Status value={s.status} />
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
}

function QuotesPanel({
  quotes,
  refresh,
}: {
  quotes: Quote[];
  refresh: () => Promise<void>;
}) {
  const review = async (id: number) => {
    await apiFetch(`/quotes/${id}/review`, { method: "PATCH" });
    await refresh();
  };
  const offer = async (q: Quote) => {
    const value = window.prompt(
      "Final offer in USD",
      ((q.finalPriceCents ?? q.estimatedPriceCents) / 100).toFixed(2),
    );
    if (!value) return;
    const cents = Math.round(Number(value) * 100);
    if (!Number.isFinite(cents) || cents < 0) {
      toast.error("Enter a valid USD amount.");
      return;
    }
    try {
      await apiFetch(`/quotes/${q.id}/offer`, {
        method: "POST",
        body: JSON.stringify({ finalPriceCents: cents, validDays: 14 }),
      });
      toast.success("Offer published.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not publish offer.");
    }
  };
  const convert = async (q: Quote) => {
    const recipientName = window.prompt("Recipient name", q.contactName);
    if (!recipientName) return;
    const recipientAddress = window.prompt(
      "Recipient delivery address",
      q.destination,
    );
    if (!recipientAddress) return;
    try {
      await apiFetch(`/quotes/${q.id}/convert`, {
        method: "POST",
        body: JSON.stringify({
          recipientName,
          recipientEmail: q.contactEmail,
          recipientPhone: q.contactPhone || undefined,
          recipientAddress,
        }),
      });
      toast.success("Shipment created from quote.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Conversion failed.");
    }
  };
  return (
    <div className="space-y-5">
      <Header
        title="Quote operations"
        subtitle="Review requests, publish offers, and convert accepted quotes."
      />
      <div className="grid xl:grid-cols-2 gap-4">
        {quotes.map((q) => (
          <Card key={q.id}>
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500">{q.reference}</p>
                <h3 className="font-bold mt-1">{q.contactName}</h3>
                <p className="text-sm text-gray-400 mt-1">
                  {q.origin} → {q.destination}
                </p>
              </div>
              <Status value={q.status} />
            </div>
            <div className="grid grid-cols-2 gap-4 mt-5">
              <Data label="Estimate" value={money(q.estimatedPriceCents)} />
              <Data label="Offer" value={money(q.finalPriceCents)} />
              <Data label="Weight" value={`${q.weightKg} kg`} />
              <Data
                label="Submitted"
                value={new Date(q.createdAt).toLocaleDateString()}
              />
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              {q.status === "submitted" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="border-white/10 text-gray-300"
                  onClick={() => review(q.id)}
                >
                  Start review
                </Button>
              )}
              {["submitted", "under_review", "offered"].includes(q.status) && (
                <Button
                  size="sm"
                  className="bg-olive-500 hover:bg-olive-600"
                  onClick={() => offer(q)}
                >
                  Publish offer
                </Button>
              )}
              {q.status === "accepted" && (
                <Button
                  size="sm"
                  className="bg-olive-500 hover:bg-olive-600"
                  onClick={() => convert(q)}
                >
                  Create shipment
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ShipmentsPanel({
  shipments,
  users,
  canEdit,
  refresh,
}: {
  shipments: Shipment[];
  users: UserRecord[];
  canEdit: boolean;
  refresh: () => Promise<void>;
}) {
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    customerId: "",
    senderName: "",
    recipientName: "",
    recipientEmail: "",
    recipientAddress: "",
    origin: "",
    destination: "",
    weightKg: "",
  });
  const customers = users.filter(
    (u) => u.role === "customer" && u.status === "active",
  );
  const filtered = shipments.filter((s) =>
    `${s.trackingNumber} ${s.origin} ${s.destination}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  async function create() {
    try {
      await apiFetch("/shipments", {
        method: "POST",
        body: JSON.stringify({
          ...form,
          customerId: Number(form.customerId),
          weightKg: form.weightKg ? Number(form.weightKg) : undefined,
          recipientEmail: form.recipientEmail || undefined,
          recipientAddress: form.recipientAddress || undefined,
        }),
      });
      toast.success("Shipment created.");
      setCreating(false);
      await refresh();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : "Could not create shipment.",
      );
    }
  }
  async function status(shipment: Shipment, next: string) {
    try {
      await apiFetch(`/shipments/${shipment.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Status update failed.");
    }
  }
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <Header
          title="Shipments"
          subtitle="Customer-owned shipment records and tracking progress."
        />
        {canEdit && (
          <Button
            onClick={() => setCreating((v) => !v)}
            className="bg-olive-500 hover:bg-olive-600"
          >
            <Plus className="w-4 h-4" /> Create shipment
          </Button>
        )}
      </div>
      {creating && (
        <Card>
          <h3 className="font-bold">Assign a new shipment</h3>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 mt-5">
            <Field label="Customer">
              <select
                value={form.customerId}
                onChange={(e) =>
                  setForm({
                    ...form,
                    customerId: e.target.value,
                    senderName:
                      customers.find((u) => u.id === Number(e.target.value))
                        ?.fullName ?? "",
                  })
                }
                className="control"
              >
                <option value="">Select customer</option>
                {customers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.email}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Origin">
              <Input
                className="control"
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
              />
            </Field>
            <Field label="Destination">
              <Input
                className="control"
                value={form.destination}
                onChange={(e) =>
                  setForm({ ...form, destination: e.target.value })
                }
              />
            </Field>
            <Field label="Weight kg">
              <Input
                className="control"
                type="number"
                value={form.weightKg}
                onChange={(e) => setForm({ ...form, weightKg: e.target.value })}
              />
            </Field>
            <Field label="Recipient name">
              <Input
                className="control"
                value={form.recipientName}
                onChange={(e) =>
                  setForm({ ...form, recipientName: e.target.value })
                }
              />
            </Field>
            <Field label="Recipient email">
              <Input
                className="control"
                value={form.recipientEmail}
                onChange={(e) =>
                  setForm({ ...form, recipientEmail: e.target.value })
                }
              />
            </Field>
            <Field label="Delivery address">
              <Input
                className="control"
                value={form.recipientAddress}
                onChange={(e) =>
                  setForm({ ...form, recipientAddress: e.target.value })
                }
              />
            </Field>
          </div>
          <Button
            className="mt-5 bg-olive-500 hover:bg-olive-600"
            disabled={
              !form.customerId ||
              !form.origin ||
              !form.destination ||
              !form.recipientName
            }
            onClick={create}
          >
            Create and notify customer
          </Button>
        </Card>
      )}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="control pl-10"
          placeholder="Search shipments"
        />
      </div>
      <div className="space-y-3">
        {filtered.map((s) => (
          <Card key={s.id}>
            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <p className="font-bold">{s.trackingNumber}</p>
                  <Status value={s.status} />
                  {s.ownershipNeedsReview && (
                    <span className="text-xs text-amber-400">
                      Customer assignment required
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {s.origin} → {s.destination} · {s.recipientName}
                </p>
              </div>
              {canEdit && (
                <ShipmentActions
                  shipment={s}
                  customers={customers}
                  updateStatus={status}
                  refresh={refresh}
                />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

const NEXT_STATUS: Record<string, string[]> = {
  registered: ["pending", "picked_up", "cancelled"],
  pending: ["picked_up", "cancelled"],
  picked_up: ["in_transit", "cancelled"],
  in_transit: ["customs", "out_for_delivery", "cancelled"],
  customs: ["in_transit", "out_for_delivery", "cancelled"],
  on_hold_customs: ["in_transit", "arrived_at_port", "cancelled"],
  arrived_at_port: ["out_for_delivery", "cancelled"],
  out_for_delivery: ["cancelled"],
};
function StatusSelect({
  shipment,
  update,
}: {
  shipment: Shipment;
  update: (shipment: Shipment, next: string) => Promise<void>;
}) {
  const options = NEXT_STATUS[shipment.status] ?? [];
  if (!options.length) return null;
  return (
    <select
      value={shipment.status}
      onChange={(event) => void update(shipment, event.target.value)}
      className="control w-auto"
    >
      <option value={shipment.status}>
        {shipment.status.replaceAll("_", " ")}
      </option>
      {options.map((value) => (
        <option key={value} value={value}>
          {value.replaceAll("_", " ")}
        </option>
      ))}
    </select>
  );
}
function ShipmentActions({
  shipment,
  customers,
  updateStatus,
  refresh,
}: {
  shipment: Shipment;
  customers: UserRecord[];
  updateStatus: (shipment: Shipment, next: string) => Promise<void>;
  refresh: () => Promise<void>;
}) {
  const assign = async (customerId: string) => {
    if (!customerId) return;
    try {
      await apiFetch(`/shipments/${shipment.id}/assign`, {
        method: "PATCH",
        body: JSON.stringify({ customerId: Number(customerId) }),
      });
      toast.success("Shipment assigned to customer.");
      await refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Assignment failed.",
      );
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {shipment.ownershipNeedsReview && (
        <select
          defaultValue=""
          onChange={(event) => void assign(event.target.value)}
          className="control w-auto"
        >
          <option value="">Assign customer...</option>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.fullName || customer.email}
            </option>
          ))}
        </select>
      )}
      <StatusSelect shipment={shipment} update={updateStatus} />
      {shipment.status === "out_for_delivery" && (
        <PodButton shipment={shipment} refresh={refresh} />
      )}
    </div>
  );
}

function PodButton({
  shipment,
  refresh,
}: {
  shipment: Shipment;
  refresh: () => Promise<void>;
}) {
  const upload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,application/pdf";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const recipientName = window.prompt(
        "Name of recipient who received the shipment",
        shipment.recipientName,
      );
      if (!recipientName) return;
      try {
        const signed = await apiFetch<{ objectKey: string; uploadUrl: string }>(
          "/uploads/presign",
          {
            method: "POST",
            body: JSON.stringify({
              shipmentId: shipment.id,
              fileName: file.name,
              contentType: file.type,
              size: file.size,
            }),
          },
        );
        const put = await fetch(signed.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!put.ok) throw new Error("File upload failed.");
        await apiFetch(`/shipments/${shipment.id}/proof-of-delivery`, {
          method: "POST",
          body: JSON.stringify({
            recipientName,
            deliveredAt: new Date().toISOString(),
            objectKey: signed.objectKey,
            originalFileName: file.name,
            contentType: file.type,
            fileSize: file.size,
          }),
        });
        toast.success("Delivery recorded.");
        await refresh();
      } catch (e) {
        toast.error(
          e instanceof Error ? e.message : "Could not record delivery.",
        );
      }
    };
    input.click();
  };
  return (
    <Button
      size="sm"
      onClick={upload}
      className="bg-emerald-600 hover:bg-emerald-500"
    >
      <FileCheck2 className="w-4 h-4" /> Record delivery
    </Button>
  );
}

function MapPanel({ items }: { items: MapShipment[] }) {
  return (
    <div className="space-y-5">
      <Header
        title="Shipment map"
        subtitle="Latest geocoded tracking locations for active shipments."
      />
      <div className="grid xl:grid-cols-2 gap-4">
        {items.map((item) => (
          <Card key={item.id}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold">{item.trackingNumber}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {item.location ?? `${item.origin} → ${item.destination}`}
                </p>
              </div>
              <Status value={item.status} />
            </div>
            {item.latitude != null && item.longitude != null ? (
              <iframe
                title={`Map for ${item.trackingNumber}`}
                className="w-full h-64 rounded-xl border-0"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${item.longitude - 1}%2C${item.latitude - 1}%2C${item.longitude + 1}%2C${item.latitude + 1}&layer=mapnik&marker=${item.latitude}%2C${item.longitude}`}
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="h-40 rounded-xl bg-white/5 grid place-items-center text-sm text-gray-500">
                No geocoded tracking event yet.
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function RatesPanel({
  rates,
  refresh,
}: {
  rates: ServiceRate[];
  refresh: () => Promise<void>;
}) {
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    base: "",
    perKg: "",
    fuel: "8",
    min: "0.1",
    max: "1000",
    daysMin: "1",
    daysMax: "5",
  });
  async function save() {
    try {
      await apiFetch("/admin/rates", {
        method: "POST",
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          description: form.description,
          baseFeeCents: Math.round(Number(form.base) * 100),
          perKgCents: Math.round(Number(form.perKg) * 100),
          fuelPct: Number(form.fuel),
          minWeightKg: Number(form.min),
          maxWeightKg: Number(form.max),
          transitDaysMin: Number(form.daysMin),
          transitDaysMax: Number(form.daysMax),
        }),
      });
      toast.success("New rate version activated.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save rate.");
    }
  }
  return (
    <div className="space-y-5">
      <Header
        title="Service rates"
        subtitle="Publishing a rate creates an immutable version and retires the prior active version."
      />
      <Card>
        <div className="grid sm:grid-cols-2 xl:grid-cols-5 gap-4">
          <Field label="Code">
            <Input
              className="control"
              value={form.code}
              onChange={(e) =>
                setForm({ ...form, code: e.target.value.toLowerCase() })
              }
            />
          </Field>
          <Field label="Name">
            <Input
              className="control"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </Field>
          <Field label="Base USD">
            <Input
              className="control"
              type="number"
              value={form.base}
              onChange={(e) => setForm({ ...form, base: e.target.value })}
            />
          </Field>
          <Field label="Per kg USD">
            <Input
              className="control"
              type="number"
              value={form.perKg}
              onChange={(e) => setForm({ ...form, perKg: e.target.value })}
            />
          </Field>
          <Field label="Fuel %">
            <Input
              className="control"
              type="number"
              value={form.fuel}
              onChange={(e) => setForm({ ...form, fuel: e.target.value })}
            />
          </Field>
          <Field label="Min kg">
            <Input
              className="control"
              value={form.min}
              onChange={(e) => setForm({ ...form, min: e.target.value })}
            />
          </Field>
          <Field label="Max kg">
            <Input
              className="control"
              value={form.max}
              onChange={(e) => setForm({ ...form, max: e.target.value })}
            />
          </Field>
          <Field label="Min days">
            <Input
              className="control"
              value={form.daysMin}
              onChange={(e) => setForm({ ...form, daysMin: e.target.value })}
            />
          </Field>
          <Field label="Max days">
            <Input
              className="control"
              value={form.daysMax}
              onChange={(e) => setForm({ ...form, daysMax: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <Input
              className="control"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
        </div>
        <Button className="mt-5 bg-olive-500 hover:bg-olive-600" onClick={save}>
          Publish rate version
        </Button>
      </Card>
      <div className="grid lg:grid-cols-2 gap-4">
        {rates.map((r) => (
          <Card key={r.id}>
            <div className="flex justify-between">
              <div>
                <p className="font-bold">
                  {r.name}{" "}
                  <span className="text-xs text-gray-500">v{r.version}</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {r.code} · {r.minWeightKg}–{r.maxWeightKg} kg
                </p>
              </div>
              <Status value={r.active ? "active" : "retired"} />
            </div>
            <p className="text-sm mt-4">
              {money(r.baseFeeCents)} base + {money(r.perKgCents)}/kg +{" "}
              {r.fuelPct}% fuel
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

function UsersPanel({
  users,
  refresh,
}: {
  users: UserRecord[];
  refresh: () => Promise<void>;
}) {
  const update = async (
    id: number,
    field: "role" | "status",
    value: string,
  ) => {
    try {
      await apiFetch(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ [field]: value }),
      });
      toast.success("Access updated; existing sessions were revoked.");
      await refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    }
  };
  return (
    <div className="space-y-5">
      <Header
        title="Users and access"
        subtitle="Role or status changes revoke active sessions immediately."
      />
      <div className="overflow-x-auto border border-white/10 rounded-2xl">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-gray-500">
            <tr>
              <th className="text-left p-4">User</th>
              <th className="text-left p-4">Role</th>
              <th className="text-left p-4">Status</th>
              <th className="text-left p-4">Verified</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-white/10">
                <td className="p-4">
                  <p className="font-semibold">{u.fullName || "No name"}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </td>
                <td className="p-4">
                  <select
                    value={u.role}
                    onChange={(e) => update(u.id, "role", e.target.value)}
                    className="control w-auto"
                  >
                    <option value="customer">Customer</option>
                    <option value="operator">Operator</option>
                    <option value="support">Support</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="p-4">
                  <select
                    value={u.status}
                    onChange={(e) => update(u.id, "status", e.target.value)}
                    className="control w-auto"
                  >
                    <option value="active">Active</option>
                    <option value="restricted">Restricted</option>
                    <option value="banned">Banned</option>
                  </select>
                </td>
                <td className="p-4">{u.emailVerified ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SupportPanel({
  contacts,
  refresh,
}: {
  contacts: Contact[];
  refresh: () => Promise<void>;
}) {
  const [tab, setTab] = useState<"contacts" | "chat">("contacts");
  const update = async (id: number, status: string) => {
    await apiFetch(`/contact/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    await refresh();
  };
  return (
    <div className="space-y-5">
      <Header
        title="Support inbox"
        subtitle="Customer messages and live conversations."
      />
      <div className="flex gap-2">
        <Button
          onClick={() => setTab("contacts")}
          variant={tab === "contacts" ? "default" : "outline"}
        >
          Contact messages
        </Button>
        <Button
          onClick={() => setTab("chat")}
          variant={tab === "chat" ? "default" : "outline"}
        >
          Live chat
        </Button>
      </div>
      {tab === "contacts" ? (
        <div className="space-y-3">
          {contacts.map((c) => (
            <Card key={c.id}>
              <div className="flex flex-col sm:flex-row justify-between gap-4">
                <div>
                  <p className="font-bold">
                    {c.name}{" "}
                    <span className="font-normal text-gray-500">
                      · {c.email}
                    </span>
                  </p>
                  <p className="text-sm text-gray-300 mt-3 whitespace-pre-wrap">
                    {c.message}
                  </p>
                  <p className="text-xs text-gray-600 mt-3">
                    {new Date(c.createdAt).toLocaleString()}
                  </p>
                </div>
                <select
                  value={c.status}
                  onChange={(e) => update(c.id, e.target.value)}
                  className="control w-auto self-start"
                >
                  <option value="new">New</option>
                  <option value="read">Read</option>
                  <option value="replied">Replied</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <ChatPanel />
      )}
    </div>
  );
}

function ChatPanel() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [active, setActive] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  useEffect(() => {
    void apiFetch<ChatSession[]>("/chat/sessions").then(setSessions);
  }, []);
  useEffect(() => {
    if (active)
      void apiFetch<ChatMessage[]>(`/chat/sessions/${active.id}/messages`).then(
        setMessages,
      );
  }, [active?.id]);
  const send = async () => {
    if (!active || !text.trim()) return;
    await apiFetch(`/chat/sessions/${active.id}/messages`, {
      method: "POST",
      body: JSON.stringify({ content: text.trim() }),
    });
    setText("");
    setMessages(
      await apiFetch<ChatMessage[]>(`/chat/sessions/${active.id}/messages`),
    );
  };
  return (
    <div className="grid lg:grid-cols-[300px_1fr] border border-white/10 rounded-2xl overflow-hidden min-h-[520px]">
      <div className="border-r border-white/10">
        {sessions.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s)}
            className={`w-full text-left p-4 border-b border-white/10 ${active?.id === s.id ? "bg-white/10" : "hover:bg-white/5"}`}
          >
            <p className="text-sm font-semibold">
              {s.guestName || s.userEmail}
            </p>
            <p className="text-xs text-gray-500 mt-1">{s.status}</p>
          </button>
        ))}
      </div>
      <div className="flex flex-col">
        {active ? (
          <>
            <div className="flex-1 p-5 space-y-3 overflow-y-auto max-h-[430px]">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.senderRole === "admin" || m.senderRole === "support" ? "justify-end" : "justify-start"}`}
                >
                  <div className="max-w-[75%] rounded-2xl bg-white/10 px-4 py-2 text-sm">
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t border-white/10 flex gap-2">
              <Input
                className="control"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void send();
                }}
              />
              <Button onClick={send} className="bg-olive-500">
                Send
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 grid place-items-center text-gray-500">
            Select a conversation
          </div>
        )}
      </div>
    </div>
  );
}

function Nav({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  panel: Panel;
  icon: typeof Settings;
  label: string;
  show: boolean;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm ${active ? "bg-olive-500 text-white" : "text-gray-400 hover:bg-white/5 hover:text-white"}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}
function Header({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold">{title}</h2>
      <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
    </div>
  );
}
function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/[.035] border border-white/10 rounded-2xl p-5 md:p-6">
      {children}
    </div>
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
      <div className="flex justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-extrabold mt-2">{value}</p>
        </div>
        <span className="w-11 h-11 rounded-xl bg-olive-500/10 grid place-items-center">
          <Icon className="w-5 h-5 text-olive-400" />
        </span>
      </div>
    </Card>
  );
}
function Status({ value }: { value: string }) {
  return (
    <span className="inline-flex self-start rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-semibold text-gray-300 capitalize">
      {value.replaceAll("_", " ")}
    </span>
  );
}
function Data({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-gray-500">{label}</dt>
      <dd className="text-sm mt-1">{value}</dd>
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
function Loader() {
  return (
    <div className="min-h-screen bg-[#080b12] grid place-items-center">
      <Loader2 className="animate-spin text-olive-400" />
    </div>
  );
}
