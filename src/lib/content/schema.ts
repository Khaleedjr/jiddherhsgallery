/**
 * Every piece of storefront text the dashboard can change, grouped by page.
 * Each field carries its label for the editor and the site's original wording
 * as its default; the store only keeps what an admin has changed, so a field
 * nobody touched follows this file.
 *
 * Words in {curly braces} are filled in when the page is drawn: {storeName},
 * {phone}, {email}, {state}, {pickupDays}, {pickupTime}, {interstateDays},
 * {dispatchHours}, {kadunaFee}, {freeDeliveryFrom}, {kadunaNote}, {addressNote}
 * and {instagramHandle} work everywhere; a few fields have their own (their
 * hint says which).
 *
 * Plain data with no server imports, so the editor can use it in the browser.
 */

export type ScalarKind = "text" | "long" | "rich";

export type ScalarField = {
  kind: ScalarKind;
  label: string;
  default: string;
  hint?: string;
  group?: string;
  /** Extra checks for store details. */
  check?: "digits" | "email" | "url";
};

export type ListField<K extends string = string> = {
  kind: "list";
  label: string;
  /** What one entry is called: "question", "section", "person". */
  item: string;
  fields: Record<K, ScalarField>;
  /** Which of the entry's fields names it in the editor. */
  titleKey: K;
  default: Array<Record<K, string>>;
  hint?: string;
  group?: string;
  max?: number;
};

export type Field = ScalarField | ListField;

export type Section = {
  title: string;
  description: string;
  /** The storefront page this text appears on, for the editor's "View page" link. */
  href?: string;
  fields: Record<string, Field>;
};

/* ---------------------------------------------------------------- builders */

const text = (label: string, value: string, extra: Partial<ScalarField> = {}): ScalarField => ({ kind: "text", label, default: value, ...extra });
/** A paragraph: line breaks are kept as typed. */
const long = (label: string, value: string, extra: Partial<ScalarField> = {}): ScalarField => ({ kind: "long", label, default: value, ...extra });
/** Several paragraphs: a blank line starts a new one, lines starting "- " become a bulleted list, **words** go bold. */
const rich = (label: string, value: string, extra: Partial<ScalarField> = {}): ScalarField => ({ kind: "rich", label, default: value, ...extra });

function list<K extends string>(
  label: string,
  item: string,
  fields: Record<K, ScalarField>,
  titleKey: NoInfer<K>,
  value: Array<Record<NoInfer<K>, string>>,
  extra: { hint?: string; max?: number } = {},
): ListField<K> {
  return { kind: "list", label, item, fields, titleKey, default: value, ...extra };
}

/** Files the fields under a sub-heading in the editor. */
function group<T extends Record<string, Field>>(title: string, fields: T): T {
  for (const field of Object.values(fields)) field.group = title;
  return fields;
}

const legalSection = { heading: text("Heading", ""), body: rich("Text", "") };
const RICH_HINT = "A blank line starts a new paragraph. Start a line with “- ” for a bullet point, and wrap words in **two stars** to make them bold.";

/* ---------------------------------------------------------------- sections */

export const SECTIONS = {
  home: {
    title: "Home page",
    description: "The first page visitors see, from the welcome banner down to the gift help band.",
    href: "/",
    fields: {
      ...group("Welcome banner", {
        greeting: text("Arabic greeting", "أهلاً وسهلاً"),
        headline: text("Headline", "Nurturing towards Jannah"),
        welcomeLine: text("Welcome line", "Welcome to {storeName}."),
        welcomeText: long("Welcome text", "A reliable spot to nurture every home towards Jannah with Islamic resources chosen with purpose."),
        searchPlaceholder: text("Search box hint (phones)", "Search Qur'an, books, toys…"),
        searchButton: text("Search button", "Search"),
        shopButton: text("Shop button", "Shop all products"),
        archPlay: text("Left arch word", "Play"),
        archRead: text("Middle arch word", "Read"),
        archWorship: text("Right arch word", "Worship"),
      }),
      ...group("Shop by age", {
        agesTitle: text("Heading", "Begin where your child is"),
        agesText: long("Text under the heading", "Tap an age to see what suits it."),
        agesUnit: text("Word under each age", "years"),
      }),
      ...group("Shop by department", {
        departmentsTitle: text("Heading", "Shop by department"),
        departmentsCount: text("Line under the heading", "{productCount} products across {departmentCount} departments", {
          hint: "{productCount} and {departmentCount} are kept up to date from the catalogue.",
        }),
        departmentCount: text("Product count", "{count} products", { hint: "{count} is the number of products in the department." }),
        departmentLink: text("Link on each card (laptops)", "Shop {department}", { hint: "{department} is the department's name." }),
      }),
      ...group("Qur'an card", {
        quranButton: text("Button", "Browse the Qur'an shelf"),
      }),
      ...group("Promises band", {
        promise1Title: text("First promise", "Free delivery from {freeDeliveryFrom}"),
        promise1Text: text("First promise, detail", "To anywhere in Nigeria."),
        promise2Title: text("Second promise", "Dispatched within {dispatchHours} hours"),
        promise2Text: text("Second promise, detail", "Interstate parcels leave on {interstateDays}."),
        promise3Title: text("Third promise", "Secure payments"),
        promise3Text: text("Third promise, detail", "Your transactions are safeguarded at checkout."),
      }),
      ...group("Gift help band", {
        helpScript: text("Handwritten line", "Gifts, made easy"),
        helpTitle: text("Heading", "Not sure what to choose?"),
        helpText: long("Text", "Tell us the age, the budget and the occasion. We will put a bundle together and send you photos before you pay."),
        helpWhatsapp: text("WhatsApp button", "Ask on WhatsApp"),
        helpWhatsappMessage: long("WhatsApp message it starts", "As-salamu alaykum {storeName}, please help me choose a gift. Age: __ , Budget: __"),
        helpContact: text("Contact button", "Contact the store"),
      }),
    },
  },

  about: {
    title: "Our story",
    description: "The about page: the story, mission and vision, what sets the store apart, and the team.",
    href: "/about",
    fields: {
      ...group("Top of the page", {
        eyebrow: text("Small line above the title", "Our story"),
        title: text("Title", "Nurturing towards Jannah"),
        intro: long("Introduction", "We are your favourite Islamic online store — a thoughtfully curated selection of Islamic products for every age, from Kaduna to every state in Nigeria."),
        seoDescription: long(
          "Description for Google and link previews",
          "How {storeName} grew into a Nigerian Islamic store for books, toys, ibadah essentials and modest wear.",
        ),
      }),
      ...group("The story", {
        story: rich(
          "Story",
          [
            "Jidderh's Gallery is an online store that sells Islamic books, toys and other accessories across all ages. We focus on turning the attention of the coming generation away from the harm of modern technology, and towards using that same technology to learn the deen of Islam and worship Allah ﷻ according to His teachings from His Messenger ﷺ.",
            "Today that shelf holds **{productCount} products** across {departmentCount} departments — from cloth books for babies to tafsir for the whole family, from prayer mats and tasbeeh to flash cards, puzzles and modest wear.",
            "Most of our customers reach us on WhatsApp, and we like it that way. It means every order is a conversation — we can tell you honestly whether a book suits a six-year-old, suggest something better for the budget, or put a gift bundle together and send photographs before you pay.",
            "**Jazakumullahu bi khair. May Allah put barakah in every item you purchase from us.**",
          ].join("\n\n"),
          { hint: `${RICH_HINT} {productCount} and {departmentCount} fill in the live numbers.` },
        ),
        missionLabel: text("Mission label", "Our mission"),
        mission: long("Mission", "To provide Islamic products that will promote the establishment of Islamically oriented homes."),
        visionLabel: text("Vision label", "Our vision"),
        vision: long("Vision", "To be the biggest source of unique and affordable Islamic products in Nigeria and beyond."),
        storyButton: text("Button", "Browse the gallery"),
      }),
      ...group("Numbers beside the photos", {
        statProducts: text("Products label", "Products"),
        statDepartments: text("Departments label", "Departments"),
        statStatesValue: text("States number", "36"),
        statStates: text("States label", "States served"),
      }),
      ...group("What sets us apart", {
        valuesEyebrow: text("Small line above the heading", "What sets us apart"),
        valuesTitle: text("Heading", "What you can count on"),
        value1Title: text("First point", "Best quality"),
        value1Text: long("First point, detail", "Each product is meticulously selected to ensure durability, functionality and a seamless experience for the family using it."),
        value2Title: text("Second point", "Thoughtfully curated"),
        value2Text: long("Second point, detail", "A selection of Islamic products across every age — cartoons, lectures, books, toys, puzzles, prayer accessories and modest wear."),
        value3Title: text("Third point", "Nationwide shipping"),
        value3Text: long("Third point, detail", "We deliver to all states of the nation. Shipping is priced by location, and confirmed with you before you pay."),
      }),
      ...group("The team", {
        teamEyebrow: text("Small line above the heading", "The people behind it"),
        teamTitle: text("Heading", "Meet the team"),
        team: list(
          "Team members",
          "person",
          { name: text("Name", ""), role: text("Role", "") },
          "name",
          [
            { name: "Hauwa'u A Bello (Jidderh)", role: "Creative Head" },
            { name: "Abubakar Tukur", role: "Technical & Support Head" },
          ],
          { max: 12 },
        ),
      }),
      ...group("Closing banner", {
        closingEyebrow: text("Small line above the heading", "Come and see"),
        closingTitle: text("Heading", "Come and shop with us"),
        closingText: long("Text", "Pickups run at weekends in Kaduna, and our WhatsApp is open for orders every day."),
        closingButton: text("Button", "Contact & delivery"),
      }),
    },
  },

  faq: {
    title: "FAQ",
    description: "The frequently asked questions page.",
    href: "/faq",
    fields: {
      ...group("Top of the page", {
        eyebrow: text("Small line above the title", "Help centre"),
        title: text("Title", "Frequently asked questions"),
        intro: long("Introduction", "Ordering, payment, delivery, pickup and returns — answered plainly."),
        seoDescription: long("Description for Google and link previews", "Answers about ordering, payment, delivery and returns at {storeName}."),
      }),
      ...group("Questions", {
        items: list(
          "Questions and answers",
          "question",
          { question: text("Question", ""), answer: rich("Answer", "", { hint: RICH_HINT }) },
          "question",
          [
            {
              question: "How do I place an order?",
              answer:
                "Add what you want to your bag and go to checkout. Fill in your details, choose how you want it delivered (or pick it up in Kaduna), and pay with Paystack. Your order is confirmed the moment payment goes through, and a receipt is emailed to you.",
            },
            {
              question: "How do I pay?",
              answer:
                "Securely with Paystack at checkout: by card, bank transfer or USSD. You pay on Paystack's own page, so we never see or store your card details. If a payment fails, nothing is taken and your bag stays saved so you can try again.",
            },
            {
              question: "How much is delivery?",
              answer:
                "Within Kaduna metropolis and Zaria it is {kadunaFee} to your door. Other states are sent by bus to a park in your state for a waybill fee shown at checkout as soon as you choose your state (from ₦1,500). Orders from {freeDeliveryFrom} ship free, and pickup in Kaduna is always free.",
            },
            {
              question: "How quickly do you dispatch?",
              answer:
                "Kaduna orders are dispatched within {dispatchHours} hours of payment. Interstate park dispatches run on {interstateDays}. If dispatch happens on any other day, we let you know.",
            },
            {
              question: "Which states do you deliver to?",
              answer:
                "All of them. We dispatch through interstate parks with a listed bus stop for each state — Abuja, Adamawa, Bauchi, Borno, Gombe, Jigawa, Kano, Katsina, Kebbi, Kwara, Lagos, Nasarawa, Niger, Oyo, Plateau, Rivers, Sokoto, Taraba and Zamfara. The full list is on our delivery page.",
            },
            {
              question: "Can I collect my order instead?",
              answer:
                "Yes. Pickups run at weekends only — {pickupDays}, {pickupTime}. The full address is shared privately once your order is confirmed. Kindly call at least an hour before coming and have your order reference ready.",
            },
            {
              question: "Can I return something?",
              answer:
                "Items delivered in perfect and acceptable condition are final sales — this keeps every product new and untampered for the next family. If the wrong item arrives, or something is damaged in transit, message us within 48 hours with photographs and we will replace it or refund you in full.",
            },
            {
              question: "What if my parcel sits at the park?",
              answer:
                "Parks typically charge ₦300 to ₦1,000 storage if an item is not collected directly from the driver, and it rises the longer it stays. Those charges are not ours. Please collect park deliveries within 3 days of dispatch.",
            },
            {
              question: "Are the books suitable for my child's age?",
              answer:
                "Every product is filed under one or more age brackets, and you can browse by age from the main menu. If you are still unsure, message us with your child's age and we will recommend something honestly — including telling you when something is not worth it.",
            },
            {
              question: "Do you supply schools and madaaris?",
              answer: "Yes. Email {email} or message us on WhatsApp with your list and we will quote bulk pricing.",
            },
          ],
          { max: 60 },
        ),
      }),
      ...group("Still have a question", {
        askTitle: text("Heading", "Still have a question?"),
        askText: long("Text", "Message us on WhatsApp — we usually reply within the hour during store days."),
        askButton: text("Button", "Chat with us"),
        askMessage: long("WhatsApp message it starts", "As-salamu alaykum {storeName}, I have a question."),
      }),
    },
  },

  contact: {
    title: "Contact",
    description: "The contact and delivery page.",
    href: "/contact",
    fields: {
      ...group("Top of the page", {
        eyebrow: text("Small line above the title", "Ahlan Wa Sahlan"),
        title: text("Title", "Contact & delivery"),
        intro: long(
          "Introduction",
          "To the number one home of Islamic items of your choice that will nurture you towards Jannah, in shaa Allah. Send a message and a real person will reply.",
        ),
        seoDescription: long(
          "Description for Google and link previews",
          "Reach {storeName} on WhatsApp, phone or email. Based in {state}, delivering nationwide across Nigeria with weekend pickup available.",
        ),
      }),
      ...group("Ways to reach us", {
        whatsappLabel: text("WhatsApp card title", "WhatsApp"),
        whatsappHint: text("WhatsApp card note", "Fastest way to reach us — orders, questions and bundles"),
        whatsappMessage: long("WhatsApp message it starts", "As-salamu alaykum {storeName}, I have a question."),
        phoneLabel: text("Phone card title", "Phone"),
        phoneHint: text("Phone card note", "9:00am - 6:00pm"),
        emailLabel: text("Email card title", "Email"),
        emailHint: text("Email card note", "For bulk orders, schools and partnerships"),
      }),
      ...group("Where we are", {
        whereTitle: text("Heading", "Where we are"),
        pickupTitle: text("Pickup heading", "Pickup"),
        daysLabel: text("Days label", "Days"),
        timeLabel: text("Time label", "Time"),
      }),
      ...group("Delivery at a glance", {
        deliveryTitle: text("Heading", "Delivery at a glance"),
        deliveryItems: list(
          "Points",
          "point",
          { title: text("Title", ""), text: long("Text", "") },
          "title",
          [
            { title: "Within Kaduna", text: "{kadunaFee} flat for website orders. {kadunaNote}" },
            { title: "Dispatch time", text: "We dispatch within {dispatchHours} hours of payment. If it will take longer, we tell you." },
            { title: "Interstate parks", text: "Regular dispatch days are {interstateDays}. Waybill fees must be added at checkout." },
            { title: "Free delivery", text: "On all orders from {freeDeliveryFrom} to anywhere in Nigeria." },
          ],
          { max: 12 },
        ),
      }),
    },
  },

  delivery: {
    title: "Delivery & returns",
    description: "The delivery and returns policy, and the bus stops by state.",
    href: "/delivery-returns",
    fields: {
      ...group("Top of the page", {
        title: text("Title", "Delivery & returns"),
        intro: long("Introduction", "Assalamu alaikum. These guidelines help us keep deliveries smooth, timely and stress-free for everyone, in shaa Allah."),
        updated: text("Last updated", "September 2026"),
        seoDescription: long(
          "Description for Google and link previews",
          "How {storeName} dispatches orders from {state} across Nigeria, park bus stops by state, pickup times, and the exchange and return policy.",
        ),
      }),
      ...group("Policy", {
        sections: list("Sections", "section", legalSection, "heading", [
          {
            heading: "Kaduna deliveries",
            body: [
              "- Dispatch: within {dispatchHours} hours of payment. If it will take longer, we tell you.",
              "- Delivery fee: {kadunaFee} flat for website orders within {kadunaNote}",
              "- Waybill: please add your waybill fee at checkout. If you skip it, riders or drivers may charge their own fee, and that is not from us.",
              "- Receiving on your behalf: use the recipient's full shipping address and phone number, and tell them straight after payment.",
              "- We kindly do not accept rush orders, so that every order is packaged with care.",
            ].join("\n"),
          },
          {
            heading: "Interstate park deliveries",
            body: [
              "- Regular dispatch days are {interstateDays}. If we dispatch on another day, you will be notified.",
              "- All interstate park orders must include the waybill fee at checkout.",
              "- Choosing Local Pickup means you are collecting personally or sending someone — no delivery is made on that option.",
              "- Want the driver to drop your item before the park? State it clearly in your checkout note.",
              "- Southern states: drivers' numbers are not always provided. If nobody contacts you within 48 hours of dispatch, tell us so we can follow up.",
              "- If someone else collects for you, use their active phone number in the delivery details and tell them ahead of time.",
              "- Parks typically charge ₦300 to ₦1,000 storage if items are not collected from the driver. These charges are not ours and we cannot control them.",
              "- Collect park deliveries within 3 days of dispatch. Items left beyond that are no longer our responsibility.",
            ].join("\n"),
          },
          {
            heading: "Free delivery",
            body: "Orders from {freeDeliveryFrom} and above are delivered free to any location within Nigeria.",
          },
          {
            heading: "Pickup",
            body: [
              "Pickups are strictly at weekends — {pickupDays}, {pickupTime}, in {state}. {addressNote}",
              "",
              "- Kindly call at least 1 hour before coming.",
              "- Have your order details or order reference ID ready.",
              "- All pickups must be done at the designated location only.",
            ].join("\n"),
          },
          {
            heading: "Items delivered in good condition are final sales",
            body: [
              "Once a product has been delivered in perfect and acceptable condition, it cannot be exchanged, returned or refunded.",
              "",
              "- It keeps every item original and safe.",
              "- It prevents the circulation of products that have been opened, handled or exposed.",
              "- It ensures every customer receives completely new, untampered items.",
            ].join("\n"),
          },
          {
            heading: "Wrong or damaged item on delivery",
            body: [
              "If your order arrives with the wrong item, or a product damaged in transit, tell us within 48 hours of receiving it so we can follow up quickly with the driver or logistics partner.",
              "Once we confirm the issue, a replacement is arranged immediately. If the item is no longer available, a full refund is issued. Please open and inspect your package as soon as it arrives.",
            ].join("\n\n"),
          },
          {
            heading: "Confirm the details before ordering",
            body: [
              "Every listing carries a clear description, live photographs of the actual item, and its features, sizes, colours and contents.",
              "If that is not enough, message us before you order and we will gladly guide you. Where a product matches its description and arrives in good condition, the no-return rule applies.",
            ].join("\n\n"),
          },
          {
            heading: "Need help?",
            body: "Unsure about features, suitability for your child, colour differences, packaging or contents? Message us on WhatsApp at {phone} or email {email} before placing your order. We are always willing to help you make the right choice.",
          },
        ], { hint: RICH_HINT, max: 40 }),
      }),
      ...group("Bus stops by state", {
        busStopsTitle: text("Heading", "Delivery bus stops by state"),
        busStopsText: long("Text", "Kindly include your preferred park or bus stop in your delivery details."),
        busStops: list(
          "Bus stops",
          "state",
          { state: text("State", ""), stop: text("Bus stop", "") },
          "state",
          [
            ["Abuja", "Jabi or Zuba"],
            ["Adamawa", "Yola"],
            ["Bauchi", "Bauchi"],
            ["Borno", "Maiduguri"],
            ["Gombe", "Gombe"],
            ["Jigawa", "Dutse"],
            ["Kano", "Kanoline or Naibawa"],
            ["Katsina", "Katsina"],
            ["Kebbi", "Birnin Kebbi"],
            ["Kwara", "Ilorin"],
            ["Lagos", "Iddo"],
            ["Nasarawa", "Keffi or Lafia"],
            ["Niger", "Minna"],
            ["Oyo", "Ibadan"],
            ["Plateau", "Jos"],
            ["Rivers", "Port Harcourt"],
            ["Sokoto", "Sokoto"],
            ["Taraba", "Jalingo"],
            ["Zamfara", "Gusau"],
          ].map(([state, stop]) => ({ state, stop })),
          { max: 40 },
        ),
      }),
    },
  },

  privacy: {
    title: "Privacy policy",
    description: "What the store collects and how it is used.",
    href: "/privacy",
    fields: {
      ...group("Top of the page", {
        title: text("Title", "Privacy policy"),
        intro: long("Introduction", "What we collect, why we collect it, and what we will never do with it."),
        updated: text("Last updated", "September 2026"),
        seoDescription: long("Description for Google and link previews", "How {storeName} handles the personal information you share when you shop with us."),
      }),
      ...group("Policy", {
        sections: list("Sections", "section", legalSection, "heading", [
          {
            heading: "What we collect",
            body: [
              "We only ask for what an order needs. When you check out you give us your name, phone number, email address and delivery address.",
              "",
              "- Order details: the items in your bag, quantities and the total.",
              "- Contact details: name, phone number and email address.",
              "- Delivery details: state, city and street address, plus any note you add.",
            ].join("\n"),
          },
          {
            heading: "What stays on your device",
            body: "Your shopping bag is stored in your own browser, not on our servers. It stays there until you clear it or clear your browser data, and we cannot read it until you choose to send us your order.",
          },
          {
            heading: "How we use it",
            body: [
              "- To confirm your order, quote delivery and arrange dispatch.",
              "- To email your receipt and contact you about that order, including if something is out of stock.",
              "- To answer questions you send us.",
            ].join("\n"),
          },
          {
            heading: "What we do not do",
            body: [
              "- We do not sell, rent or trade your details to anybody.",
              "- We do not send marketing messages to people who have not asked for them.",
              "- We do not see or store card or bank details: you pay on Paystack's own secure page.",
            ].join("\n"),
          },
          {
            heading: "Visit statistics",
            body: "We count visits to this website to learn which pages and products are useful. This uses no cookies and keeps nothing that identifies you: only the page, the day, your country and city, the kind of device, and the site you came from.",
          },
          {
            heading: "Who else sees your details",
            body: "Paystack, which processes your payment, and the courier handling your parcel, each only with the details they need. Paystack handles your card or bank details under its own privacy policy; they never reach us. Messages you send us on WhatsApp are also subject to WhatsApp's own privacy terms.",
          },
          {
            heading: "Keeping your information",
            body: "We keep order records for as long as we need them for accounting and to help with any later question about your order. You can ask us to delete your details at any time.",
          },
          {
            heading: "Your rights",
            body: "Write to {email} to ask what we hold about you, to correct it, or to have it deleted. We will respond within a reasonable time.",
          },
        ], { hint: RICH_HINT, max: 40 }),
      }),
    },
  },

  terms: {
    title: "Terms of service",
    description: "The terms that apply when customers order.",
    href: "/terms",
    fields: {
      ...group("Top of the page", {
        title: text("Title", "Terms of service"),
        intro: long("Introduction", "The plain terms that apply when you shop with us."),
        updated: text("Last updated", "September 2026"),
        seoDescription: long("Description for Google and link previews", "The terms that apply when you order from {storeName}."),
      }),
      ...group("Terms", {
        sections: list("Sections", "section", legalSection, "heading", [
          {
            heading: "About these terms",
            body: "These terms apply to orders placed with {storeName} through this website, WhatsApp, or in store. By placing an order you accept them.",
          },
          {
            heading: "Products and prices",
            body: [
              "We describe and photograph every product as accurately as we can. Print runs and dye lots vary, so colours may differ slightly from the photographs.",
              "Prices are in Nigerian naira and exclude delivery. We may change prices at any time, but never after we have confirmed your order.",
            ].join("\n\n"),
          },
          {
            heading: "Stock and order confirmation",
            body: "An order placed on this website is complete once your payment has gone through on Paystack. In the rare case that an item sells out before we can send it, we will tell you straight away and offer an alternative or a refund for that item.",
          },
          {
            heading: "Payment",
            body: "Website orders are paid at checkout through Paystack, by card, bank transfer or USSD. Payment is taken on Paystack's own page, so card details never reach this website. Orders arranged with us directly (for example on WhatsApp or in person) may be paid by transfer, cash or POS.",
          },
          {
            heading: "Delivery",
            body: "Delivery times quoted are estimates given in good faith and depend on the courier. Risk in the goods passes to you on delivery. Our delivery and returns policy forms part of these terms.",
          },
          {
            heading: "Cancellations",
            body: "You may cancel any order before it is dispatched and we will refund you in full. Once a parcel is with the courier, the returns policy applies instead.",
          },
          {
            heading: "Use of this website",
            body: [
              "- The text, photographs and design on this site belong to us and may not be copied for commercial use without permission.",
              "- Do not attempt to disrupt the site or access it in a way that harms other users.",
            ].join("\n"),
          },
          {
            heading: "Liability",
            body: "Our responsibility for any order is limited to the value of that order. Nothing in these terms removes rights you have under Nigerian consumer law.",
          },
          { heading: "Governing law", body: "These terms are governed by the laws of the Federal Republic of Nigeria." },
          { heading: "Contact", body: "Questions about these terms: {email} or {phone}." },
        ], { hint: RICH_HINT, max: 40 }),
      }),
    },
  },

  pages: {
    title: "Shop, search & 404",
    description: "The shop page, the search page, and the page shown when a link is broken.",
    href: "/shop",
    fields: {
      ...group("Shop page", {
        shopEyebrow: text("Small line above the title", "The full shelf"),
        shopTitle: text("Title", "Shop all products"),
        shopIntro: long(
          "Introduction",
          "Every title, toy and essential in the gallery — {productCount} products in total. Pick a department, or use the filters below to narrow by age, topic or price.",
          { hint: "{productCount} is the number of products on sale." },
        ),
      }),
      ...group("Search page", {
        searchEyebrow: text("Small line above the title", "Search"),
        searchTitle: text("Title before searching", "Search the gallery"),
        searchIntro: long("Introduction before searching", "Type in the search bar above, or start from one of these popular searches."),
        searchResultsTitle: text("Title with results", "Results for “{query}”", { hint: "{query} is what the visitor searched for." }),
        searchCountOne: text("Result count, one product", "1 product matches your search."),
        searchCount: text("Result count, several products", "{count} products match your search.", { hint: "{count} is the number of products found." }),
        suggestions: text("Popular searches", "Qur'an, seerah, prayer mat, flash cards, activity book, tasbeeh, posters", {
          hint: "Separate them with commas. Each becomes a button that runs that search.",
        }),
        searchEmptyTitle: text("Before searching: heading", "What are you looking for?"),
        searchEmptyText: long("Before searching: text", "Search by title, topic or age — for example “bedtime stories”, “tajweed” or “prayer mat”."),
        searchEmptyButton: text("Before searching: button", "Browse everything"),
        noMatchTitle: text("No results: heading", "No matches for that search"),
        noMatchText: long("No results: text", "Try a shorter word, check the spelling, or browse a department instead — we may still have what you need."),
      }),
      ...group("Broken link page (404)", {
        notFoundTitle: text("Heading", "This shelf is empty"),
        notFoundText: long("Text", "The page you were looking for has moved or never existed. Let us point you somewhere useful."),
        notFoundShop: text("Shop button", "Browse the shop"),
        notFoundHome: text("Home button", "Back to home"),
      }),
      ...group("Policy pages", {
        policyEyebrow: text("Small line above policy titles", "Store policy"),
        updatedLabel: text("“Last updated” label", "Last updated"),
      }),
    },
  },

  layout: {
    title: "Header & footer",
    description: "The menu at the top of every page, the footer at the bottom, and the floating WhatsApp button.",
    href: "/",
    fields: {
      ...group("Header", {
        searchPlaceholder: text("Search box hint (laptops)", "Search Qur'an, books, toys…"),
        searchPanelPlaceholder: text("Search box hint (phones)", "Search for Qur'an, seerah books, prayer mats, toys…"),
        searchButton: text("Search button (phones)", "Search"),
        byAge: text("“By age” menu", "By age"),
        shopAll: text("“Shop all” link", "Shop all"),
      }),
      ...group("Phone menu", {
        menuAllProducts: text("All products link", "All products"),
        menuStory: text("Our story link", "Our story"),
        menuContact: text("Contact link", "Contact & delivery"),
        menuFaq: text("FAQ link", "FAQ"),
        menuWhatsapp: text("WhatsApp button", "Chat with us on WhatsApp"),
        menuWhatsappMessage: long("WhatsApp message it starts", "As-salamu alaykum {storeName}, I have a question."),
      }),
      ...group("Footer", {
        footerBlurb: long("Text under the logo", "An online Islamic store for books, toys and ibadah essentials for every age, sent from Kaduna to all of Nigeria."),
        footerArabic: text("Arabic line", "بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ"),
        footerWhatsappMessage: long("WhatsApp message from the footer icon", "As-salamu alaykum {storeName}."),
        shopHeading: text("Shop column heading", "Shop"),
        allProducts: text("All products link", "All products"),
        ageHeading: text("Age column heading", "By age"),
        helpHeading: text("Help column heading", "Help"),
        linkStory: text("Our story link", "Our story"),
        linkContact: text("Contact link", "Contact us"),
        linkFaq: text("FAQ link", "FAQ"),
        linkDelivery: text("Delivery link", "Delivery & returns"),
        linkPrivacy: text("Privacy link", "Privacy policy"),
        linkTerms: text("Terms link", "Terms of service"),
        callLabel: text("Phone label", "Call or WhatsApp"),
        emailLabel: text("Email label", "Email"),
        basedLabel: text("Location label", "Based in"),
        copyright: text("Copyright line", "© {year} {storeName}. All rights reserved.", { hint: "{year} is the current year." }),
      }),
      ...group("Floating WhatsApp button", {
        fabMessage: long("WhatsApp message it starts", "As-salamu alaykum {storeName}, I would like to ask about a product."),
      }),
    },
  },

  shopping: {
    title: "Products, bag & checkout",
    description: "Words on product pages, in the shopping bag, at checkout and on the payment confirmation.",
    href: "/cart",
    fields: {
      ...group("Product cards and pages", {
        soldOut: text("“Sold out” badge", "Sold out"),
        bestSeller: text("“Best seller” badge", "Best seller"),
        newBadge: text("“New” badge", "New"),
        addToBag: text("Add to bag button", "Add to bag"),
        addedToBag: text("After adding", "Added to bag"),
        outOfStock: text("Button when out of stock", "Out of stock"),
        inStock: text("Stock line", "In stock — ready to dispatch"),
        stockOut: text("Stock line when out of stock", "Currently out of stock"),
        freeDeliveryLine: text("Delivery note", "Free delivery over {freeDeliveryFrom}"),
        vettedLine: text("Second note", "Content vetted before we stock it"),
      }),
      ...group("Bought together", {
        setEyebrow: text("Small line above the heading", "Featured together"),
        setTitleOrders: text("Heading, from real orders", "Frequently bought together"),
        setTitlePicked: text("Heading, when picked to match", "Make it a set"),
        setTextOrders: text("Text, from real orders", "Customers who bought this also took these."),
        setTextPicked: text("Text, when picked to match", "Chosen to go with it. Untick anything you don't need."),
        setThisItem: text("Label after this product", "(this item)"),
        setTotalOne: text("Total label, one item", "Total for 1 item"),
        setTotal: text("Total label, several items", "Total for {count} items", { hint: "{count} is how many items are ticked." }),
        setAdd: text("Add button", "Add {count} to bag", { hint: "{count} is how many items are ticked." }),
        setAddOne: text("Add button, one item", "Add to bag"),
        setChooseOption: text("Button when this product needs an option first", "Select an option to continue"),
        setAdded: text("After adding", "Added to your bag"),
        bagSuggestTitle: text("Bag: heading", "Goes with your bag"),
        bagSuggestOrders: text("Bag: reason, from real orders", "Often bought with {item}", { hint: "{item} is the product in the bag it pairs with." }),
        bagSuggestPicked: text("Bag: reason, when picked to match", "Pairs with {item}"),
        bagSuggestAdd: text("Bag: add button", "Add"),
        bagSuggestChoose: text("Bag: button for items with colours or sizes", "Choose"),
        relatedEyebrow: text("Similar products: small line", "You may also like"),
        relatedTitle: text("Similar products: heading", "More from this shelf"),
        relatedText: text("Similar products: text", "Chosen from the same shelf and age range."),
      }),
      ...group("Shopping bag", {
        bagTitle: text("Bag title", "Your bag"),
        bagEyebrow: text("Bag page: line above the title", "Almost there"),
        bagEmptyTitle: text("Empty bag: heading", "Your bag is empty"),
        bagEmptyText: long("Empty bag: text", "Browse the shelves and add something beneficial, in shaa Allah."),
        startShopping: text("Empty bag: button", "Start shopping"),
        addMore: text("Free delivery progress", "Add **{amount}** more for free delivery", { hint: "{amount} is what is left to spend. Words in **two stars** go bold." }),
        earnedFree: text("Free delivery reached", "You have earned free delivery"),
        bagDeliveryNote: text("Note under the subtotal", "Delivery is added at checkout once you choose your state."),
        checkoutButton: text("Checkout button", "Checkout"),
        continueShopping: text("Continue shopping link", "Continue shopping"),
        emptyBag: text("Empty bag link (bag page)", "Empty bag"),
        removeItem: text("Remove link (bag page)", "Remove"),
        summaryTitle: text("Summary heading (bag page)", "Order summary"),
        proceed: text("Checkout button (bag page)", "Proceed to checkout"),
        spendMore: text("Free delivery note (bag page)", "Spend {amount} more to qualify for free nationwide delivery."),
        qualifies: text("Free delivery reached (bag page)", "Your order qualifies for free nationwide delivery."),
        bagFootnote: long("Note under the summary (bag page)", "We confirm every order personally before payment — no surprises, no hidden charges."),
      }),
      ...group("Checkout", {
        checkoutEyebrow: text("Line above the title", "Final step"),
        checkoutTitle: text("Title", "Checkout"),
        checkoutIntro: long("Introduction", "Your details, a delivery option, then pay securely with Paystack by card, bank transfer or USSD."),
        detailsTitle: text("Details heading", "Your details"),
        detailsText: text("Details note", "We use these only to confirm, deliver and send your receipt."),
        deliveryTitle: text("Delivery heading", "Delivery"),
        deliverToMe: text("Delivery choice", "Deliver to me"),
        deliverToMeText: text("Delivery choice, detail", "Doorstep in Kaduna, or a park in your state"),
        pickupText: text("Pickup choice, detail", "Free · {pickupDays}, {pickupTime}"),
        notesLabel: text("Note box label", "Anything else we should know? (optional)"),
        notesPlaceholder: text("Note box hint", "Preferred park or bus stop, landmark, gift wrapping…"),
        paymentTitle: text("Payment steps heading", "How payment works"),
        paymentStep1: text("Payment step 1", "You pay on Paystack's secure page: card, bank transfer or USSD."),
        paymentStep2: text("Payment step 2", "Your order is confirmed the moment payment goes through, and your receipt is emailed."),
        paymentStep3: text("Payment step 3", "We dispatch within {dispatchHours} hours; interstate parcels leave on {interstateDays}."),
        payButton: text("Pay button", "Pay {total} with Paystack", { hint: "{total} is the order total." }),
        payNote: text("Note under the pay button", "You'll be taken to Paystack to pay. We never see or store your card details."),
        orderTitle: text("Order summary heading", "Your order"),
        editBag: text("Edit bag link", "Edit bag"),
        nothingTitle: text("Empty checkout: heading", "There is nothing to check out"),
        nothingText: long("Empty checkout: text", "Add a few items to your bag and come back — we will be here, in shaa Allah."),
        nothingButton: text("Empty checkout: button", "Browse the shop"),
      }),
      ...group("After payment", {
        paidEyebrow: text("Line above the title", "Thank you"),
        paidTitle: text("Title", "Payment received"),
        paidHeading: text("Heading", "Order {ref} is confirmed", { hint: "{ref} is the order number." }),
        paidThanks: long(
          "Thank-you line",
          "Jazakum Allahu khayran, {name}. Your payment went through and a receipt is on its way to **{customerEmail}**.",
          { hint: "{name} is the customer's first name and {customerEmail} their email. Words in **two stars** go bold." },
        ),
        paidPickup: long("What happens next (pickup)", "Pick up in Kaduna on {pickupDays}, {pickupTime}; please call before coming and have {ref} ready.", {
          hint: "{ref} is the order number.",
        }),
        paidDelivery: long(
          "What happens next (delivery)",
          "We dispatch within {dispatchHours} hours; interstate parcels leave on {interstateDays}. We will message {customerPhone} with the details.",
          { hint: "{customerPhone} is the customer's phone number." },
        ),
        paidContinue: text("Continue button", "Continue shopping"),
        paidQuestions: text("Questions button", "Questions? Message us"),
      }),
    },
  },

  store: {
    title: "Store details",
    description: "Contact details, pickup times and the store's short descriptions, used across the whole site and in receipt emails.",
    href: "/contact",
    fields: {
      ...group("Contact", {
        phoneDisplay: text("Phone number, as shown", "+234 703 978 3709"),
        phoneLocal: text("Phone number, short form", "07039783709"),
        whatsapp: text("WhatsApp number", "2347039783709", { check: "digits", hint: "Country code and number, digits only, e.g. 2347039783709. Calls and WhatsApp links use it." }),
        email: text("Email address", "jidderhsgallery@gmail.com", { check: "email" }),
        instagram: text("Instagram link", "https://www.instagram.com/jidderhs_gallery", { check: "url" }),
        instagramHandle: text("Instagram name", "@jidderhs_gallery"),
      }),
      ...group("Location & pickup", {
        state: text("State", "Kaduna State"),
        country: text("Country", "Nigeria"),
        addressNote: long("Address note", "Full pickup address is shared privately once your order is confirmed."),
        pickupDays: text("Pickup days", "Saturday & Sunday only"),
        pickupTime: text("Pickup time", "9:00am - 6:00pm"),
        pickupNote: long("Pickup note", "Kindly call at least 1 hour before coming, with your order reference ready."),
      }),
      ...group("Delivery wording", {
        dispatchHours: text("Dispatch time, in hours", "24"),
        interstateDays: text("Interstate dispatch days", "Sundays, Wednesdays and Fridays"),
        kadunaNote: long("Kaduna delivery area", "Kaduna metropolis and Zaria, for small-sized items. Larger Zaria packages may attract an extra park fee."),
      }),
      ...group("Descriptions", {
        welcome: text("Greeting", "Ahlan Wa Sahlan"),
        tagline: text("Tagline", "Nurturing towards Jannah"),
        description: long(
          "Description for Google and link previews",
          "Jidderh's Gallery is an online Islamic store for books, toys and accessories across all ages — a reliable spot to nurture every home towards Jannah with Islamic resources chosen with purpose.",
        ),
      }),
    },
  },
} satisfies Record<string, Section>;

/* ---------------------------------------------------------------- types */

export type SectionKey = keyof typeof SECTIONS;
export const SECTION_KEYS = Object.keys(SECTIONS) as SectionKey[];

type FieldValue<F> = F extends ListField<infer K> ? Array<Record<K, string>> : string;
type Fields<S extends SectionKey> = (typeof SECTIONS)[S]["fields"];

/** The finished text for every page: an admin's change where there is one, the default otherwise. */
export type SiteText = { [S in SectionKey]: { [F in keyof Fields<S>]: FieldValue<Fields<S>[F]> } };

/** What the store keeps: only the fields an admin changed, by section. */
export type TextOverrides = Partial<Record<SectionKey, Record<string, string | Array<Record<string, string>>>>>;

export const isSectionKey = (value: string): value is SectionKey => Object.hasOwn(SECTIONS, value);

export function defaultsFor(section: SectionKey) {
  const fields = SECTIONS[section].fields as Record<string, Field>;
  return Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, field.default])) as Record<
    string,
    string | Array<Record<string, string>>
  >;
}

/** Longest a value may be, by kind. */
export const MAX_LENGTH: Record<ScalarKind, number> = { text: 300, long: 2000, rich: 12000 };
