/**
 * Single source of truth for everything store-specific.
 * Details taken from the store's own site: jiddersgallery.com.ng
 */
export const site = {
  name: "Jidderh's Gallery",
  shortName: "Jidderh's",
  tagline: "Nurturing towards Jannah",
  welcome: "Ahlan Wa Sahlan",
  description:
    "Jidderh's Gallery is an online Islamic store for books, toys and accessories across all ages — a reliable spot to nurture every home towards Jannah with Islamic resources chosen with purpose.",
  url: "https://jiddersgallery.com.ng",
  locale: "en_NG",
  currency: "NGN",
  country: "Nigeria",

  whatsapp: "2347039783709",
  phoneDisplay: "+234 703 978 3709",
  phoneLocal: "07039783709",
  email: "support@jiddersgallery.com.ng",
  address: {
    city: "Kaduna",
    state: "Kaduna State",
    country: "Nigeria",
    note: "Full pickup address is shared privately once your order is confirmed.",
  },
  socials: {
    instagram: "https://www.instagram.com/jidderhs_gallery",
    instagramHandle: "@jidderhs_gallery",
  },

  mission: "To provide Islamic products that will promote the establishment of Islamically oriented homes.",
  vision: "To be the biggest source of unique and affordable Islamic products in Nigeria and beyond.",

  team: [
    { name: "Hauwa'u A Bello (Jidderh)", role: "Creative Head" },
    { name: "Abubakar Tukur", role: "Technical & Support Head" },
  ],

  /** Pickups run at weekends only. */
  pickup: {
    days: "Saturday & Sunday only",
    time: "9:00am - 6:00pm",
    note: "Kindly call at least 1 hour before coming, with your order reference ready.",
  },

  delivery: {
    kadunaFee: 1000,
    kadunaNote: "Kaduna metropolis and Zaria, for small-sized items. Larger Zaria packages may attract an extra park fee.",
    dispatchHours: 24,
    interstateDays: "Sundays, Wednesdays and Fridays",
  },

  freeDeliveryThreshold: 100000,
} as const;

export const whatsappLink = (message: string) =>
  `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(message)}`;
