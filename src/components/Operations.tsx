import { useState } from "react";
import { ArrowDown, ArrowRight, CheckCircle2, FileText, Mail, ShieldCheck } from "lucide-react";
import reports from "../data/reports.json";
import { site } from "../config/site";
import { createEmailHref } from "../lib/email";

const documents = [
  { id: "handover", title: "Overnight Shift Handover", subtitle: "Open items, ownership and the next shift's priorities." },
  { id: "service-report", title: "Service Report", subtitle: "Technician-supplied findings, repair details and review boundaries." },
  { id: "invoice-draft", title: "Invoice Draft", subtitle: "A review worksheet, not a bill. Missing prices stay missing." },
] as const;

export function SampleReports() {
  const [selected, setSelected] = useState<string>("handover");
  return <div className="sample-library">
    <div className="document-switcher" role="group" aria-label="Choose a sample document">
      {documents.map((document, index) => <button key={document.id} aria-pressed={selected === document.id} aria-controls={"document-" + document.id} onClick={() => setSelected(document.id)}><span>0{index + 1}</span>{document.title}<FileText size={18} aria-hidden="true" /></button>)}
    </div>
    {documents.map((document) => <section key={document.id} id={"document-" + document.id} hidden={selected !== document.id} aria-labelledby={"title-" + document.id} className="document-preview">
      <div className="document-masthead"><span>WESTLINE / SAMPLE LIBRARY</span><span className="demo-label">FICTIONAL DEMONSTRATION</span></div>
      <div className="document-heading"><div><h3 id={"title-" + document.id}>{document.title}</h3><p>{document.subtitle}</p></div><a className="button button-navy" href={"/samples/" + document.id + ".pdf"} download>Download PDF <ArrowDown size={17} aria-hidden="true" /></a></div>
      <p className="sample-disclaimer">Entirely fictional examples, not completed Westline client jobs. “Verified” describes evidence within the demonstration only.</p>
      {(document.id === "handover" ? reports : reports.slice(0, 1)).map((report, index) => <details className="sample-job" key={report.id} open={index === 0}>
        <summary><span>JOB {report.id} / Unit {report.unit}</span><strong>{report.complaint}</strong><span className="sample-status">{report.status}</span></summary>
        <dl className="report-fields">
          {[
            ["Complaint", report.complaint], ["Status", report.status], ["Technician notes", report.notes],
            ["Verified repair details", report.verified], ["Pending approvals", report.approvals],
            ["Next action", report.next], ["Responsible party", report.responsible],
            ["Time records", report.time], ["Invoice review status", report.invoice],
          ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </details>)}
      {document.id === "invoice-draft" && <div className="invoice-review"><strong>DRAFT — NOT FOR PAYMENT</strong><div className="invoice-line"><span>Labor: 45 minutes × client-approved rate</span><span>Rate not supplied</span></div><div className="invoice-line"><span>Replacement fitting: 1 × approved parts price</span><span>Price not supplied</span></div><div className="invoice-line"><span>Travel, call-out fees and tax</span><span>Client review required</span></div><p>No total calculated. Client billing reviewer must confirm rates, parts, applicable tax and authorization before issue.</p></div>}
      <div className="document-footnote"><ShieldCheck size={17} aria-hidden="true" /> Repair acceptance and financial approval remain with the client.</div>
    </section>)}
  </div>;
}

const stages = [
  { name: "Request", time: "22:10", title: "Capture the right details.", copy: "Job 001 · Unit 2184. Trailer air leak reported. Confirm location, contact and the client's escalation procedure.", label: "Complaint recorded" },
  { name: "Coordinate", time: "22:20", title: "Keep ownership clear.", copy: "The assigned technician reports findings. Parts purchases and changes to repair scope stay with the client's authorized manager.", label: "Client retains approvals" },
  { name: "Document", time: "23:05", title: "Separate fact from assumption.", copy: "Technician reports a fitting replacement and connection leak check. Record 45 minutes of supplied labor; leave missing rates blank.", label: "Documentation review pending" },
  { name: "Hand over", time: "Next shift", title: "Leave a useful next action.", copy: "Repair manager reviews the service record. Billing reviewer confirms approved rates and parts before any final invoice is issued.", label: "Awaiting client review" },
];

export function OperationsPreview() {
  const [stage, setStage] = useState(0);
  return <div className="operations-preview">
    <div className="ops-top"><span className="ops-brand">WESTLINE / NIGHT OPERATIONS</span><span>FICTIONAL DEMO</span></div>
    <div className="ops-track" role="group" aria-label="Explore the fictional job workflow">{stages.map((item, index) => <button key={item.name} aria-pressed={stage === index} onClick={() => setStage(index)}><span>0{index + 1}</span>{item.name}</button>)}</div>
    <div className="ops-scene" key={stage}><div className="ops-time"><span>JOB 001 / UNIT 2184</span><strong>{stages[stage].time}</strong></div><div className="ops-graphic" aria-hidden="true"><svg viewBox="0 0 440 110"><path d="M15 78H425" stroke="currentColor" strokeDasharray="5 9" /><path d="M48 65V25H270V65M280 65V36H323L350 58V65H280M300 38V53H338" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="95" cy="68" r="13" fill="#102538" stroke="currentColor" strokeWidth="2"/><circle cx="238" cy="68" r="13" fill="#102538" stroke="currentColor" strokeWidth="2"/><circle cx="320" cy="68" r="13" fill="#102538" stroke="currentColor" strokeWidth="2"/><path d="M365 22h40m-20-20v40" stroke="#c9874c" strokeWidth="2"/></svg></div><h2>{stages[stage].title}</h2><p>{stages[stage].copy}</p><div className="ops-state"><CheckCircle2 size={16} aria-hidden="true" />{stages[stage].label}</div></div>
    <div className="ops-bottom"><span>Human-led support. Your existing workflow.</span><a href="#sample-reports" aria-label="Explore sample documents"><ArrowRight size={20} aria-hidden="true" /></a></div>
    <p className="hero-example-note">Illustrative example — not a real customer record. Select a step to explore.</p>
  </div>;
}

export function BeforeAfter() {
  return <section className="section transformation" aria-labelledby="transformation-title"><div className="container">
    <div className="section-heading"><div><p className="eyebrow">FROM FIELD NOTES TO A CLEAR NEXT STEP</p><h2 id="transformation-title">Same information.<br />A more useful handover.</h2></div><p>We organize the details supplied by your team. Missing information is flagged, not filled in with guesses.</p></div>
    <div className="comparison-grid"><article className="raw-note"><span className="comparison-label">01 / THE INCOMING NOTE</span><h3>“2184 fitting changed”</h3><p>air leak at fitting. changed it. soap checked connection no bubbles. 22:20–23:05. need price from office.</p><span>Fictional technician note · not a customer message</span></article><article className="clear-note"><span className="comparison-label">02 / THE REVIEW-READY RECORD</span><h3>Repair recorded. Billing still open.</h3><ul><li><CheckCircle2 size={17} aria-hidden="true" />Fitting replaced; connection check reported.</li><li><CheckCircle2 size={17} aria-hidden="true" />45 minutes of supplied labor recorded.</li><li><CheckCircle2 size={17} aria-hidden="true" />Parts price and approved rate missing.</li></ul><p><strong>Next owner:</strong> client billing reviewer. Confirm prices before invoice issue.</p></article></div>
  </div></section>;
}

export function Confidence() {
  const items = [
    ["Your rates. Your procedures.", "Only client-approved rates, instructions and escalation rules are used."],
    ["Human documentation review", "A designated reviewer checks supplied notes and flags missing or conflicting information."],
    ["Clear approval boundaries", "Repair decisions, purchases, customer commitments and final invoices remain with your authorized team."],
    ["Defined support hours", "Agree coverage hours, time zone and out-of-hours escalation before work starts. No assumed 24/7 coverage."],
    ["Your existing workflow", "Review tool compatibility and access during onboarding. No new software subscription is required to enquire."],
    ["Confidentiality by agreement", "Agree approved tools, access and confidentiality arrangements before sharing customer records."],
  ];
  return <section className="section confidence-section" aria-labelledby="confidence-title"><div className="container"><div className="section-heading"><div><p className="eyebrow">SUPPORT WITHOUT LOSING CONTROL</p><h2 id="confidence-title">The boundaries are<br />part of the service.</h2></div><p>Practical expectations agreed before the first shift—not promises hidden in the small print.</p></div><div className="confidence-grid">{items.map(([title, copy], index) => <article key={title}><span>0{index + 1}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></div></section>;
}

export function OperationsTeam() {
  return <section id="about" className="section team-section" aria-labelledby="team-title"><div className="container team-grid"><div><p className="eyebrow">REAL PEOPLE. CLEAR RESPONSIBILITIES.</p><h2 id="team-title">Our Operations Team</h2><p>Westline Dispatch is a new remote operations-support business for US mobile truck and trailer repair companies—not a software subscription or a US repair facility.</p><p>We discuss the scope first. You keep repair and financial authority.</p></div><div>{site.operationsTeam.map((member) => <article className="team-card" key={member.name}><div className="team-monogram" aria-hidden="true">{member.name.split(" ").map((part) => part[0]).join("")}</div><p className="eyebrow">{member.primaryContact ? "YOUR PRIMARY CONTACT" : "OPERATIONS TEAM"}</p><h3>{member.name}</h3><p className="team-role">{member.role} · {member.location}</p><p>{member.responsibilities}</p><a className="text-link" href={createEmailHref("contact")}><Mail size={17} aria-hidden="true" />Email Our Team</a></article>)}</div></div></section>;
}
