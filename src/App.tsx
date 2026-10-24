import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  FileText,
  Mail,
  Menu,
  Radio,
  Route,
  Sunrise,
  X,
} from "lucide-react";
import { site } from "./config/site";
import { SampleReports, OperationsPreview, BeforeAfter, Confidence, OperationsTeam } from "./components/Operations";
import "./operations.css";
import { createEmailHref } from "./lib/email";
import { LegalPage } from "./components/LegalPage";
import { EnquiryForm } from "./components/EnquiryForm";

const nav = [
  ["Home", "home"],
  ["Services", "services"],
  ["How It Works", "how-it-works"],
  ["Sample Reports", "sample-reports"],
  ["About", "about"],
  ["Contact", "contact"],
] as const;

function Brand({ light = false }: { light?: boolean }) {
  return (
    <a
      href="/"
      className={`brand${light ? " brand-light" : ""}`}
      aria-label="Westline Dispatch home"
    >
      <svg
        className="brand-mark"
        viewBox="0 0 44 44"
        fill="none"
        aria-hidden="true"
      >
        <path d="M3 10h9l8 24h-9L3 10Z" fill="currentColor" />
        <path d="M16 10h9l8 24h-9l-8-24Z" fill="currentColor" />
        <path d="M30 10h11l-8 24-5-15 2-9Z" fill="#C9874C" />
      </svg>
      <span>
        WESTLINE<span className="brand-sub">DISPATCH</span>
      </span>
    </a>
  );
}

function EmailLink({
  children,
  intent = "sample",
  className = "button button-copper",
  arrow = true,
}: {
  children: ReactNode;
  intent?: "sample" | "proposal" | "contact";
  className?: string;
  arrow?: boolean;
}) {
  return (
    <a href={createEmailHref(intent)} className={className}>
      {children}
      {arrow ? <ArrowUpRight size={18} aria-hidden="true" /> : null}
    </a>
  );
}

function Header({ home }: { home: boolean }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const href = (id: string) => `${home ? "" : "/"}#${id}`;
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    const closeOutside = (event: PointerEvent) => {
      if (!header.current?.contains(event.target as Node)) setOpen(false);
    };
    const breakpoint = window.matchMedia("(min-width: 1050px)");
    const closeOnWide = () => {
      if (breakpoint.matches) setOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    document.addEventListener("pointerdown", closeOutside);
    breakpoint.addEventListener("change", closeOnWide);
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.removeEventListener("pointerdown", closeOutside);
      breakpoint.removeEventListener("change", closeOnWide);
    };
  }, [open]);
  return (
    <header className="site-header" ref={header}>
      <div className="container header-inner">
        <Brand />
        <nav aria-label="Main navigation" className="desktop-nav">
          {nav.map(([label, id]) => (
            <a key={id} href={href(id)}>
              {label}
            </a>
          ))}
        </nav>
        <EmailLink intent="proposal" className="button button-navy header-cta">
          Request Operations Support
        </EmailLink>
        <button
          ref={toggle}
          className="menu-toggle"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          aria-controls="mobile-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>
      <nav
        id="mobile-navigation"
        aria-label="Mobile navigation"
        className="mobile-nav"
        hidden={!open}
      >
        {nav.map(([label, id]) => (
          <a key={id} href={href(id)} onClick={() => setOpen(false)}>
            {label}
            <ArrowUpRight size={16} aria-hidden="true" />
          </a>
        ))}
        <EmailLink>Email Our Team</EmailLink>
      </nav>
    </header>
  );
}

const services = [
  {
    icon: Radio,
    title: "After-Hours Dispatch Support",
    text: "Help with incoming service requests, technician coordination, job updates, customer communications and escalation within agreed coverage hours.",
    detail: "COORDINATION, WITH CLEAR LIMITS",
  },
  {
    icon: FileText,
    title: "Invoicing & Documentation",
    text: "Turn technician notes and approved job information into organized service reports and invoice drafts ready for review.",
    detail: "FROM FIELD NOTES TO CLEAR RECORDS",
  },
  {
    icon: Sunrise,
    title: "Morning Shift Handovers",
    text: "Start the day with a clear picture of completed jobs, outstanding repairs, pending approvals and follow-ups.",
    detail: "A BETTER START FOR THE NEXT SHIFT",
  },
];
const steps = [
  [
    "Tell Us How You Operate",
    "Share working hours, approved rates, technicians, escalation contacts and existing workflows.",
  ],
  [
    "We Set Up Your Process",
    "Agree on responsibilities, coverage limits, reporting formats and approval requirements.",
  ],
  [
    "We Support Your Operations",
    "Our team handles agreed administrative tasks while your company remains in control of repair and financial decisions.",
  ],
  [
    "You Stay Informed",
    "Receive structured job records, invoice drafts and shift handovers.",
  ],
];
const questions = [
  [
    "Do we need to change our existing dispatch software?",
    "Not necessarily. We start by understanding the tools and workflows you already use. Access and compatibility are reviewed during onboarding, and any changes are agreed with you before work begins.",
  ],
  [
    "Can Westline work with our current invoicing process?",
    "We can discuss preparing invoice drafts in your existing process using your approved rates and job information. We agree on the tools, required details and review steps first. Your company retains final approval.",
  ],
  [
    "Do you only provide overnight dispatch?",
    "Our focus includes after-hours coordination, documentation, invoicing support and shift handovers. Available hours and responsibilities are agreed for each engagement; round-the-clock coverage is not assumed.",
  ],
  [
    "Can we start with invoicing and handover support?",
    "Yes. We can discuss a focused scope around documentation, invoice preparation and handovers, then agree on the work and coverage that fit your operation.",
  ],
  [
    "Who approves repair charges and parts purchases?",
    "Your company does. Westline works from your approved rates and escalation rules. Repair decisions, parts purchases, final invoices and financial approvals remain with your authorized team.",
  ],
  [
    "How will our customer information be handled?",
    "Access, confidentiality and approved tools are established during onboarding. We agree on the information needed for the work and how records will be shared. Please avoid sending customer records or account credentials in an initial enquiry.",
  ],
  [
    "How do we get started?",
    "Request a sample or email us with your company name, service area and the support you need. We will discuss your workflow and a tailored support proposal. You do not need to book a call to make an initial enquiry.",
  ],
];

function HomePage() {
  return (
    <main id="main-content">
      <section className="hero" id="home" aria-labelledby="hero-title">
        <div className="container hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-line" />
              BEHIND EVERY WELL-RUN REPAIR TEAM
            </p>
            <h1 id="hero-title">
              Your Repair Team Handles the Road.
              <br />
              <span>We Handle the Back Office.</span>
            </h1>
            <p className="hero-description">
              After-hours dispatch coordination, service documentation,
              invoicing support, and clear shift handovers for US mobile truck
              and trailer repair businesses.
            </p>
            <div className="hero-actions">
              <a className="button button-copper" href="#sample-reports">See a Sample Handover <ArrowDown size={17} aria-hidden="true" /></a>
              <a className="button button-ghost" href="#contact">
                Request Operations Support
                <ArrowDown size={17} aria-hidden="true" />
              </a>
            </div>
            <p className="hero-trust">
              <CheckCircle2 size={16} aria-hidden="true" />
              Human operations support. Not another software subscription.
            </p>
          </div>
          <OperationsPreview />
        </div>
        <div className="container hero-bottom">
          <span>FOCUSED ON THE WORK BEHIND THE WORK.</span>
          <div>
            <span>
              <b>01</b> Coordinate
            </span>
            <span>
              <b>02</b> Document
            </span>
            <span>
              <b>03</b> Hand over
            </span>
          </div>
        </div>
      </section>

      <BeforeAfter />

      <section
        id="services"
        className="section services-section"
        aria-labelledby="services-title"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">PRACTICAL SUPPORT, WHERE IT COUNTS</p>
              <h2 id="services-title">
                Keep the work moving.
                <br />
                Keep the details together.
              </h2>
            </div>
            <p>
              Dependable administrative support for the parts of the job that
              happen beyond the roadside.
            </p>
          </div>
          <div className="service-grid">
            {services.map(({ icon: Icon, title, text, detail }, i) => (
              <article className="service-card" key={title}>
                <div className="service-top">
                  <span className="service-icon">
                    <Icon size={28} strokeWidth={1.4} aria-hidden="true" />
                  </span>
                  <span className="service-number" aria-hidden="true">
                    0{i + 1}
                  </span>
                </div>
                <h3>{title}</h3>
                <p>{text}</p>
                <div className="service-detail">
                  <span>{detail}</span>
                  <ArrowUpRight size={17} aria-hidden="true" />
                </div>
              </article>
            ))}
          </div>
          <div className="service-footnote">
            <span>
              <Check size={17} aria-hidden="true" />
              Administrative support shaped around your repair workflow.
            </span>
            <a href={createEmailHref("proposal")}>
              Request a tailored support proposal
              <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        className="section process-section"
        aria-labelledby="process-title"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A CLEAR WAY TO WORK TOGETHER</p>
              <h2 id="process-title">Your Workflow. Our Support.</h2>
            </div>
            <p>
              We start with how you operate, then agree on where we can help.
            </p>
          </div>
          <div className="process-grid">
            {steps.map(([title, description], i) => (
              <article className="process-step" key={title}>
                <div className="step-track">
                  <span>0{i + 1}</span>
                  <div aria-hidden="true" />
                </div>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
          <p className="process-note">
            <Route size={19} aria-hidden="true" />
            No unnecessary software migration required.
          </p>
        </div>
      </section>

      <section
        id="sample-reports"
        className="section sample-section"
        aria-labelledby="sample-title"
      >
        <div className="container">
          <div className="section-heading">
            <div>
              <p className="eyebrow">LESS GUESSWORK. A CLEARER HANDOVER.</p>
              <h2 id="sample-title">See what the next shift sees.</h2>
            </div>
            <p>
              Three fictional documents. One connected repair workflow. Explore the details, then download a PDF without sharing your email.
            </p>
          </div>
          <SampleReports />
          <div className="sample-bottom">
            <p>
              The format is an example.
              <br />
              <strong>The workflow can be built around you.</strong>
            </p>
            <EmailLink className="button button-navy">
              Email Our Team
            </EmailLink>
          </div>
        </div>
      </section>

      <Confidence />
      <OperationsTeam />

      <section className="section faq-section" aria-labelledby="faq-title">
        <div className="container faq-grid">
          <div>
            <p className="eyebrow">BEFORE WE GET STARTED</p>
            <h2 id="faq-title">A few useful answers.</h2>
            <p className="section-description">
              Clear expectations make for a better working relationship.
            </p>
            <a className="text-link" href={createEmailHref("contact")}>
              Have another question?
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
          </div>
          <div className="faq-list">
            {questions.map(([question, answer]) => (
              <details className="faq-item" key={question}>
                <summary>
                  {question}
                  <ChevronDown size={20} aria-hidden="true" />
                </summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section
        id="contact"
        className="contact-section"
        aria-labelledby="contact-title"
      >
        <div className="container contact-grid">
          <div>
            <p className="eyebrow">LET’S GET THE DETAILS IN ORDER</p>
            <h2 id="contact-title">
              Spend Less Time Chasing Paperwork.
              <br />
              <span>Stay Focused on Repair Operations.</span>
            </h2>
            <p>
              See what a more organized back-office workflow could look like for
              your business.
            </p>
            <div className="contact-actions">
              <EmailLink intent="proposal">Request Operations Support</EmailLink>
              <EmailLink intent="contact" className="button button-outline">
                Email Our Team
              </EmailLink>
            </div>
            <p className="contact-small">
              Start with an email. Share what you need.
            </p>
          </div>
          <div className="contact-card">
            <Mail size={28} strokeWidth={1.4} aria-hidden="true" />
            <p>A SIMPLE FIRST STEP</p>
            <h3>
              Your operation.
              <br />
              Your questions.
              <br />
              Our inbox.
            </h3>
            <a href={createEmailHref("contact")}>
              {site.email}
              <ArrowUpRight size={17} aria-hidden="true" />
            </a>
            <span>Copy the address or open an email draft.</span>
          </div>
        </div>
        <EnquiryForm />
      </section>
    </main>
  );
}

function Footer() {
  const [year, setYear] = useState(new Date().getFullYear());
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-main">
          <div>
            <Brand />
            <p>
              Remote operations support for US mobile
              <br className="desktop-break" /> truck and trailer repair
              businesses.
            </p>
          </div>
          <nav aria-label="Footer services">
            <h2>OUR SUPPORT</h2>
            <a href="/#services">After-hours dispatch</a>
            <a href="/#services">Invoicing & documentation</a>
            <a href="/#services">Shift handovers</a>
          </nav>
          <div className="footer-contact">
            <h2>LET’S TALK OPERATIONS</h2>
            <a href={createEmailHref("contact")}>{site.email}</a>
            <a href="/#sample-reports">
              Explore the sample handover
              <ArrowUpRight size={14} aria-hidden="true" />
            </a>
            {site.operatingHours ? <p>{site.operatingHours}</p> : null}
            {site.postalAddress ? (
              <address>{site.postalAddress}</address>
            ) : null}
            {site.phone ? (
              <a href={`tel:${site.phone.replace(/[^+\d]/g, "")}`}>
                {site.phone}
              </a>
            ) : null}
            {site.teamLocations.length ? (
              <p>Team locations: {site.teamLocations.join(", ")}</p>
            ) : null}
            {site.socialLinks.map((link) => (
              <a href={link.url} key={link.url}>
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © <span suppressHydrationWarning>{year}</span> Westline Dispatch.
            All rights reserved.
          </span>
          <nav aria-label="Legal">
            <a href="/privacy/">Privacy Policy</a>
            <a href="/terms/">Terms of Service</a>
          </nav>
          <span className="footer-tagline">
            THE DETAILS MAKE THE DIFFERENCE.
          </span>
        </div>
      </div>
    </footer>
  );
}

export function App({ path }: { path: string }) {
  const legal =
    path.replace(/\/+$/, "") === "/privacy"
      ? "privacy"
      : path.replace(/\/+$/, "") === "/terms"
        ? "terms"
        : null;
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <Header home={!legal} />
      {legal ? <LegalPage kind={legal} /> : <HomePage />}
      <Footer />
    </>
  );
}
