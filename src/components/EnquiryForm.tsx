import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowUpRight, CheckCircle2 } from "lucide-react";
import { createEmailHref } from "../lib/email";

type Submission =
  | { state: "idle" | "sending" }
  | { state: "saved"; id: string }
  | { state: "error"; message: string };

export function EnquiryForm() {
  const [ready, setReady] = useState(false);
  const [submission, setSubmission] = useState<Submission>({ state: "idle" });
  const inFlight = useRef(false);
  useEffect(() => setReady(true), []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const payload = Object.fromEntries(
      ["name", "email", "company", "requestType", "message", "website"].map(
        (key) => [key, String(fields.get(key) ?? "").trim()],
      ),
    );
    setSubmission({ state: "sending" });
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      const result: unknown = await response.json().catch(() => null);
      if (
        response.status === 201 &&
        result !== null &&
        typeof result === "object" &&
        "ok" in result &&
        result.ok === true &&
        "id" in result &&
        typeof result.id === "string" &&
        result.id.length > 0
      ) {
        form.reset();
        setSubmission({ state: "saved", id: result.id });
      } else {
        const message =
          response.status === 429
            ? "We’re receiving several requests right now. Please email us directly, or try again later."
            : response.status === 400
              ? "Please check your name, email and company details, then try again. You can also email us directly."
              : "We couldn’t confirm that your request was saved. Your details are still here. Please try again or email us directly.";
        setSubmission({ state: "error", message });
      }
    } catch {
      setSubmission({
        state: "error",
        message:
          "We couldn’t confirm that your request was saved. Your details are still here. Please email us directly if the connection isn’t working.",
      });
    } finally {
      window.clearTimeout(timeout);
      inFlight.current = false;
    }
  }

  return (
    <div className="container enquiry-block">
      <div className="enquiry-intro">
        <p className="eyebrow">ANOTHER WAY TO REACH US</p>
        <h3 id="enquiry-title">Prefer to leave a request here?</h3>
        <p>
          Tell us a little about your operation, or ask for a sample handover.
          We’ll have the details we need to follow up by email.
        </p>
        <a className="text-link" href={createEmailHref("contact")}>
          You can always email Westline
          <ArrowUpRight size={17} aria-hidden="true" />
        </a>
      </div>
      <form
        className="enquiry-form"
        aria-labelledby="enquiry-title"
        onSubmit={submit}
        action="/api/enquiries"
        method="post"
      >
        <noscript>
          <p className="form-notice">
            This form needs JavaScript. Please use the email links above to
            contact Westline.
          </p>
        </noscript>
        <fieldset disabled={!ready || submission.state === "sending"}>
          <legend className="sr-only">Your contact details and request</legend>
          <div className="form-grid">
            <label htmlFor="enquiry-name">
              Your name <span>(required)</span>
              <input
                id="enquiry-name"
                name="name"
                autoComplete="name"
                maxLength={100}
                required
              />
            </label>
            <label htmlFor="enquiry-email">
              Email address <span>(required)</span>
              <input
                id="enquiry-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                required
              />
            </label>
            <label htmlFor="enquiry-company">
              Company <span>(required)</span>
              <input
                id="enquiry-company"
                name="company"
                autoComplete="organization"
                maxLength={160}
                required
              />
            </label>
            <label htmlFor="enquiry-type">
              How can we help?
              <select
                id="enquiry-type"
                name="requestType"
                defaultValue="sample"
              >
                <option value="sample">Request a sample handover</option>
                <option value="enquiry">Discuss operations support</option>
              </select>
            </label>
            <label className="form-full" htmlFor="enquiry-message">
              A little about your operation <span>(optional)</span>
              <textarea
                id="enquiry-message"
                name="message"
                rows={4}
                maxLength={2000}
                aria-describedby="message-help"
              />
            </label>
          </div>
          <div className="form-honeypot" aria-hidden="true">
            <label htmlFor="enquiry-website">
              Leave this field empty
              <input
                id="enquiry-website"
                name="website"
                tabIndex={-1}
                autoComplete="off"
              />
            </label>
          </div>
          <p id="message-help" className="form-help">
            Service area, support needed or preferred coverage hours are useful.
            Please leave out customer records, passwords and payment details.
          </p>
          <p className="form-privacy">
            Submitting saves these details so Westline can review your request.
            Read our <a href="/privacy/">Privacy Policy</a>.
          </p>
          <button className="button button-navy form-submit" type="submit">
            {submission.state === "sending"
              ? "Saving your request…"
              : "Send request"}
            <ArrowUpRight size={17} aria-hidden="true" />
          </button>
        </fieldset>
        <div className="form-feedback" aria-live="polite" aria-atomic="true">
          {submission.state === "saved" ? (
            <div className="form-success">
              <CheckCircle2 size={20} aria-hidden="true" />
              <div>
                <strong>Your request has been saved.</strong>
                <p>
                  Thank you. Westline can follow up using the email you
                  provided. Your reference is{" "}
                  <span>{submission.id.slice(0, 8)}</span>.
                </p>
              </div>
            </div>
          ) : null}
        </div>
        {submission.state === "error" ? (
          <div className="form-error" role="alert">
            <p>{submission.message}</p>
            <a href={createEmailHref("contact")}>
              Email Westline
              <ArrowUpRight size={15} aria-hidden="true" />
            </a>
          </div>
        ) : null}
      </form>
    </div>
  );
}
