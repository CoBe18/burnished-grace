/*
  BURNISHED GRACE: PRODUCT LIST
  -----------------------------
  Each product needs: id, category, name, desc, price (a number, or null for "Coming soon").
  Optional:
    page:     a details page, shown as a "See details" link under the description.
    includes: ids of products this one already contains. Choosing it removes those
              from the order, so nobody pays twice (used by the PLR Edition).

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
  { id: "finance-apps", category: "Apps", name: "Finance Apps",
    desc: "Downloadable finance apps for Windows and Mac, each with a full installation and use guide.",
    price: null },
  { id: "rental-finances-plr", category: "PLR packages", name: "Rental Property Finances: PLR Edition",
    desc: "Rebrand the Rental Property Finances app completely, with your own name, logo, colors and guides, and sell it as your product. Includes a no-code Rebrand Tool, the source code, sales copy and the PLR terms. Includes everything in the Individual Edition. Minimum resale price $57 per copy.",
    price: 107.00, page: "apps/rental-property-finances.html#editions", includes: ["real-estate-app"] },
  { id: "echoes-unseen", category: "Books", name: "Echoes of the Unseen",
    desc: "Book one of the Echoes series: why cultures across oceans and millennia remember giants, floods, and a lost world, tested against Scripture.",
    price: null },
  { id: "beatitudes", category: "Books", name: "The Beatitudes: A Devotional Coloring Book",
    desc: "24 realistic illustrations with NIV text and space for reflection and journaling. 8.5 × 11 inches.",
    price: null }
];
