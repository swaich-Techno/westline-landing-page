import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronDown, ClipboardCheck, Clock3, FileCheck2, FileText, Mail, Menu, MessageSquareText, Radio, Route, ShieldCheck, Sunrise, Truck, Wrench, X } from 'lucide-react';
import { site } from './config/site';
import { jobs, type Job } from './data/jobs';
import { createEmailHref } from './lib/email';
import { LegalPage } from './components/LegalPage';

const nav = [['Home', 'home'], ['Services', 'services'], ['How It Works', 'how-it-works'], ['Sample Reports', 'sample-reports'], ['About', 'about'], ['Contact', 'contact']] as const;

function Brand({ light = false }: { light?: boolean }) {
  return <a href="/" className={`brand${light ? ' brand-light' : ''}`} aria-label="Westline Dispatch home">
    <svg className="brand-mark" viewBox="0 0 44 44" fill="none" aria-hidden="true"><path d="M3 10h9l8 24h-9L3 10Z" fill="currentColor" /><path d="M16 10h9l8 24h-9l-8-24Z" fill="currentColor" /><path d="M30 10h11l-8 24-5-15 2-9Z" fill="#C9874C" /></svg>
    <span>WESTLINE<span className="brand-sub">DISPATCH</span></span>
  </a>;
}

function EmailLink({ children, intent = 'sample', className = 'button button-copper', arrow = true }: { children: ReactNode; intent?: 'sample' | 'proposal' | 'contact'; className?: string; arrow?: boolean }) {
  return <a href={createEmailHref(intent)} className={className}>{children}{arrow ? <ArrowUpRight size={18} aria-hidden="true" /> : null}</a>;
}

function Header({ home }: { home: boolean }) {
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const header = useRef<HTMLElement>(null);
  const href = (id: string) => `${home ? '' : '/'}#${id}`;
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } };
    const closeOutside = (event: PointerEvent) => { if (!header.current?.contains(event.target as Node)) setOpen(false); };
    const breakpoint = window.matchMedia('(min-width: 1050px)');
    const closeOnWide = () => { if (breakpoint.matches) setOpen(false); };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOutside);
    breakpoint.addEventListener('change', closeOnWide);
    return () => { document.removeEventListener('keydown', closeOnEscape); document.removeEventListener('pointerdown', closeOutside); breakpoint.removeEventListener('change', closeOnWide); };
  }, [open]);
  return <header className="site-header" ref={header}>
    <div className="container header-inner">
      <Brand />
      <nav aria-label="Main navigation" className="desktop-nav">{nav.map(([label, id]) => <a key={id} href={href(id)}>{label}</a>)}</nav>
      <EmailLink className="button button-navy header-cta">Request a Sample</EmailLink>
      <button ref={toggle} className="menu-toggle" aria-label={open ? 'Close navigation' : 'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
    </div>
    <nav id="mobile-navigation" aria-label="Mobile navigation" className="mobile-nav" hidden={!open}>{nav.map(([label, id]) => <a key={id} href={href(id)} onClick={() => setOpen(false)}>{label}<ArrowUpRight size={16} aria-hidden="true" /></a>)}<EmailLink>Request a Sample</EmailLink></nav>
  </header>;
}

function Status({ job }: { job: Job }) {
  return <span className={`status ${job.completed ? 'status-complete' : 'status-pending'}`}><span aria-hidden="true" />{job.status}</span>;
}

function HeroReport() {
  return <div className="hero-art">
    <div className="orbit orbit-one" aria-hidden="true" /><div className="orbit orbit-two" aria-hidden="true" />
    <div className="report-overline"><span className="small-rule" />FROM THE LAST SHIFT TO THE NEXT.</div>
    <div className="hero-report">
      <div className="hero-report-head"><span className="report-brand"><span className="report-square" />WESTLINE</span><span className="demo-label">DEMONSTRATION DATA</span></div>
      <div className="hero-report-title"><div><p className="report-kicker">THE OVERNIGHT PICTURE</p><h2>Morning handover</h2></div><Sunrise size={32} strokeWidth={1.4} aria-hidden="true" /></div>
      <div className="report-column-head"><span>JOB / UNIT</span><span>WHERE THINGS STAND</span></div>
      {jobs.map(job => <div className="hero-job" key={job.id}><div className="hero-unit"><span>{job.id}</span><strong>Unit {job.unit}</strong></div><div><p>{job.issue}</p><Status job={job} /></div></div>)}
      <div className="report-bottom"><FileCheck2 size={17} aria-hidden="true" /><span>Job details. Open items. Clear next steps.</span></div>
    </div>
    <div className="handover-note"><span className="note-icon"><ClipboardCheck size={22} aria-hidden="true" /></span><div><strong>A clearer start to the day.</strong><span>The details your next shift needs.</span></div></div>
    <p className="hero-example-note">Illustrative example — not a real customer record.</p>
  </div>;
}

const services = [
  { icon: Radio, title: 'After-Hours Dispatch Support', text: 'Help with incoming service requests, technician coordination, job updates, customer communications and escalation within agreed coverage hours.', detail: 'COORDINATION, WITH CLEAR LIMITS' },
  { icon: FileText, title: 'Invoicing & Documentation', text: 'Turn technician notes and approved job information into organized service reports and invoice drafts ready for review.', detail: 'FROM FIELD NOTES TO CLEAR RECORDS' },
  { icon: Sunrise, title: 'Morning Shift Handovers', text: 'Start the day with a clear picture of completed jobs, outstanding repairs, pending approvals and follow-ups.', detail: 'A BETTER START FOR THE NEXT SHIFT' },
];
const steps = [
  ['Tell Us How You Operate', 'Share working hours, approved rates, technicians, escalation contacts and existing workflows.'],
  ['We Set Up Your Process', 'Agree on responsibilities, coverage limits, reporting formats and approval requirements.'],
  ['We Support Your Operations', 'Our team handles agreed administrative tasks while your company remains in control of repair and financial decisions.'],
  ['You Stay Informed', 'Receive structured job records, invoice drafts and shift handovers.'],
];
const questions = [
  ['Do we need to change our existing dispatch software?', 'Not necessarily. We start by understanding the tools and workflows you already use. Access and compatibility are reviewed during onboarding, and any changes are agreed with you before work begins.'],
  ['Can Westline work with our current invoicing process?', 'We can discuss preparing invoice drafts in your existing process using your approved rates and job information. We agree on the tools, required details and review steps first. Your company retains final approval.'],
  ['Do you only provide overnight dispatch?', 'Our focus includes after-hours coordination, documentation, invoicing support and shift handovers. Available hours and responsibilities are agreed for each engagement; round-the-clock coverage is not assumed.'],
  ['Can we start with invoicing and handover support?', 'Yes. We can discuss a focused scope around documentation, invoice preparation and handovers, then agree on the work and coverage that fit your operation.'],
  ['Who approves repair charges and parts purchases?', 'Your company does. Westline works from your approved rates and escalation rules. Repair decisions, parts purchases, final invoices and financial approvals remain with your authorized team.'],
  ['How will our customer information be handled?', 'Access, confidentiality and approved tools are established during onboarding. We agree on the information needed for the work and how records will be shared. Please avoid sending customer records or account credentials in an initial enquiry.'],
  ['How do we get started?', 'Request a sample or email us with your company name, service area and the support you need. We will discuss your workflow and a tailored support proposal. You do not need to book a call to make an initial enquiry.'],
];

function HandoverDemo() {
  const [filter, setFilter] = useState('all');
  const visible = jobs.filter(job => filter === 'all' || (filter === 'completed' ? job.completed : !job.completed));
  return <div className="handover-dashboard">
    <div className="dashboard-heading"><div><div className="report-brand"><span className="report-square" />WESTLINE <span className="brand-dash">/</span> MORNING HANDOVER</div><p>A shared picture for the next shift.</p></div><span className="demo-label">DEMONSTRATION DATA</span></div>
    <div className="dashboard-toolbar"><div className="filter-group" role="group" aria-label="Filter sample jobs">{[['all', 'All jobs'], ['completed', 'Completed repairs'], ['pending', 'Pending repairs']].map(([value, label]) => <button key={value} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div><span className="job-count" aria-live="polite">{visible.length} {visible.length === 1 ? 'job' : 'jobs'} shown</span></div>
    <div className="dashboard-column-head" aria-hidden="true"><span>JOB / UNIT</span><span>REPAIR DETAILS</span><span>JOB STATUS</span><span /></div>
    <div className="job-list">{visible.map(job => <details key={job.id} className="job-detail"><summary><span className="job-identity"><span className="job-number">{job.id}</span><strong>Unit {job.unit}</strong></span><span className="job-issue">{job.issue}</span><Status job={job} /><ChevronDown size={19} className="disclosure-icon" aria-hidden="true" /><span className="sr-only"> — View job details</span></summary><div className="job-expanded"><span><span className="detail-label">{job.invoice ? 'INVOICE' : 'FOLLOW-UP'}</span><strong>{job.invoice || job.followUp}</strong></span><span><span className="detail-label">REVIEW RESPONSIBILITY</span><span>Your authorized repair team</span></span></div></details>)}</div>
    <div className="dashboard-footer"><ShieldCheck size={17} aria-hidden="true" /><p>Illustrative example — not a real customer record.</p><span>Repair and financial decisions stay with you.</span></div>
  </div>;
}

function HomePage() {
  return <main id="main-content">
    <section className="hero" id="home" aria-labelledby="hero-title"><div className="container hero-grid"><div className="hero-copy"><p className="eyebrow"><span className="eyebrow-line" />BEHIND EVERY WELL-RUN REPAIR TEAM</p><h1 id="hero-title">Your Repair Team Handles the Road.<br /><span>We Handle the Back Office.</span></h1><p className="hero-description">After-hours dispatch coordination, service documentation, invoicing support, and clear shift handovers for US mobile truck and trailer repair businesses.</p><div className="hero-actions"><EmailLink>Request a Sample Handover</EmailLink><a className="button button-ghost" href="#services">Explore Our Services<ArrowDown size={17} aria-hidden="true" /></a></div><p className="hero-trust"><CheckCircle2 size={16} aria-hidden="true" />Built around real-world mobile repair workflows.</p></div><HeroReport /></div><div className="container hero-bottom"><span>FOCUSED ON THE WORK BEHIND THE WORK.</span><div><span><b>01</b> Coordinate</span><span><b>02</b> Document</span><span><b>03</b> Hand over</span></div></div></section>

    <section className="section problem-section" aria-labelledby="problem-title"><div className="container problem-grid"><div><p className="eyebrow">THE WORK DOESN’T END AT THE REPAIR</p><h2 id="problem-title">Your Technicians Fix Trucks.<br /><span className="text-slate">Who Handles Everything Else?</span></h2><p className="section-description">When the office work follows you home, even a completed repair can leave a lot unfinished.</p></div><div className="problem-list">{[
      [Clock3, 'Calls don’t follow office hours.', 'Incoming requests and job updates need someone to keep the details moving.'],
      [FileText, 'Field notes aren’t finished reports.', 'Technician notes need to become clear, organized service documentation.'],
      [ClipboardCheck, 'Missing details hold up invoices.', 'Incomplete job information means more chasing before an invoice is ready.'],
      [Sunrise, 'The next shift needs the whole picture.', 'Open jobs, approvals and follow-ups can get lost in an incomplete handover.'],
    ].map(([Icon, title, text], i) => { const ProblemIcon = Icon as typeof Clock3; return <div className="problem-item" key={String(title)}><span className="problem-index">0{i + 1}</span><ProblemIcon size={22} strokeWidth={1.5} aria-hidden="true" /><div><h3>{String(title)}</h3><p>{String(text)}</p></div></div>; })}</div></div></section>

    <section id="services" className="section services-section" aria-labelledby="services-title"><div className="container"><div className="section-heading"><div><p className="eyebrow">PRACTICAL SUPPORT, WHERE IT COUNTS</p><h2 id="services-title">Keep the work moving.<br />Keep the details together.</h2></div><p>Dependable administrative support for the parts of the job that happen beyond the roadside.</p></div><div className="service-grid">{services.map(({ icon: Icon, title, text, detail }, i) => <article className="service-card" key={title}><div className="service-top"><span className="service-icon"><Icon size={28} strokeWidth={1.4} aria-hidden="true" /></span><span className="service-number" aria-hidden="true">0{i + 1}</span></div><h3>{title}</h3><p>{text}</p><div className="service-detail"><span>{detail}</span><ArrowUpRight size={17} aria-hidden="true" /></div></article>)}</div><div className="service-footnote"><span><Check size={17} aria-hidden="true" />Administrative support shaped around your repair workflow.</span><a href={createEmailHref('proposal')}>Request a tailored support proposal<ArrowRight size={16} aria-hidden="true" /></a></div></div></section>

    <section id="how-it-works" className="section process-section" aria-labelledby="process-title"><div className="container"><div className="section-heading"><div><p className="eyebrow">A CLEAR WAY TO WORK TOGETHER</p><h2 id="process-title">Your Workflow. Our Support.</h2></div><p>We start with how you operate, then agree on where we can help.</p></div><div className="process-grid">{steps.map(([title, description], i) => <article className="process-step" key={title}><div className="step-track"><span>0{i + 1}</span><div aria-hidden="true" /></div><h3>{title}</h3><p>{description}</p></article>)}</div><p className="process-note"><Route size={19} aria-hidden="true" />No unnecessary software migration required.</p></div></section>

    <section id="sample-reports" className="section sample-section" aria-labelledby="sample-title"><div className="container"><div className="section-heading"><div><p className="eyebrow">LESS GUESSWORK. A CLEARER HANDOVER.</p><h2 id="sample-title">See what the next shift sees.</h2></div><p>Explore a fictional overnight handover. Open a job to see what needs attention next.</p></div><HandoverDemo /><div className="sample-bottom"><p>The format is an example.<br /><strong>The workflow can be built around you.</strong></p><EmailLink className="button button-navy">Request a Full Sample Report</EmailLink></div></div></section>

    <section className="section why-section" aria-labelledby="why-title"><div className="container why-grid"><div className="why-intro"><p className="eyebrow">THE RIGHT CONTEXT MATTERS</p><h2 id="why-title">Support That Understands Mobile Repairs</h2><p>A roadside job is more than a ticket. There are technician updates, customer expectations, approvals and records to keep aligned.</p><div className="why-signoff"><Wrench size={19} aria-hidden="true" /><span>Practical support. Clear responsibilities.</span></div></div><div className="capabilities">{[
      [Route, 'Familiarity with roadside repair workflows', 'Support built around the way mobile repair work moves.'],
      [MessageSquareText, 'Clear written customer updates', 'Keep job progress and next steps understandable.'],
      [ClipboardCheck, 'Organized technician and job records', 'Bring the details of each job into a consistent format.'],
      [FileCheck2, 'Invoices based on approved details', 'Prepare drafts using your rates and supplied information.'],
      [Sunrise, 'Consistent handover documentation', 'Give the next shift a useful record of what remains.'],
      [ShieldCheck, 'Flexible support by agreed scope', 'Define the work, coverage and approvals together.'],
    ].map(([Icon, title, text]) => { const CapabilityIcon = Icon as typeof Route; return <div className="capability" key={String(title)}><CapabilityIcon size={22} strokeWidth={1.5} aria-hidden="true" /><div><h3>{String(title)}</h3><p>{String(text)}</p></div></div>; })}</div></div></section>

    <section className="section audience-section" aria-labelledby="audience-title"><div className="container"><p className="eyebrow">A SPECIALIST FOCUS</p><div className="section-heading"><h2 id="audience-title">Built for Mobile<br />Repair Operations</h2><p>For the owners and operations managers keeping commercial trucks and trailers moving.</p></div><div className="audience-list">{['Mobile Diesel Repair', 'Truck & Trailer Repair', 'Commercial Roadside Assistance', 'Independent Repair Teams', 'Growing Repair Service Companies'].map(label => <span key={label}><Truck size={18} strokeWidth={1.5} aria-hidden="true" />{label}</span>)}</div><p className="audience-note">Our focus is repair-business operations. We do not provide freight dispatch, load booking or load management.</p></div></section>

    <section id="about" className="section about-section" aria-labelledby="about-title"><div className="container about-grid"><div><p className="eyebrow">ABOUT WESTLINE</p><h2 id="about-title">A Practical Partner Behind Your Repair Operations</h2></div><div className="about-copy"><p className="about-lead">Good support starts with understanding the work.</p><p>Westline Dispatch is a new remote operations-support business focused on US mobile commercial truck and trailer repair companies. Our team brings experience with US roadside repair workflows and the administrative details that surround them.</p><p>We help turn job updates, technician notes and approved information into organized records and clear handovers, so owners can keep their attention on running the repair business.</p><a className="text-link" href={createEmailHref('contact')}>Tell us about your operation<ArrowUpRight size={18} aria-hidden="true" /></a></div></div></section>

    <section className="section faq-section" aria-labelledby="faq-title"><div className="container faq-grid"><div><p className="eyebrow">BEFORE WE GET STARTED</p><h2 id="faq-title">A few useful answers.</h2><p className="section-description">Clear expectations make for a better working relationship.</p><a className="text-link" href={createEmailHref('contact')}>Have another question?<ArrowUpRight size={17} aria-hidden="true" /></a></div><div className="faq-list">{questions.map(([question, answer]) => <details className="faq-item" key={question}><summary>{question}<ChevronDown size={20} aria-hidden="true" /></summary><p>{answer}</p></details>)}</div></div></section>

    <section id="contact" className="contact-section" aria-labelledby="contact-title"><div className="container contact-grid"><div><p className="eyebrow">LET’S GET THE DETAILS IN ORDER</p><h2 id="contact-title">Spend Less Time Chasing Paperwork.<br /><span>Stay Focused on Repair Operations.</span></h2><p>See what a more organized back-office workflow could look like for your business.</p><div className="contact-actions"><EmailLink>Request a Sample</EmailLink><EmailLink intent="contact" className="button button-outline">Email Westline</EmailLink></div><p className="contact-small">Start with an email. Share what you need.</p></div><div className="contact-card"><Mail size={28} strokeWidth={1.4} aria-hidden="true" /><p>A SIMPLE FIRST STEP</p><h3>Your operation.<br />Your questions.<br />Our inbox.</h3><a href={createEmailHref('contact')}>{site.email}<ArrowUpRight size={17} aria-hidden="true" /></a><span>Copy the address or open an email draft.</span></div></div></section>
  </main>;
}

function Footer() {
  const [year, setYear] = useState(new Date().getFullYear());
  useEffect(() => { setYear(new Date().getFullYear()); }, []);
  return <footer className="site-footer"><div className="container"><div className="footer-main"><div><Brand /><p>Remote operations support for US mobile<br className="desktop-break" /> truck and trailer repair businesses.</p></div><nav aria-label="Footer services"><h2>OUR SUPPORT</h2><a href="/#services">After-hours dispatch</a><a href="/#services">Invoicing & documentation</a><a href="/#services">Shift handovers</a></nav><div className="footer-contact"><h2>LET’S TALK OPERATIONS</h2><a href={createEmailHref('contact')}>{site.email}</a><a href="/#sample-reports">Explore the sample handover<ArrowUpRight size={14} aria-hidden="true" /></a>{site.operatingHours ? <p>{site.operatingHours}</p> : null}{site.postalAddress ? <address>{site.postalAddress}</address> : null}{site.phone ? <a href={`tel:${site.phone.replace(/[^+\d]/g, '')}`}>{site.phone}</a> : null}{site.teamLocations.length ? <p>Team locations: {site.teamLocations.join(', ')}</p> : null}{site.socialLinks.map(link => <a href={link.url} key={link.url}>{link.label}</a>)}</div></div><div className="footer-bottom"><span>© <span suppressHydrationWarning>{year}</span> Westline Dispatch. All rights reserved.</span><nav aria-label="Legal"><a href="/privacy/">Privacy Policy</a><a href="/terms/">Terms of Service</a></nav><span className="footer-tagline">THE DETAILS MAKE THE DIFFERENCE.</span></div></div></footer>;
}

export function App({ path }: { path: string }) {
  const legal = path.replace(/\/+$/, '') === '/privacy' ? 'privacy' : path.replace(/\/+$/, '') === '/terms' ? 'terms' : null;
  return <><a className="skip-link" href="#main-content">Skip to content</a><Header home={!legal} />{legal ? <LegalPage kind={legal} /> : <HomePage />}<Footer /></>;
}
