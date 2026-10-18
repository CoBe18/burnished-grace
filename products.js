/*
  BURNISHED GRACE: PRODUCT LIST
  -----------------------------
  Each product needs: id, category, name, desc, price (a number, or null for "Coming soon").
  Optional:
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
const PRODUCTS = [
  { id: "commercial-cleaning", category: "Apps", name: "Commercial Cleaning App",
    desc: "Price jobs, track expenses, and keep your cleaning business organized. Runs on Windows and Mac and comes with a step-by-step installation and use guide.",
    price: 37.00 },
  { id: "real-estate-app", category: "Apps", name: "Rental Property Finances: Individual Edition",
    desc: "Track rental income and expenses by property, forecast five years of cash flow, and see your mortgage and depreciation schedules. Works offline on Windows and Mac, with a full installation and use guide and sample data to explore. For your own properties.",
    price: 57.00, page: "apps/rental-property-finances.html" },
  { id: "rental-cleaning-calc", category: "Apps", name: "Rental Cleaning Pricing Calculator",
    desc: "Price every cabin turnover with confidence. Enter the bedrooms, beds, extras and the checkout-to-check-in window, and see the price, the crew you need, the finish time and your profit. Then send owners a polished quote with your own logo. Created from real experience running a Gatlinburg cabin rental company, with built-in prices for 10 vacation-rental markets and free price updates. Works in any browser on Windows and Mac, with a phone and tablet version for iPhone, iPad and Android (burnishedgracestudio.com/apps/rental-cleaning-pricing/). No subscription. Includes the calculator, the phone link, and the install and use guide. Single-use license for one business.",
    price: 17.00 },
  { id: "finance-apps", category: "Apps", name: "Finance Apps",
    desc: "Downloadable finance apps for Windows and Mac, each with a full installation and use guide.",
    price: null },
  { id: "rental-finances-plr", category: "PLR packages", name: "Rental Property Finances: PLR Edition",
    desc: "Rebrand the Rental Property Finances app completely, with your own name, logo, colors and guides, and sell it as your product. Includes a no-code Rebrand Tool, the source code, sales copy and the PLR terms. Includes everything in the Individual Edition. Minimum resale price $57 per copy.",
    price: 107.00, page: "apps/rental-property-finances.html#editions", includes: ["real-estate-app"] },
  { id: "rental-cleaning-calc-plr", category: "PLR packages", name: "Rental Cleaning Pricing Calculator: Private Label Rights Edition",
    desc: "Sell this calculator as your own. The built-in Rebrand tool changes the name, tagline, colors and credit line, then downloads your branded copy in one click. No coding needed. Includes the calculator with the Rebrand tool, an editable install and use guide in Word plus a PDF, and the PLR license terms. You may rebrand it and sell it to end users under a single-use license, at no less than $17 a copy. You may not pass on resale or PLR rights, or give it away. Full terms are in the PLR License Terms included with your download. Designed with AI assistance.",
    price: 47.00, includes: ["rental-cleaning-calc"] },
  { id: "beatitudes-kids", category: "Coloring books and planners", name: "The Beatitudes: Kids Edition",
    desc: "40 detailed pictures to color from Matthew 5:3–12, with two scenes from Bible times and two from everyday life today for each Beatitude. Pictures only, no text. Best for ages 8 and up. Printable PDF, 42 pages, 8.5 × 11 in, with an optional color cover. For personal and household use.",
    price: 4.99 },
  { id: "beatitudes-teen", category: "Coloring books and planners", name: "The Beatitudes: Teen Devotional Edition",
    desc: "The same 40 illustrations, with each Beatitude opening with its verse (ESV) and a short reflection and closing with a Reflect page of questions to journal. Printable PDF, 64 pages, 8.5 × 11 in, with an optional color cover. For personal and household use.",
    price: 7.99 },
  { id: "beatitudes-adult", category: "Coloring books and planners", name: "The Beatitudes: Adult Devotional Edition",
    desc: "The full devotional. Each of the 40 illustrations faces a page with the verse (ESV), a reflection question and lined space for notes and prayers, with a Reflect page for each Beatitude. Printable PDF, 104 pages, 8.5 × 11 in, with an optional color cover. For personal and household use.",
    price: 9.99 },
  { id: "beatitudes-bundle", category: "Coloring books and planners", name: "The Beatitudes: Complete Bundle (Kids, Teen and Adult)",
    desc: "All three editions, so the whole family can color the same scenes, each at their own level. Three printable PDFs with an optional color cover. You save $5.98 compared with buying each edition. For personal and household use.",
    price: 16.99, contains: ["beatitudes-kids", "beatitudes-teen", "beatitudes-adult"],
    notice: { text: "Already includes the Kids, Teen and Adult editions. Add a single edition only if it’s a gift for another household.",
              keep: "Keep it, it’s a gift", remove: "Remove the single edition" } },
  { id: "beatitudes-kids-es", category: "Coloring books in Spanish (Libros para colorear en español)", name: "Las Bienaventuranzas: Libro para colorear para niños (Spanish edition)",
    desc: "40 dibujos detallados para colorear sobre Mateo 5:3–12, con dos escenas de los tiempos bíblicos y dos de la vida cotidiana de hoy para cada Bienaventuranza. Solo dibujos, sin texto. Recomendado para niños de 8 años en adelante. PDF imprimible de 42 páginas, tamaño carta, con portada a color opcional. Para uso personal y familiar.",
    price: 4.99 },
  { id: "beatitudes-teen-es", category: "Coloring books in Spanish (Libros para colorear en español)", name: "Las Bienaventuranzas: Libro devocional para colorear para jóvenes (Spanish edition)",
    desc: "Las mismas 40 ilustraciones. Cada Bienaventuranza comienza con su versículo (Reina-Valera 1909) y una breve reflexión, y termina con una página de preguntas para reflexionar y escribir. PDF imprimible de 64 páginas, tamaño carta, con portada a color opcional. Para uso personal y familiar.",
    price: 7.99 },
  { id: "beatitudes-adult-es", category: "Coloring books in Spanish (Libros para colorear en español)", name: "Las Bienaventuranzas: Libro devocional para colorear para adultos (Spanish edition)",
    desc: "El devocional completo. Cada una de las 40 ilustraciones tiene enfrente una página con el versículo (Reina-Valera 1909), una pregunta de reflexión y líneas para notas y oraciones, con una página de reflexión para cada Bienaventuranza. PDF imprimible de 104 páginas, tamaño carta, con portada a color opcional. Para uso personal y familiar.",
    price: 9.99 },
  { id: "beatitudes-bundle-es", category: "Coloring books in Spanish (Libros para colorear en español)", name: "Las Bienaventuranzas: Paquete completo para niños, jóvenes y adultos (Spanish edition)",
    desc: "Las tres ediciones, para que toda la familia coloree las mismas escenas, cada uno a su nivel. Tres PDF imprimibles con portadas a color opcionales. Ahorras $5.98 frente a comprar cada edición por separado. Para uso personal y familiar.",
    price: 16.99, contains: ["beatitudes-kids-es", "beatitudes-teen-es", "beatitudes-adult-es"],
    notice: { text: "Ya incluye las ediciones para niños, jóvenes y adultos. Agrega una edición individual solo si es un regalo para otro hogar.",
              keep: "Mantenerla, es un regalo", remove: "Quitar la edición individual" } },
  { id: "budget-ledger", category: "Free tools", name: "Budget Ledger",
    desc: "Track deposits, expenses and upcoming bills, and see what is truly free to spend. Works on phones, tablets and computers, even offline. Free, with no sign-up; your entries stay on your device.",
    price: null, free: "tools/budget-ledger/" },
  { id: "echoes-unseen", category: "Books", name: "Echoes of the Unseen",
    desc: "Book one of the Echoes series: why cultures across oceans and millennia remember giants, floods, and a lost world, tested against Scripture.",
    price: null }

    
];
