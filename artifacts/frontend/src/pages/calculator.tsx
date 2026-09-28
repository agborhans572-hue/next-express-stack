import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Package,
  ShieldCheck,
  Truck,
} from "lucide-react";
import { PublicNavbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth";
import { apiFetch } from "@/lib/api";

type Rate = {
  id: number;
  code: string;
  name: string;
  description: string;
  baseFeeCents: number;
  perKgCents: number;
  fuelPct: number;
  minWeightKg: number;
  maxWeightKg: number;
  transitDaysMin: number;
  transitDaysMax: number;
};
type Estimate = {
  rate: Rate;
  breakdown: {
    baseFeeCents: number;
    weightFeeCents: number;
    fuelSurchargeCents: number;
    totalCents: number;
    currency: "USD";
  };
};

const money = (cents: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    cents / 100,
  );

export default function CalculatorPage() {
  const { user } = useAuth();
  const query = useMemo(() => new URLSearchParams(window.location.search), []);
  const [rates, setRates] = useState<Rate[]>([]);
  const [serviceCode, setServiceCode] = useState(
    query.get("service") ?? "standard",
  );
  const [origin, setOrigin] = useState(query.get("origin") ?? "");
  const [destination, setDestination] = useState(
    query.get("destination") ?? "",
  );
  const [weight, setWeight] = useState(query.get("weight") ?? "");
  const [cargoType, setCargoType] = useState("General Cargo");
  const [contactName, setContactName] = useState(user?.fullName ?? "");
  const [contactEmail, setContactEmail] = useState(user?.email ?? "");
  const [contactPhone, setContactPhone] = useState(user?.phone ?? "");
  const [notes, setNotes] = useState("");
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState<{ reference: string } | null>(
    null,
  );

  useEffect(() => {
    void apiFetch<{ items: Rate[] }>("/rates")
      .then((data) => {
        if (!data || !Array.isArray(data.items))
          throw new Error("Service rates are temporarily unavailable.");
        setRates(data.items);
        if (
          !data.items.some((rate) => rate.code === serviceCode) &&
          data.items[0]
        )
          setServiceCode(data.items[0].code);
      })
      .catch(() =>
        setError(
          "Service rates are temporarily unavailable. Please try again shortly.",
        ),
      );
  }, []);
  useEffect(() => {
    if (user) {
      setContactEmail((v) => v || user.email);
      setContactName((v) => v || user.fullName || "");
      setContactPhone((v) => v || user.phone || "");
    }
  }, [user]);

  async function calculate() {
    setError("");
    setLoading(true);
    try {
      setEstimate(
        await apiFetch<Estimate>("/rates/estimate", {
          method: "POST",
          body: JSON.stringify({ serviceCode, weightKg: Number(weight) }),
        }),
      );
    } catch (e) {
      setEstimate(null);
      setError(
        e instanceof Error ? e.message : "Could not calculate an estimate.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    if (!estimate) {
      await calculate();
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const quote = await apiFetch<{ reference: string }>("/quotes", {
        method: "POST",
        body: JSON.stringify({
          serviceCode,
          contactName,
          contactEmail,
          contactPhone: contactPhone || undefined,
          origin,
          destination,
          cargoType,
          weightKg: Number(weight),
          notes: notes || undefined,
        }),
      });
      setSubmitted({ reference: quote.reference });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit your quote.");
    } finally {
      setSubmitting(false);
    }
  }

  const complete =
    origin.trim().length > 1 &&
    destination.trim().length > 1 &&
    Number(weight) > 0;
  if (submitted)
    return (
      <div className="min-h-screen bg-gray-50">
        <PublicNavbar />
        <main className="max-w-xl mx-auto px-6 py-24">
          <div className="bg-white border border-gray-200 rounded-3xl p-10 text-center shadow-sm">
            <CheckCircle2 className="w-14 h-14 text-olive-500 mx-auto mb-5" />
            <h1 className="text-3xl font-extrabold text-gray-900">
              Quote request received
            </h1>
            <p className="text-gray-500 mt-3">
              Your reference is{" "}
              <strong className="text-gray-900">{submitted.reference}</strong>.
              We’ll email you when the reviewed offer is ready.
            </p>
            <Button
              className="mt-8 bg-olive-500 hover:bg-olive-600"
              onClick={() =>
                window.location.assign(user ? "/dashboard?section=quotes" : "/")
              }
            >
              {user ? "View dashboard" : "Return home"}
            </Button>
          </div>
        </main>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Helmet>
        <title>Request a Shipping Quote | Shiprion</title>
        <meta
          name="description"
          content="Calculate an estimated Shiprion shipping rate and send the details to our operations team for a reviewed offer."
        />
      </Helmet>
      <PublicNavbar />
      <main className="max-w-6xl mx-auto px-5 py-14">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-bold tracking-[.2em] uppercase text-olive-600">
            Shipping estimate
          </p>
          <h1 className="text-4xl font-extrabold text-gray-900 mt-3">
            Plan your shipment
          </h1>
          <p className="text-gray-500 mt-3">
            See an instant estimate from our current service rates, then send
            your details for a reviewed offer. No payment is collected here.
          </p>
        </div>
        <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          <section className="bg-white border border-gray-200 rounded-3xl p-6 md:p-8 shadow-sm space-y-7">
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-olive-600" /> Shipment details
              </h2>
              <div className="grid md:grid-cols-2 gap-4 mt-5">
                <Field label="Origin">
                  <Input
                    value={origin}
                    onChange={(e) => {
                      setOrigin(e.target.value);
                      setEstimate(null);
                    }}
                    placeholder="City, country"
                  />
                </Field>
                <Field label="Destination">
                  <Input
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setEstimate(null);
                    }}
                    placeholder="City, country"
                  />
                </Field>
                <Field label="Actual weight (kg)">
                  <Input
                    type="number"
                    min="0.1"
                    step="0.1"
                    value={weight}
                    onChange={(e) => {
                      setWeight(e.target.value);
                      setEstimate(null);
                    }}
                    placeholder="10"
                  />
                </Field>
                <Field label="Cargo type">
                  <select
                    value={cargoType}
                    onChange={(e) => setCargoType(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                  >
                    <option>General Cargo</option>
                    <option>Documents</option>
                    <option>Electronics</option>
                    <option>Clothing & Textiles</option>
                    <option>Food & Perishables</option>
                    <option>Medical Supplies</option>
                    <option>Automotive Parts</option>
                    <option>Machinery</option>
                  </select>
                </Field>
              </div>
            </div>
            <div>
              <h2 className="font-bold text-gray-900 flex items-center gap-2">
                <Truck className="w-5 h-5 text-olive-600" /> Service
              </h2>
              {rates.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-3 mt-5">
                  {rates.map((rate) => (
                    <button
                      type="button"
                      key={rate.id}
                      onClick={() => {
                        setServiceCode(rate.code);
                        setEstimate(null);
                      }}
                      className={`text-left rounded-2xl border p-4 transition ${serviceCode === rate.code ? "border-olive-500 bg-olive-50 ring-2 ring-olive-500/10" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <span className="font-bold text-gray-900">
                        {rate.name}
                      </span>
                      <span className="block text-xs text-gray-500 mt-1">
                        {rate.description}
                      </span>
                      <span className="flex items-center gap-1 text-xs text-olive-700 mt-3">
                        <Clock3 className="w-3.5 h-3.5" />
                        {rate.transitDaysMin}–{rate.transitDaysMax} business
                        days
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-gray-500">
                  No active shipping services are available right now.
                </p>
              )}
            </div>
            <Button
              onClick={calculate}
              disabled={
                !complete || loading || rates.length === 0 || !serviceCode
              }
              className="w-full bg-gray-900 hover:bg-gray-800 h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Calculating
                </>
              ) : (
                "Calculate estimate"
              )}
            </Button>
            {estimate && (
              <div className="border-t border-gray-100 pt-7">
                <h2 className="font-bold text-gray-900">
                  Contact and cargo notes
                </h2>
                <div className="grid md:grid-cols-2 gap-4 mt-5">
                  <Field label="Full name">
                    <Input
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                    />
                  </Field>
                  <Field label="Email">
                    <Input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </Field>
                  <Field label="Phone (optional)">
                    <Input
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </Field>
                  <div className="md:col-span-2">
                    <Field label="Notes (optional)">
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Handling requirements or additional route details"
                      />
                    </Field>
                  </div>
                </div>
                <Button
                  onClick={submit}
                  disabled={
                    submitting ||
                    contactName.trim().length < 2 ||
                    !contactEmail.includes("@")
                  }
                  className="w-full mt-5 bg-olive-500 hover:bg-olive-600 h-11"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending
                      request
                    </>
                  ) : (
                    "Send quote request"
                  )}
                </Button>
              </div>
            )}
            {error && (
              <p
                role="alert"
                className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4"
              >
                {error}
              </p>
            )}
          </section>
          <aside className="bg-[#0b101a] text-white rounded-3xl p-7 lg:sticky lg:top-24">
            <p className="text-xs uppercase tracking-widest text-gray-400">
              Estimated total
            </p>
            <p className="text-4xl font-extrabold mt-3">
              {estimate ? money(estimate.breakdown.totalCents) : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-2">
              USD · non-binding until reviewed
            </p>
            {estimate && (
              <dl className="mt-7 space-y-3 text-sm">
                <Row
                  label="Base service"
                  value={money(estimate.breakdown.baseFeeCents)}
                />
                <Row
                  label="Weight charge"
                  value={money(estimate.breakdown.weightFeeCents)}
                />
                <Row
                  label="Fuel surcharge"
                  value={money(estimate.breakdown.fuelSurchargeCents)}
                />
              </dl>
            )}
            <div className="border-t border-white/10 mt-7 pt-7 space-y-4 text-sm text-gray-300">
              <p className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-olive-400 shrink-0" />{" "}
                Final price is confirmed by Shiprion operations.
              </p>
              <p className="flex gap-3">
                <CheckCircle2 className="w-5 h-5 text-olive-400 shrink-0" />{" "}
                Track reviewed quotes in your verified account.
              </p>
            </div>
          </aside>
        </div>
      </main>
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
      <Label>{label}</Label>
      {children}
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <dt className="text-gray-400">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
