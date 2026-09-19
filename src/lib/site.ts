/**
 * Single source of truth for everything store-specific.
 *
 * NOTE: the WooCommerce export carried no contact details, so the phone number,
 * e-mail, address and social handles below are placeholders. Replace them here
 * and they update across the header, footer, contact page, WhatsApp checkout
 * and structured data.
 */
export const site = {
  name: "Jidderh's Gallery",
  shortName: "Jidderh's",
  tagline: "Islamic books, toys & ibadah essentials",
  description:
    "Jidderh's Gallery is a Nigerian Islamic store for children's books, learning toys, prayer essentials and modest wear — carefully chosen to nurture iman at every age.",
  url: "https://jiddersgallery.com.ng",
  locale: "en_NG",
  currency: "NGN",
  country: "Nigeria",

  // --- Replace with the real details -------------------------------------
  whatsapp: "2348000000000", // international format, digits only
  phoneDisplay: "+234 800 000 0000",
  email: "hello@jiddersgallery.com.ng",
  address: {
    street: "Store address line 1",
    city: "Ilorin",
    state: "Kwara State",
    country: "Nigeria",
  },
  socials: {
    instagram: "https://instagram.com/jiddershgallery",
    facebook: "https://facebook.com/jiddershgallery",
    tiktok: "https://tiktok.com/@jiddershgallery",
  },
  // -----------------------------------------------------------------------

  hours: [
    { days: "Monday - Friday", time: "9:00am - 6:00pm" },
    { days: "Saturday", time: "10:00am - 5:00pm" },
    { days: "Friday prayer", time: "Closed 12:30pm - 2:00pm" },
    { days: "Sunday", time: "Closed" },
  ],

  freeDeliveryThreshold: 50000,
} as const;

export const whatsappLink = (message: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
