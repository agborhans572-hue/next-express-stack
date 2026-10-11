import { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSubmitContact, ApiError } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth";
import LiveChat from "@/components/LiveChat";
import GuestLiveChat from "@/components/GuestLiveChat";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ArrowUpRight, CheckCircle2, Loader2 } from "lucide-react";
import ToolLayout, { ToolHero } from "@/shiprion/ToolLayout";

const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be at most 100 characters"),
  email: z.string().trim().email("Please enter a valid email address").max(254),
  message: z
    .string()
    .trim()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message too long"),
});
type ContactFormValues = z.infer<typeof contactSchema>;

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [chatRequest, setChatRequest] = useState(0);
  const pending = useRef(false);
  const { user } = useAuth();
  const submitContact = useSubmitContact();
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });
  function onSubmit(values: ContactFormValues) {
    if (pending.current) return;
    pending.current = true;
    form.clearErrors("root");
    submitContact.mutate(
      { data: { ...values, email: values.email.toLowerCase() } },
      {
        onSuccess: () => {
          setSubmittedName(values.name);
          setSubmitted(true);
          form.reset();
        },
        onError: (error) => {
          form.setError("root", {
            message:
              error instanceof ApiError && error.status === 429
                ? "Too many attempts. Please try again later. Your details have been kept."
                : "We couldn’t send your message. Please try again. Your details have been kept.",
          });
        },
        onSettled: () => {
          pending.current = false;
        },
      },
    );
  }
  return (
    <>
      <ToolLayout page="contact">
        <Helmet>
          <title>Contact Shiprion — Get in touch</title>
          <meta
            name="description"
            content="Contact Shiprion for shipping enquiries, claims, quotes, and tracking help. Reach our logistics team by email, phone, or live chat."
          />
          <link rel="canonical" href="https://www.shiprion.com/contact" />
        </Helmet>
        <ToolHero
          label="Contact Shiprion"
          title={
            <>
              Let’s move
              <br />
              <em>forward.</em>
            </>
          }
          description="A shipment to plan. A question to ask. An idea to share. Our logistics team is here to help you take the next step."
        >
          <a className="tool-link" href="mailto:support@shiprion.com">
            support@shiprion.com
            <ArrowUpRight size={20} />
          </a>
        </ToolHero>
        <div className="tool-shell tool-section tool-contact-grid">
          <section className="tool-contact-form" data-reveal>
            <h2 data-testid="text-contact-title">Get in Touch</h2>
            <p>Send us a message. All fields are required.</p>
            {submitted ? (
              <div
                className="tool-success"
                role="status"
                data-testid="contact-success"
              >
                <CheckCircle2 aria-hidden="true" />
                <h2>Message sent!</h2>
                <p>
                  Thanks
                  {submittedName ? `, ${submittedName.split(" ")[0]}` : ""}!
                  We’ve received your message and will get back to you within 24
                  hours.
                </p>
                <button
                  className="tool-button"
                  onClick={() => setSubmitted(false)}
                >
                  Send another message
                  <ArrowUpRight />
                </button>
              </div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  data-testid="contact-form"
                  noValidate
                  aria-busy={submitContact.isPending}
                >
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="tool-field">
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <input
                            placeholder="Jane Doe"
                            autoComplete="name"
                            maxLength={100}
                            data-testid="input-contact-name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="tool-field">
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <input
                            type="email"
                            placeholder="jane@example.com"
                            autoComplete="email"
                            maxLength={254}
                            data-testid="input-contact-email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem className="tool-field">
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <textarea
                            placeholder="Tell us how we can help…"
                            rows={6}
                            maxLength={2000}
                            data-testid="input-contact-message"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <small>{field.value.length} / 2000</small>
                      </FormItem>
                    )}
                  />
                  {form.formState.errors.root && (
                    <p className="tool-error" role="alert">
                      {form.formState.errors.root.message}
                    </p>
                  )}
                  <button
                    type="submit"
                    className="tool-button tool-button-full"
                    disabled={submitContact.isPending}
                    data-testid="button-send-message"
                  >
                    {submitContact.isPending ? (
                      <>
                        Sending…
                        <Loader2 className="animate-spin" size={20} />
                      </>
                    ) : (
                      <>
                        Send Message
                        <ArrowUpRight size={24} />
                      </>
                    )}
                  </button>
                </form>
              </Form>
            )}
          </section>
          <aside data-reveal>
            <section className="tool-contact-info">
              <h2>Here to help.</h2>
              <div className="tool-contact-item">
                <small>Email / We reply within 24 hours</small>
                <a href="mailto:support@shiprion.com">support@shiprion.com</a>
              </div>
              <div className="tool-contact-item">
                <small>Phone / Mon–Fri, 8 AM–8 PM ET</small>
                <a href="tel:+18007948374">+1 (800) 794-8374</a>
              </div>
              <div className="tool-contact-item">
                <small>Main Office</small>
                <p>
                  123 Logistics Way
                  <br />
                  New York, NY 10001
                  <br />
                  United States
                </p>
              </div>
            </section>
            <section className="tool-chat-card">
              <h3>Need a conversation?</h3>
              <p>
                For a shipment update or a time-sensitive question, connect with
                our support team in live chat.
              </p>
              <button
                className="tool-button tool-button-dark tool-button-full"
                onClick={() => setChatRequest((request) => request + 1)}
              >
                Open Live Chat
                <ArrowUpRight size={22} />
              </button>
            </section>
            <p className="tool-privacy-note">
              We use your contact details to respond to your enquiry.{" "}
              <a href="/privacy" className="tool-link">
                Privacy Policy
                <ArrowUpRight size={16} />
              </a>
            </p>
          </aside>
        </div>
      </ToolLayout>
      <div className="tool-support-chat">
        {user ? (
          <LiveChat openRequest={chatRequest} />
        ) : (
          <GuestLiveChat openRequest={chatRequest} />
        )}
      </div>
    </>
  );
}
