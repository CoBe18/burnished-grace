/*
  BURNISHED GRACE: PRODUCT LIST
  -----------------------------
  Each product needs: id, category, name, desc, price (a number, or null for "Coming soon").
  Optional:
    images:   one or two pictures shown under the name: { src, alt }. alt describes the
              picture for people using screen readers. Tapping a picture enlarges it.
    points:   the item's details, shown as a bulleted list. desc then shows underneath
              as plain sentences (desc can be "" when the list says it all).
    page:     a details page, shown as a "See details" link under the description.
    free:     a link to a free tool; shows an "Open free app" button instead of a price.
    includes: ids of products this one already contains. Choosing it removes those
              from the order, so nobody pays twice (used by the PLR Edition).
    contains + notice: ids of products a bundle already holds, and the popup shown when
              a buyer's order has the bundle plus one of them. Both stay in the order,
              so a buyer can still add a single edition as a gift (Beatitudes bundles).

  IMPORTANT: when you change a price here, change the same product's price in
  api/catalog.php too, then upload both files. The server checks every payment
  against api/catalog.php, and if the prices differ, buyers pay but do not
  receive their download links.
*/
/*
  BURNISHED GRACE: PRODUCT LIST

  IMPORTANT:
  Product IDs and prices must match api/catalog.php.
  Upload both files when adding a paid product or changing its price.
*/

const PRODUCTS = [
  {
    id: "secret-family-recipes",
    video: { src: "videos/secret-family-recipes-walkthrough.mp4", poster: "videos/secret-family-recipes-poster.jpg", length: "3:33" },
    images: [
      { src: "images/shop/secret-family-recipes-1.jpg", alt: "Secret Family Recipes recipe box with three family recipe cards and photos: Aunt May's Banana Bread, Southern Peach Cobbler and Grandma Ruth's chicken and dumplings." },
      { src: "images/shop/secret-family-recipes-2.jpg", alt: "Secret Family Recipes shopping list, sorted by store section, with the ingredients for Mom's Spaghetti." }
    ],
    category: "Apps",
    name: "Secret Family Recipes",
    points: [
      "Keep family recipes and photos together",
      "Import recipes from supported websites",
      "Build shopping lists",
      "Downloadable app for personal and household use"
    ],
    desc: "Family sharing requires a hosted setup. Hosting is available on request and priced separately.",
    price: 27.99,
    page: "apps/secret-family-recipes.html#overview",
    pageLabel: "Watch the video and see details"
  },


  {
    id: "real-estate-app",
    video: { src: "videos/rental-property-finances-walkthrough.mp4", poster: "videos/rental-property-finances-poster.jpg", length: "6:34" },
    images: [
      { src: "images/shop/real-estate-app-1.jpg", alt: "Rental Property Finances overview for a sample vacation rental, showing recorded income, net operating income, cash flow before tax and an estimated tax reserve." },
      { src: "images/shop/real-estate-app-2.jpg", alt: "Rental Property Finances five-year cash flow projection for a sample property." }
    ],
    category: "Apps",
    name: "Rental Property Finances: Individual Edition",
    points: [
      "Track rental income and expenses by property",
      "Forecast five years of cash flow",
      "See your mortgage and depreciation schedules",
      "Works offline on Windows and Mac",
      "Full installation and use guide, with sample data to explore"
    ],
    desc: "For your own properties.",
    price: 57.00,
    page: "apps/rental-property-finances.html#walkthrough",
    pageLabel: "Watch the walkthrough and see details"
  },

  {
    id: "rental-cleaning-calc",
    video: { src: "videos/rental-cleaning-pricing-calculator-walkthrough.mp4", poster: "videos/rental-cleaning-pricing-calculator-poster.jpg", length: "6:01" },
    images: [
      { src: "images/shop/rental-cleaning-calc-1.jpg", alt: "Rental Cleaning Pricing Calculator pricing a 5-bedroom cabin turnover at $465, with each extra listed with its price." },
      { src: "images/shop/rental-cleaning-calc-2.jpg", alt: "A customer quote from the Rental Cleaning Pricing Calculator, ready to send to the cabin owner." }
    ],
    category: "Apps",
    name: "Rental Cleaning Pricing Calculator",
    points: [
      "Enter the bedrooms, beds, extras and the checkout-to-check-in window",
      "See the price, the crew you need, the finish time and your profit",
      "Send owners a polished quote with your own logo",
      "Built-in prices for 10 vacation-rental markets, with free price updates",
      "Works in any browser on Windows and Mac",
      "Phone and tablet version for iPhone, iPad and Android (burnishedgracestudio.com/apps/rental-cleaning-pricing/)",
      "Includes the calculator, the phone link, and the install and use guide",
      "No subscription",
      "Single-use license for one business"
    ],
    desc: "Price every cabin turnover with confidence. Created from real experience running a Gatlinburg cabin rental company.",
    price: 32.00,
    page: "apps/rental-cleaning-pricing-calculator.html#walkthrough",
    pageLabel: "Watch the walkthrough and see details"
  },

  {
    id: "commercial-cleaning",
    video: { src: "videos/cleaning-budget-quote-planner-walkthrough.mp4", poster: "videos/cleaning-budget-quote-planner-poster.jpg", length: "7:11" },
    images: [
      { src: "images/shop/commercial-cleaning-1.jpg", alt: "Cleaning Budget & Quote Planner job screen with the price build-up: direct cost, overhead, break-even and suggested price." },
      { src: "images/shop/commercial-cleaning-2.jpg", alt: "Cleaning Budget & Quote Planner monthly overhead budget, with the overhead allocated to each job." }
    ],
    category: "Apps",
    name: "Cleaning Budget & Quote Planner",
    points: [
      "Price every cleaning job from your real numbers: wages, payroll taxes, workers' comp, supplies, equipment, travel and your share of overhead",
      "Plan your monthly budget",
      "Keep customers and properties",
      "Quote by margin or markup",
      "Print clean quotes that never show your costs",
      "Compare estimated and actual results after the job",
      "Templates for house, deep, move-in/move-out, commercial, vacation-rental and hospitality cleaning",
      "English and Spanish",
      "Works offline in your browser on Windows and Mac, with a full installation and use guide",
      "Pay once, no subscription",
      "Single-use license for one business"
    ],
    desc: "",
    price: 47.00,
    page: "apps/cleaning-budget-quote-planner.html#walkthrough",
    pageLabel: "Watch the walkthrough and see details"
  },

  {
    id: "cleanreach",
    video: { src: "videos/cleanreach-walkthrough.mp4", poster: "videos/cleanreach-poster.jpg", length: "8:25" },
    images: [
      { src: "images/shop/cleanreach-1.jpg", alt: "CleanReach My prospects list, with filters for relationship, stage and follow-ups." },
      { src: "images/shop/cleanreach-2.jpg", alt: "CleanReach Plaza days screen, grouping nearby businesses so several shops can be cleaned in one trip." }
    ],
    category: "Apps",
    name: "CleanReach",
    points: [
      "Find local businesses that may need cleaning, like offices, restaurants, salons, gyms, medical offices and hotels, from published map listings",
      "Keep them in one private notebook",
      "Plan plaza days to clean several shops in one trip",
      "Track follow-ups and client projects",
      "Prepare outreach messages that you send yourself",
      "Runs privately on Mac (macOS 13.5 or newer) and Windows",
      "Phone and tablet version you host yourself",
      "Optional Sync through your own free Supabase account",
      "Searches use your own Geoapify key",
      "Pay once, no subscription",
      "Single-use license for one business"
    ],
    desc: "",
    price: 37.00,
    page: "apps/cleanreach.html#walkthrough",
    pageLabel: "Watch the walkthrough and see details"
  },

  {
    id: "plazaroute",
    video: { src: "videos/plazaroute-walkthrough.mp4", poster: "videos/plazaroute-poster.jpg", length: "16:51" },
    images: [
      { src: "images/shop/plazaroute-1.jpg", alt: "PlazaRoute Team & jobs screen: today's stops in route order, each with its cleaner, status, times and the cleaner's notes." },
      { src: "images/shop/plazaroute-2.jpg", alt: "PlazaRoute Bookings screen: new customer bookings waiting to be confirmed, with the service, time, price and the customer's note." }
    ],
    category: "Apps",
    name: "PlazaRoute",
    points: [
      "For cleaning businesses with weekly customers, like restroom cleaning for restaurants, salons, gyms and offices",
      "Monthly accounts, a weekly visit log and a route day planned plaza by plaza",
      "Sends each day's stops to your cleaners' phones, with before-and-after photos and Job complete",
      "Your own booking link and QR code: customers book one-time jobs or ask for monthly service",
      "Customers pay on your own Stripe or PayPal link",
      "Revenue by month and week, and a pricing and profit check before you quote",
      "Finds new businesses near you and plans plaza days (everything CleanReach does)",
      "Runs on Mac (macOS 13.5 or newer), Windows, and a phone and tablet version you host yourself",
      "Sync, your team and bookings use your own free Supabase account",
      "Pay once, no subscription",
      "Single-use license for one business"
    ],
    desc: "",
    price: 107.00,
    page: "apps/plazaroute.html#walkthrough",
    pageLabel: "Watch the walkthrough and see details"
  },

  {
    id: "finance-apps",
    category: "Apps",
    name: "Finance Apps",
    points: [
      "Downloadable finance apps for Windows and Mac",
      "Each with a full installation and use guide"
    ],
    desc: "",
    price: null
  },

  {
    id: "rental-finances-plr",
    video: { src: "videos/rental-property-finances-walkthrough.mp4", poster: "videos/rental-property-finances-poster.jpg", length: "6:34" },
    images: [
      { src: "images/shop/rental-finances-plr-1.jpg", alt: "The Rental Property Finances Rebrand Tool: enter your own product name, tagline, logo and colors and see a live preview." },
      { src: "images/shop/real-estate-app-1.jpg", alt: "Rental Property Finances overview for a sample vacation rental, showing recorded income, net operating income, cash flow before tax and an estimated tax reserve." }
    ],
    category: "PLR packages",
    name: "Rental Property Finances: PLR Edition",
    points: [
      "Rebrand the Rental Property Finances app completely, with your own name, logo, colors and guides",
      "Sell it as your product",
      "No-code Rebrand Tool",
      "Source code, sales copy and the PLR terms",
      "Everything in the Individual Edition",
      "Minimum resale price $57 per copy"
    ],
    desc: "",
    price: 107.00,
    page: "apps/rental-property-finances.html#walkthrough",
    pageLabel: "Watch the walkthrough and see details",
    includes: ["real-estate-app"]
  },

  {
    id: "rental-cleaning-calc-plr",
    video: { src: "videos/rental-cleaning-pricing-calculator-walkthrough.mp4", poster: "videos/rental-cleaning-pricing-calculator-poster.jpg", length: "6:01" },
    images: [
      { src: "images/shop/rental-cleaning-calc-plr-1.jpg", alt: "The Rebrand tab of the Rental Cleaning Pricing Calculator, for changing the name, tagline, colors and credit line." },
      { src: "images/shop/rental-cleaning-calc-plr-2.jpg", alt: "Downloading your branded copy of the calculator in one click." }
    ],
    category: "PLR packages",
    name: "Rental Cleaning Pricing Calculator: Private Label Rights Edition",
    points: [
      "Sell this calculator as your own",
      "Built-in Rebrand tool changes the name, tagline, colors and credit line, then downloads your branded copy in one click",
      "No coding needed",
      "Includes the calculator with the Rebrand tool",
      "Editable install and use guide in Word, plus a PDF",
      "PLR license terms"
    ],
    desc: "You may rebrand it and sell it to end users under a single-use license, at no less than $32 a copy. You may not pass on resale or PLR rights, or give it away. Full terms are in the PLR License Terms included with your download.",
    price: 77.00,
    page: "apps/rental-cleaning-pricing-calculator.html#walkthrough",
    pageLabel: "Watch the walkthrough and see details",
    includes: ["rental-cleaning-calc"]
  },

  {
    id: "beatitudes-kids",
    video: { src: "videos/The_Beatitudes_Kids_Walkthrough_English.mp4", poster: "videos/beatitudes-kids-poster.jpg", length: "1:20" },
    images: [
      { src: "images/shop/beatitudes-kids-1.jpg", alt: "Coloring page: Jesus walking up the mountain path with a staff, in simple bold lines." },
      { src: "images/shop/beatitudes-kids-2.jpg", alt: "Coloring page with the verse from Matthew 5:3 above a fisherman kneeling to pray beside his boat." }
    ],
    category: "Coloring books and planners",
    name: "The Beatitudes: Kids Edition",
    points: [
      "42 simple, bold-line pictures for little hands, from Matthew 5:3–10",
      "Jesus climbs the mountain and sits down to teach, then five pictures for each of the eight Beatitudes",
      "Each Beatitude opens with its verse (ESV)",
      "Best for ages 1 to 5",
      "Printable PDF, 43 pages, 8.5 × 11 in"
    ],
    desc: "For personal and household use.",
    price: 4.99
  },

  {
    id: "beatitudes-teen",
    video: { src: "videos/The_Beatitudes_Walkthrough_English.mp4", poster: "videos/beatitudes-poster.jpg", length: "2:34" },
    images: [
      { src: "images/shop/beatitudes-teen-1.jpg", alt: "Coloring page: the blind beggar on the Jericho road, looking up." },
      { src: "images/shop/beatitudes-teen-2.jpg", alt: "The opening page for The Poor in Spirit, with the verse from Matthew 5:3 and a short reflection." }
    ],
    category: "Coloring books and planners",
    name: "The Beatitudes: Teen Devotional Edition",
    points: [
      "40 detailed illustrations from Matthew 5:3–12",
      "Two scenes from Bible times and two from everyday life today for each Beatitude",
      "Each Beatitude opens with its verse (ESV) and a short reflection, and closes with a Reflect page of questions to journal",
      "Printable PDF, 64 pages, 8.5 × 11 in",
      "Optional color cover"
    ],
    desc: "For personal and household use.",
    price: 7.99
  },

  {
    id: "beatitudes-adult",
    video: { src: "videos/The_Beatitudes_Walkthrough_English.mp4", poster: "videos/beatitudes-poster.jpg", length: "2:34" },
    images: [
      { src: "images/shop/beatitudes-adult-1.jpg", alt: "Coloring page: The Tax Collector at the Temple, a man with his head bowed and a hand on his chest in the temple courtyard while a Pharisee prays in the background." },
      { src: "images/shop/beatitudes-adult-2.jpg", alt: "The facing page for The Tax Collector at the Temple, with the verse, an As you color question and lined space for notes and prayers." }
    ],
    category: "Coloring books and planners",
    name: "The Beatitudes: Adult Devotional Edition",
    points: [
      "The full devotional",
      "Each of the 40 illustrations faces a page with the verse (ESV), a reflection question and lined space for notes and prayers",
      "A Reflect page for each Beatitude",
      "Printable PDF, 104 pages, 8.5 × 11 in",
      "Optional color cover"
    ],
    desc: "For personal and household use.",
    price: 9.99
  },

  {
    id: "beatitudes-bundle",
    video: { src: "videos/The_Beatitudes_Walkthrough_English.mp4", poster: "videos/beatitudes-poster.jpg", length: "2:34" },
    images: [
      { src: "images/shop/beatitudes-bundle-1.jpg", alt: "Coloring page for The Merciful (Matthew 5:7): the Good Samaritan caring for a wounded man beside his donkey." },
      { src: "images/shop/beatitudes-bundle-2.jpg", alt: "Coloring page for Persecuted for Righteousness (Matthew 5:10): two prisoners in chains looking up toward a window." }
    ],
    category: "Coloring books and planners",
    name: "The Beatitudes: Complete Bundle (Kids, Teen and Adult)",
    points: [
      "All three editions: Kids, Teen and Adult",
      "Three printable PDFs",
      "Optional color cover"
    ],
    desc: "The whole family can color the Beatitudes, each at their own level. You save $5.98 compared with buying each edition. For personal and household use.",
    price: 16.99,
    contains: [
      "beatitudes-kids",
      "beatitudes-teen",
      "beatitudes-adult"
    ],
    notice: {
      text: "Already includes the Kids, Teen and Adult editions. Add a single edition only if it’s a gift for another household.",
      keep: "Keep it, it’s a gift",
      remove: "Remove the single edition"
    }
  },

  {
    id: "beatitudes-kids-es",
    video: { src: "videos/The_Beatitudes_Kids_Walkthrough_Spanish.mp4", poster: "videos/beatitudes-kids-es-poster.jpg", length: "1:26" },
    images: [
      { src: "images/shop/beatitudes-kids-es-1.jpg", alt: "Página para colorear: Jesús sube por el camino del monte con un bastón, en trazos sencillos y gruesos." },
      { src: "images/shop/beatitudes-kids-es-2.jpg", alt: "Página para colorear con el versículo de Mateo 5:3 sobre un pescador arrodillado orando junto a su barca." }
    ],
    category: "Coloring books in Spanish (Libros para colorear en español)",
    name: "Las Bienaventuranzas: Libro para colorear para niños (Spanish edition)",
    points: [
      "42 dibujos sencillos de trazo grueso para manos pequeñas, sobre Mateo 5:3–10",
      "Jesús sube al monte y se sienta a enseñar; luego cinco dibujos para cada una de las ocho Bienaventuranzas",
      "Cada Bienaventuranza comienza con su versículo (Reina-Valera 1909)",
      "Recomendado para niños de 1 a 5 años",
      "PDF imprimible de 43 páginas, tamaño carta",
      "Portada a color opcional"
    ],
    desc: "Para uso personal y familiar.",
    price: 4.99
  },

  {
    id: "beatitudes-teen-es",
    video: { src: "videos/The_Beatitudes_Walkthrough_Spanish.mp4", poster: "videos/beatitudes-es-poster.jpg", length: "2:34" },
    images: [
      { src: "images/shop/beatitudes-teen-es-1.jpg", alt: "Página para colorear: el mendigo ciego en el camino de Jericó." },
      { src: "images/shop/beatitudes-teen-es-2.jpg", alt: "Página de apertura de «Los pobres en espíritu», con el versículo de Mateo 5:3 y una breve reflexión." }
    ],
    category: "Coloring books in Spanish (Libros para colorear en español)",
    name: "Las Bienaventuranzas: Libro devocional para colorear para jóvenes (Spanish edition)",
    points: [
      "40 ilustraciones detalladas sobre Mateo 5:3–12",
      "Dos escenas de los tiempos bíblicos y dos de la vida cotidiana de hoy para cada Bienaventuranza",
      "Cada Bienaventuranza comienza con su versículo (Reina-Valera 1909) y una breve reflexión, y termina con una página de preguntas para reflexionar y escribir",
      "PDF imprimible de 64 páginas, tamaño carta",
      "Portada a color opcional"
    ],
    desc: "Para uso personal y familiar.",
    price: 7.99
  },

  {
    id: "beatitudes-adult-es",
    video: { src: "videos/The_Beatitudes_Walkthrough_Spanish.mp4", poster: "videos/beatitudes-es-poster.jpg", length: "2:34" },
    images: [
      { src: "images/shop/beatitudes-adult-es-1.jpg", alt: "Página para colorear: «El publicano en el templo», un hombre con la cabeza inclinada y la mano en el pecho en el patio del templo, mientras un fariseo ora al fondo." },
      { src: "images/shop/beatitudes-adult-es-2.jpg", alt: "Página de enfrente de «El publicano en el templo», con el versículo, una pregunta y líneas para notas y oraciones." }
    ],
    category: "Coloring books in Spanish (Libros para colorear en español)",
    name: "Las Bienaventuranzas: Libro devocional para colorear para adultos (Spanish edition)",
    points: [
      "El devocional completo",
      "Cada una de las 40 ilustraciones tiene enfrente una página con el versículo (Reina-Valera 1909), una pregunta de reflexión y líneas para notas y oraciones",
      "Una página de reflexión para cada Bienaventuranza",
      "PDF imprimible de 104 páginas, tamaño carta",
      "Portada a color opcional"
    ],
    desc: "Para uso personal y familiar.",
    price: 9.99
  },

  {
    id: "beatitudes-bundle-es",
    video: { src: "videos/The_Beatitudes_Walkthrough_Spanish.mp4", poster: "videos/beatitudes-es-poster.jpg", length: "2:34" },
    images: [
      { src: "images/shop/beatitudes-bundle-es-1.jpg", alt: "Página para colorear de «Los misericordiosos» (Mateo 5:7): el buen samaritano cuidando a un hombre herido." },
      { src: "images/shop/beatitudes-bundle-es-2.jpg", alt: "Página para colorear de «Los que padecen persecución» (Mateo 5:10): dos prisioneros encadenados mirando hacia una ventana." }
    ],
    category: "Coloring books in Spanish (Libros para colorear en español)",
    name: "Las Bienaventuranzas: Paquete completo para niños, jóvenes y adultos (Spanish edition)",
    points: [
      "Tres PDF imprimibles",
      "Portadas a color opcionales"
    ],
    desc: "Las tres ediciones, para que toda la familia coloree las Bienaventuranzas, cada uno a su nivel. Ahorras $5.98 frente a comprar cada edición por separado. Para uso personal y familiar.",
    price: 16.99,
    contains: [
      "beatitudes-kids-es",
      "beatitudes-teen-es",
      "beatitudes-adult-es"
    ],
    notice: {
      text: "Ya incluye las ediciones para niños, jóvenes y adultos. Agrega una edición individual solo si es un regalo para otro hogar.",
      keep: "Mantenerla, es un regalo",
      remove: "Quitar la edición individual"
    }
  },

  {
    id: "budget-ledger",
    video: { src: "tools/budget-ledger/Budget-Ledger-Walkthrough.mp4", poster: "tools/budget-ledger/walkthrough-poster.jpg", length: "3:01" },
    images: [
      { src: "images/shop/budget-ledger-1.jpg", alt: "Budget Ledger summary: balance now, money set aside for bills, what is free to spend, and total spent." },
      { src: "images/shop/budget-ledger-2.jpg", alt: "The Budget Ledger list of deposits and expenses with a running balance." }
    ],
    category: "Free tools",
    name: "Budget Ledger",
    points: [
      "Track deposits, expenses and upcoming bills",
      "See what is truly free to spend",
      "Works on phones, tablets and computers, even offline",
      "Free, with no sign-up"
    ],
    desc: "Your entries stay on your device.",
    price: null,
    free: "tools/budget-ledger/",
    page: "tools/budget-ledger/#videoBox",
    pageLabel: "Watch the walkthrough"
  },

  {
    id: "plr-profit-check",
    video: { src: "tools/plr-profit-check/PLR-Profit-Check-Walkthrough.mp4?v=20261021-paid", poster: "tools/plr-profit-check/walkthrough-poster.jpg", length: "3:02" },
    images: [
      { src: "images/shop/plr-profit-check-1.jpg", alt: "PLR Profit Check results for a sample product: what you keep per sale, the sales needed to earn back your cost, and a verdict on whether it can pay off." },
      { src: "images/shop/plr-profit-check-2.jpg", alt: "The PLR shelf in PLR Profit Check, tracking each product's status and sales against what it cost." }
    ],
    category: "PLR packages",
    name: "PLR Profit Check",
    points: [
      "Estimate profit after platform fees",
      "See how many sales it takes to break even",
      "Work through a checklist against your license",
      "Import Gumroad or Etsy sales to track your products",
      "Downloadable app for Windows and Mac, with a walkthrough video and installation and use guide",
      "Pay once, no subscription",
      "Your entries stay on your device"
    ],
    desc: "Bought PLR that never earned its money back?",
    price: 17.00,
    page: "tools/plr-profit-check/",
    pageLabel: "Watch the walkthrough and see details"
  },

  {
    id: "echoes-unseen",
    category: "Books",
    name: "Echoes of the Unseen",
    desc: "Book one of the Echoes series: why cultures across oceans and millennia remember giants, floods, and a lost world, tested against Scripture.",
    price: null
  }
];
