export interface SiteConfiguration {
  name: string;
  email: string;
  siteUrl: string;
  postalAddress: string;
  operatingHours: string;
  teamLocations: string[];
  phone: string;
  socialLinks: { label: string; url: string }[];
}

/** Add only confirmed business details. Empty optional fields stay unpublished. */
export const site: SiteConfiguration = {
  name: 'Westline Dispatch',
  email: 'westline.dispatch365@gmail.com',
  siteUrl: (import.meta.env.VITE_SITE_URL ?? '').trim().replace(/\/+$/, ''),
  postalAddress: '',
  operatingHours: '',
  teamLocations: [],
  phone: '',
  socialLinks: [],
};
