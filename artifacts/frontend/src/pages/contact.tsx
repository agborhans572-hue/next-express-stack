import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { useEliteAnimations } from "@/hooks/useEliteAnimations";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useSubmitContact } from "@workspace/api-client-react";
import { useAuth } from "@/context/auth";
import { PublicNavbar } from "@/components/navbar";
import LiveChat from "@/components/LiveChat";
import GuestLiveChat from "@/components/GuestLiveChat";
import { FadeIn, StaggerList, StaggerItem } from "@/components/fade-in";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle2,
  Send,
  ArrowRight,
  MessageSquare,
  Headphones,
  Zap,
} from "lucide-react";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message too long"),
});

type ContactFormValues = z.infer<typeof contactSchema>;

const CONTACT_INFO = [
  {
    icon: Mail,
    label: "Email",
    value: "support@shiprion.com",
    sub: "We reply within 24 hours",
  },
  {
    icon: Phone,
    label: "Phone",
    value: "+1 (800) 794-8374",
    sub: "Mon–Fri, 8 AM–8 PM ET",
  },
  {
    icon: MapPin,
    label: "Address",
    value: "123 Logistics Way, New York, NY 10001",
    sub: "Headquarters",
  },
  {
    icon: Clock,
    label: "Support Hours",
    value: "24 / 7 Live Chat",
    sub: "Always available online",
  },
];

function SuccessState({
  name,
  onReset,
}: {
  name: string;
  onReset: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-12 space-y-4"
      data-testid="contact-success"
    >
      <div className="inline-flex w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full items-center justify-center mx-auto">
        <CheckCircle2 className="h-9 w-9 text-green-400" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Message sent!</h3>
        <p className="text-gray-500 text-sm max-w-xs mx-auto">
          Thanks{name ? `, ${name.split(" ")[0]}` : ""}! We've received your
          message and will get back to you within 24 hours.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
        <Button
          variant="outline"
          onClick={onReset}
          className="gap-1.5 border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          <Send className="h-4 w-4" />
          Send another message
        </Button>
        <Link href="/">
          <Button className="bg-olive-500 hover:bg-olive-400 gap-1.5 w-full sm:w-auto glow-olive-sm">
            Back to home
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    </motion.div>
  );
}

export default function Contact() {
  const [submitted, setSubmitted] = useState(false);
  const [submittedName, setSubmittedName] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const { user } = useAuth();
  useEliteAnimations();
  const submitContact = useSubmitContact();

  function handleOpenLiveChat() {
    setChatOpen(true);
  }

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  function onSubmit(values: ContactFormValues) {
    submitContact.mutate(
      { data: values },
      {
        onSuccess: () => {
          setSubmittedName(values.name);
          setSubmitted(true);
          form.reset();
        },
        onError: () => {
          form.setError("root", {
            message: "Something went wrong. Please try again.",
          });
        },
      },
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white">
      <Helmet>
        <title>Contact Shiprion | 24/7 Logistics Support</title>
        <meta
          name="description"
          content="Contact the Shiprion support team for shipping enquiries, claims, or tracking help. We respond within 24 hours. Live chat available around the clock."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shiprion.com/contact" />
        <meta property="og:type" content="website" />
        <meta
          property="og:title"
          content="Contact Shiprion | 24/7 Logistics Support"
        />
        <meta
          property="og:description"
          content="Reach our logistics support team for shipping enquiries, claims, or tracking help. 24/7 live chat and email support available."
        />
        <meta property="og:url" content="https://shiprion.com/contact" />
        <meta
          property="og:image"
          content="https://shiprion.com/opengraph.jpg"
        />
        <meta property="og:image:alt" content="Contact Shiprion Support" />
        <meta
          name="twitter:title"
          content="Contact Shiprion | 24/7 Logistics Support"
        />
        <meta
          name="twitter:description"
          content="Reach our logistics support team 24/7 — live chat, email, and phone support available."
        />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            url: "https://shiprion.com/contact",
            name: "Contact Shiprion",
            description: "Get in touch with Shiprion's logistics support team.",
            mainEntity: {
              "@type": "Organization",
              name: "Shiprion",
              url: "https://shiprion.com",
              email: "support@shiprion.com",
              contactPoint: [
                {
                  "@type": "ContactPoint",
                  contactType: "customer support",
                  availableLanguage: "English",
                  contactOption: "TollFree",
                },
              ],
            },
          })}
        </script>
      </Helmet>
      <PublicNavbar />

      <section className="bg-white relative overflow-hidden py-16 px-4 sm:px-6">
        <div className="absolute inset-0 bg-grid-pattern opacity-30" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-olive-500/8 rounded-full blur-[180px] animate-orb pointer-events-none" />
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <FadeIn direction="up">
            <div className="inline-flex p-3 bg-olive-500/10 border border-olive-500/20 rounded-2xl mb-4">
              <Headphones className="h-8 w-8 text-olive-400" />
            </div>
          </FadeIn>
          <FadeIn direction="up" delay={0.1}>
            <h1
              className="text-4xl font-bold text-gray-900 mb-3"
              data-testid="text-contact-title"
            >
              Get in Touch
            </h1>
          </FadeIn>
          <FadeIn direction="up" delay={0.2}>
            <p className="text-gray-500 max-w-lg mx-auto">
              Have a question or need help with a shipment? Our team is here for
              you — fill in the form and we'll get back to you promptly.
            </p>
          </FadeIn>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <FadeIn direction="up" className="lg:col-span-3">
            <div className="bg-white backdrop-blur-xl border border-gray-200 rounded-2xl overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-olive-400" />
                  Send us a message
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  All fields are required. We'll respond within 24 hours.
                </p>
              </div>
              <div className="p-6">
                {submitted ? (
                  <SuccessState
                    name={submittedName}
                    onReset={() => setSubmitted(false)}
                  />
                ) : (
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-5"
                      data-testid="contact-form"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-500 text-sm">
                              Full Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Jane Doe"
                                data-testid="input-contact-name"
                                className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 h-11 focus:border-olive-500/50 focus:ring-olive-500/20"
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
                          <FormItem>
                            <FormLabel className="text-gray-500 text-sm">
                              Email Address
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="jane@example.com"
                                data-testid="input-contact-email"
                                className="bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 h-11 focus:border-olive-500/50 focus:ring-olive-500/20"
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
                          <FormItem>
                            <FormLabel className="text-gray-500 text-sm">
                              Message
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Tell us how we can help..."
                                rows={5}
                                data-testid="input-contact-message"
                                className="resize-none bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400 focus:border-olive-500/50 focus:ring-olive-500/20"
                                {...field}
                              />
                            </FormControl>
                            <div className="flex items-center justify-between">
                              <FormMessage />
                              <span className="text-xs text-gray-600 ml-auto">
                                {field.value.length} / 2000
                              </span>
                            </div>
                          </FormItem>
                        )}
                      />

                      {form.formState.errors.root && (
                        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                          {form.formState.errors.root.message}
                        </p>
                      )}

                      <Button
                        type="submit"
                        className="w-full h-11 bg-olive-500 hover:bg-olive-400 text-white font-semibold gap-2 glow-olive-sm"
                        disabled={submitContact.isPending}
                        data-testid="button-send-message"
                      >
                        {submitContact.isPending ? (
                          "Sending..."
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Send Message
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                )}
              </div>
            </div>
          </FadeIn>

          <div className="lg:col-span-2 space-y-4">
            <FadeIn direction="right" delay={0.1}>
              <div className="gsap-blur-pop bg-white backdrop-blur-xl border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-6 pt-5 pb-3">
                  <h3 className="text-sm font-semibold text-gray-900">
                    Contact Information
                  </h3>
                </div>
                <div className="px-6 pb-5 space-y-5">
                  {CONTACT_INFO.map(({ icon: Icon, label, value, sub }) => (
                    <div key={label} className="flex items-start gap-3">
                      <div className="w-9 h-9 bg-olive-500/10 border border-olive-500/20 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="h-4 w-4 text-olive-400" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-0.5">{label}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {value}
                        </p>
                        <p className="text-xs text-gray-500">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.2}>
              <div className="bg-olive-500/10 border border-olive-500/20 rounded-2xl overflow-hidden">
                <div className="p-5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-olive-400 bg-olive-500/20 px-2.5 py-1 rounded-full mb-3">
                    <Zap className="h-3 w-3" /> Urgent?
                  </div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Live Chat Support
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    For time-sensitive shipment issues, our live chat team
                    responds in under 2 minutes.
                  </p>
                  <Button
                    size="sm"
                    onClick={handleOpenLiveChat}
                    className="w-full bg-olive-500 hover:bg-olive-400 text-white glow-olive-sm"
                  >
                    Open Live Chat
                  </Button>
                </div>
              </div>
            </FadeIn>

            <FadeIn direction="right" delay={0.3}>
              <div className="bg-white border border-gray-200 rounded-2xl p-4">
                <p className="text-xs text-gray-500 leading-relaxed">
                  <span className="font-semibold text-gray-500">
                    Privacy notice:
                  </span>{" "}
                  Your contact details are used solely to respond to your
                  enquiry and are never shared with third parties.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </div>

      <footer className="bg-white border-t border-gray-200 text-gray-600 py-8 px-4 sm:px-6 text-center text-xs">
        <p>© {new Date().getFullYear()} Shiprion. All rights reserved.</p>
      </footer>

      {user ? (
        <LiveChat forceOpen={chatOpen} />
      ) : (
        <GuestLiveChat forceOpen={chatOpen} />
      )}
    </div>
  );
}
