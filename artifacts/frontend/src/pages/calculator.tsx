import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  CheckCircle2,
  Clock3,
  Loader2,
  Package,
  ShieldCheck,
  Truck,
  ArrowUpRight,
} from "lucide-react";
import ToolLayout, { ToolHero } from "@/shiprion/ToolLayout";
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
    if (loading) return;
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
    if (submitting) return;
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
  return (
    <ToolLayout page="calculator">
      <Helmet>
        <title>Shipping Rate Calculator — Shiprion</title>
        <meta
          name="description"
          content="Calculate a Shiprion shipping estimate and request a reviewed quote for air, road, and ocean freight."
        />
        <link rel="canonical" href="https://www.shiprion.com/calculator" />
      </Helmet>
      <ToolHero
        label="Shipping rate calculator"
        title={
          submitted ? (
            <>
              A clearer
              <br />
              <em>next step.</em>
            </>
          ) : (
            <>
              Plan your
              <br />
              <em>shipment.</em>
            </>
          )
        }
        description={
          submitted
            ? "Your shipping plans are with our operations team. We’ll email you when your reviewed offer is ready."
            : "Your route. Your cargo. A clearer picture of the cost. Calculate an estimate, then request a reviewed offer from our team."
        }
      />
      <div className="tool-shell tool-section">
        {submitted ? (
          <section className="tool-success" role="status">
            <CheckCircle2 aria-hidden="true" />
            <h2>Quote request received</h2>
            <p>
              Your reference is <strong>{submitted.reference}</strong>. We’ll
              email you when the reviewed offer is ready.
            </p>
            <a
              className="tool-button"
              href={user ? "/dashboard?section=quotes" : "/"}
            >
              {user ? "View dashboard" : "Return home"}
              <ArrowUpRight />
            </a>
          </section>
        ) : (
          <div className="tool-calculator-grid">
            <section aria-label="Shipment calculator" data-reveal>
              <div className="tool-form-block">
                <h2>01 / Shipment details</h2>
                <div className="tool-form-grid">
                  <Field label="Origin">
                    <input
                      value={origin}
                      onChange={(e) => {
                        setOrigin(e.target.value);
                        setEstimate(null);
                      }}
                      placeholder="City, country"
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Destination">
                    <input
                      value={destination}
                      onChange={(e) => {
                        setDestination(e.target.value);
                        setEstimate(null);
                      }}
                      placeholder="City, country"
                      autoComplete="off"
                    />
                  </Field>
                  <Field label="Actual weight (kg)">
                    <input
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
                    >
                      {[
                        "General Cargo",
                        "Documents",
                        "Electronics",
                        "Clothing & Textiles",
                        "Food & Perishables",
                        "Medical Supplies",
                        "Automotive Parts",
                        "Machinery",
                      ].map((type) => (
                        <option key={type}>{type}</option>
                      ))}
                    </select>
                  </Field>
                </div>
              </div>
              <div className="tool-form-block">
                <h2>02 / Choose your service</h2>
                {rates.length > 0 ? (
                  <div className="tool-service-grid">
                    {rates.map((rate) => (
                      <button
                        className="tool-service"
                        type="button"
                        key={rate.id}
                        aria-pressed={serviceCode === rate.code}
                        onClick={() => {
                          setServiceCode(rate.code);
                          setEstimate(null);
                        }}
                      >
                        <strong>{rate.name}</strong>
                        <span>{rate.description}</span>
                        <small>
                          <Clock3 size={16} />
                          {rate.transitDaysMin}–{rate.transitDaysMax} business
                          days
                        </small>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p>
                    {error
                      ? "No shipping services are available right now."
                      : "Loading current shipping services…"}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="tool-button tool-button-dark tool-button-full"
                onClick={calculate}
                disabled={
                  !complete || loading || rates.length === 0 || !serviceCode
                }
                aria-busy={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Calculating
                  </>
                ) : (
                  <>
                    Calculate estimate
                    <ArrowUpRight size={24} />
                  </>
                )}
              </button>
              {estimate && (
                <form
                  className="tool-form-block"
                  style={{ marginTop: 40 }}
                  onSubmit={(event) => {
                    event.preventDefault();
                    void submit();
                  }}
                  aria-busy={submitting}
                >
                  <h2>Contact and cargo notes</h2>
                  <div className="tool-form-grid">
                    <Field label="Full name">
                      <input
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        autoComplete="name"
                        required
                        minLength={2}
                        maxLength={120}
                      />
                    </Field>
                    <Field label="Email">
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        autoComplete="email"
                        required
                        maxLength={254}
                      />
                    </Field>
                    <Field label="Phone (optional)">
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        autoComplete="tel"
                      />
                    </Field>
                    <div className="tool-field-wide">
                      <Field label="Notes (optional)">
                        <textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Handling requirements or additional route details"
                          maxLength={2000}
                        />
                      </Field>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="tool-button tool-button-full"
                    style={{ marginTop: 28 }}
                    disabled={
                      submitting ||
                      contactName.trim().length < 2 ||
                      !contactEmail.includes("@")
                    }
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Sending request
                      </>
                    ) : (
                      <>
                        Send quote request
                        <ArrowUpRight size={24} />
                      </>
                    )}
                  </button>
                </form>
              )}
              {error && (
                <p className="tool-error" role="alert">
                  {error}
                </p>
              )}
            </section>
            <aside
              className="tool-estimate"
              aria-label="Shipping estimate"
              aria-live="polite"
              data-reveal
            >
              <small>Estimated total</small>
              <div className="tool-estimate-total">
                {estimate ? money(estimate.breakdown.totalCents) : "—"}
              </div>
              <p>USD · non-binding until reviewed</p>
              {estimate && (
                <dl>
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
              <div className="tool-estimate-notes">
                <p>
                  <ShieldCheck size={22} />
                  Final price is confirmed by Shiprion operations.
                </p>
                <p>
                  <CheckCircle2 size={22} />
                  Track reviewed quotes in your verified account.
                </p>
                <p>
                  <Truck size={22} />
                  No payment is collected here.
                </p>
              </div>
            </aside>
          </div>
        )}
      </div>
    </ToolLayout>
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
    <label className="tool-field">
      <span>{label}</span>
      {children}
    </label>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
