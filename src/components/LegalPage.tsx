import { site } from "../config/site";
import { createEmailHref } from "../lib/email";

const effectiveDate = "October 16, 2026";

function PrivacyContent() {
  return (
    <>
      <h2>Information you choose to share</h2>
      <p>
        When you email Westline Dispatch, we receive your email address and the
        information you include, such as your name, company, service area,
        support needs, and preferred coverage. Please share only the information
        needed to discuss your enquiry. Do not send account passwords, payment
        card details, or customer repair records in an initial enquiry.
      </p>

      <h2>How email enquiries work</h2>
      <p>
        The website&apos;s contact and sample-request links open a draft in your
        email application. Clicking a link does not send a message to us; you
        choose whether to send it. We use Gmail to receive and manage enquiries.
        Your email provider and Google process messages under their own terms
        and privacy practices. You can read the{" "}
        <a href="https://policies.google.com/privacy">Google Privacy Policy</a>{" "}
        for more information.
      </p>

      <h2>How we use your information</h2>
      <p>We use information supplied in enquiries to:</p>
      <ul>
        <li>Respond to questions and provide requested samples.</li>
        <li>
          Understand your repair business and discuss a suitable support scope.
        </li>
        <li>
          Prepare proposals and arrange onboarding if you decide to work with
          us.
        </li>
        <li>
          Maintain correspondence relevant to those discussions and any agreed
          services.
        </li>
      </ul>
      <p>
        Access, confidentiality, approved tools, and the handling of client and
        customer records are established during onboarding. This website policy
        does not replace those arrangements.
      </p>

      <h2>Website visits and hosting</h2>
      <p>
        This website does not provide visitor accounts, collect payments, or
        submit information through a contact form. We have not added advertising
        trackers, analytics scripts, or a visitor-information database. The
        demonstration works in your browser and does not send its selections to
        Westline.
      </p>
      <p>
        The hosting provider may process technical information, including IP
        addresses and request data, to deliver and protect the website.
        Cloudflare&apos;s processing is described in its{" "}
        <a href="https://www.cloudflare.com/privacypolicy/">Privacy Policy</a>.
        This is separate from information you choose to send us by email.
      </p>

      <h2>Service providers and retention</h2>
      <p>
        Email and hosting providers process information needed to provide their
        services. Email correspondence may be retained while relevant to your
        enquiry, an agreed service relationship, recordkeeping, or applicable
        obligations. No fixed retention period is promised on this website.
        Contact us if you would like to discuss the information we hold about
        you or ask for it to be corrected or removed.
      </p>

      <h2>Your requests and choices</h2>
      <p>
        You can browse without sending an enquiry and can omit optional details
        from an email draft. To ask about access to, correction of, or deletion
        of information you have supplied, email{" "}
        <a href={createEmailHref("contact")}>{site.email}</a>. We may need
        enough information to identify the relevant correspondence and verify
        that the request is yours. We will explain any applicable limits when
        responding.
      </p>

      <h2>Demonstration records and policy updates</h2>
      <p>
        The job records and handover shown on this website are fictional
        examples, not customer information. We may update this policy when
        website features or information-handling practices change. The effective
        date at the top of this page identifies the current version.
      </p>
    </>
  );
}

function TermsContent() {
  return (
    <>
      <h2>About this website</h2>
      <p>
        This website describes Westline Dispatch&apos;s remote operations
        support for US mobile commercial truck and trailer repair businesses.
        Its content helps you evaluate our services and contact us. It is not a
        repair diagnosis, roadside emergency service, or a channel for
        dispatching an urgent repair.
      </p>

      <h2>Enquiries and service agreements</h2>
      <p>
        Requesting a sample, sending an email, or receiving a proposal does not
        by itself establish a service agreement or reserve coverage. Before
        support begins, we separately agree on responsibilities, operating
        hours, coverage limits, fees, reporting formats, approved tools,
        escalation contacts, and approval requirements. Those agreed terms
        govern the services.
      </p>

      <h2>Operational responsibilities</h2>
      <p>
        Westline supports the administrative work agreed with each client. The
        repair business retains control of repair decisions, technician work,
        customer commitments, rates, parts purchases, and financial approvals.
        Invoice drafts and reports depend on the job information and approved
        details supplied to us and remain subject to the client&apos;s review.
      </p>
      <p>
        Coverage and availability depend on the agreed scope. This website does
        not promise round-the-clock staffing, a particular response time, or
        specific business or repair results.
      </p>

      <h2>Samples and demonstration data</h2>
      <p>
        The sample handover and all displayed job records are fictional and
        illustrate a possible reporting format. They are not live operations,
        actual customer records, testimonials, or evidence of completed client
        work. Actual reports and workflows will reflect the services agreed with
        your business.
      </p>

      <h2>Using website content</h2>
      <p>
        You may read, print, and share a link to this website when evaluating
        Westline&apos;s services. Please do not present its branding, copy, or
        sample records as your own work or as evidence of a relationship with
        Westline. Contact us before republishing or adapting website material
        for another business. Third-party fonts and software remain subject to
        their own licenses.
      </p>

      <h2>Information you provide</h2>
      <p>
        Please provide accurate business information and share only information
        you are authorized to disclose. Arrangements for access to client
        systems, confidentiality, and customer records are agreed during
        onboarding. Our <a href="/privacy/">Privacy Policy</a> explains how
        enquiries and website visits are handled.
      </p>

      <h2>Links, availability, and updates</h2>
      <p>
        Email links rely on your email application and provider. External
        websites have their own terms and practices. We aim to keep this website
        useful and accurate, but content and service availability may change.
        Please confirm any detail important to your decision with us before
        relying on it. Changes to these website terms will be reflected in the
        effective date above; they do not automatically amend a separate service
        agreement.
      </p>

      <h2>Contact</h2>
      <p>
        For questions about these terms or to discuss support for your repair
        business, email <a href={createEmailHref("contact")}>{site.email}</a>.
      </p>
    </>
  );
}

export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const isPrivacy = kind === "privacy";

  return (
    <main id="main-content" className="legal-page container">
      <a className="legal-back" href="/">
        ← Back to Westline
      </a>
      <p className="eyebrow">Clear expectations</p>
      <h1>{isPrivacy ? "Privacy Policy" : "Terms of Service"}</h1>
      <p className="legal-intro">
        {isPrivacy
          ? "How this website works and how we handle the information you choose to share."
          : "A practical guide to using this website and discussing services with Westline Dispatch."}
      </p>
      <p className="legal-date">Effective {effectiveDate}</p>
      <div className="legal-content">
        {isPrivacy ? <PrivacyContent /> : <TermsContent />}
      </div>
    </main>
  );
}
