import { site } from "../config/site";

export type EmailIntent = "sample" | "proposal" | "contact";

const subjects: Record<EmailIntent, string> = {
  sample: "Westline Dispatch — sample handover request",
  proposal: "Westline Dispatch — tailored support proposal",
  contact: "Westline Dispatch — operations support enquiry",
};

const introductions: Record<EmailIntent, string> = {
  sample:
    "I would like to request a sample handover report and learn how your support could fit our operation.",
  proposal:
    "I would like a tailored support proposal for our repair operation.",
  contact: "I would like to learn more about Westline Dispatch support.",
};

export function createEmailHref(intent: EmailIntent): string {
  const body = [
    "Hello Westline Dispatch,",
    "",
    introductions[intent],
    "",
    "Company name:",
    "Service area:",
    "Support needed:",
    "Desired coverage hours and time zone:",
    "",
    "Additional details:",
    "",
    "Thank you,",
  ].join("\r\n");

  return `mailto:${site.email}?subject=${encodeURIComponent(subjects[intent])}&body=${encodeURIComponent(body)}`;
}
