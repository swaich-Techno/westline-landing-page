export interface SiteConfiguration {
  name: string;
  email: string;
  siteUrl: string;
  postalAddress: string;
  operatingHours: string;
  teamLocations: string[];
  phone: string;
  socialLinks: { label: string; url: string }[];
  operationsTeam: {
    name: string;
    role: string;
    location: string;
    responsibilities: string;
    primaryContact: boolean;
  }[];
}

/** Add only confirmed business details. Empty optional fields stay unpublished. */
export const site: SiteConfiguration = {
  name: "Westline Dispatch",
  email: "westline.dispatch365@gmail.com",
  siteUrl: (import.meta.env.VITE_SITE_URL ?? "").trim().replace(/\/+$/, ""),
  postalAddress: "",
  operatingHours: "",
  teamLocations: ["India"],
  phone: "",
  socialLinks: [],
  operationsTeam: [
    {
      name: "Harkirat Singh",
      role: "Operational Manager",
      location: "India",
      responsibilities:
        "Supervises job reporting and documentation review, handles client enquiries, and agrees support scope and escalation contacts with your team.",
      primaryContact: true,
    },
  ],
};
