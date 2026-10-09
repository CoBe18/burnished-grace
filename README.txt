BURNISHED GRACE CREATIVE STUDIO — WEBSITE FILES

UPLOADING
Upload everything in this folder to your web host, keeping the same layout:
  index.html, styles.css, products.js, shop.js, and the "articles", "apps",
  "images" and "api" folders.
index.html is the homepage.

ADDING PRICES (turns on the "Add to order" checkbox)
Currently priced: Commercial Cleaning App $37.00,
Rental Property Finances: Individual Edition $57.00,
Rental Property Finances: PLR Edition $107.00.
1. Open products.js in any text editor (Notepad on Windows, TextEdit on Mac).
2. Find the product and change   price: null   to a number, e.g.   price: 19.99
3. Save and re-upload products.js.
4. Change the same product's price in api/catalog.php, upload that file too,
   and upload the product's ZIP to bg-private/files. The server checks every
   payment against api/catalog.php. If the two prices differ, buyers pay but
   do not get their download links.
Products with price: null show "Coming soon".

PRODUCT PAGES
Product pages live in the "apps" folder, for example apps/rental-property-finances.html.
Text you are likely to change is marked with <!-- EDIT: ... --> notes. Prices on these
pages come from products.js automatically. Screenshots live in images/apps/.
A product with  page: "apps/....html"  in products.js shows a "See details" link in the shop.
A product with  includes: ["other-id"]  replaces that product in the order, so nobody
pays twice (the PLR Edition includes the Individual Edition).
A link like  index.html?add=real-estate-app#shop  opens the shop with that item checked.

HOW CHECKOUT AND DOWNLOADS WORK
Shoppers check items, the total adds up, and they pay through PayPal.
After PayPal takes the payment, the site asks PayPal directly to confirm the
order and the amount paid (api/verify.php), checking each item against the
prices in api/catalog.php. Only then does the buyer get download buttons, and
the same links are emailed to their PayPal email address. Links expire after
72 hours. Each order is added to bg-private/orders.csv on the server.
If anything goes wrong, the buyer is asked to email inquiry@BurnishedGraceStudio.com
with their receipt, and you send the files by hand.

PRIVATE STORE FOLDER (one-time setup on IONOS — never put it in GitHub)
Create a folder named bg-private NEXT TO your website folder, not inside it,
so no one can open it from a browser:
  bg-private/config.php   your PayPal keys and settings (below)
  bg-private/files/       the zip files buyers download. The names must match
                          the "file" names in api/catalog.php exactly:
                            Commercial-Cleaning-App.zip
                            Rental-Property-Finances-Individual-Edition.zip
                            Rental-Property-Finances-PLR-Edition.zip
config.php looks like this. Fill in the parts in CAPITALS:

  <?php
  return [
    'paypal_client_id' => 'YOUR_LIVE_CLIENT_ID',
    'paypal_secret'    => 'YOUR_LIVE_SECRET',
    'signing_key'      => 'A_LONG_RANDOM_PHRASE_ONLY_YOU_KNOW',
    'site_url'         => 'https://burnishedgracestudio.com',
    'support_email'    => 'inquiry@BurnishedGraceStudio.com',
    'link_hours'       => 72,
    'products'         => [],
  ];

Products and prices come from api/catalog.php, so 'products' can stay empty.

PAYPAL
Checkout sends the price from the website, so there are no fixed-price
buttons in PayPal to keep updated. Delete any old PayPal buttons or payment
links for these products so nobody pays an old price through them.
The client ID in index.html (the paypal.com/sdk line near the bottom) and the
client ID and secret in config.php must all come from the SAME PayPal REST app
(developer.paypal.com > Apps & Credentials > Live). If they come from
different places, payments go through but downloads fail.

PORTFOLIO
The portfolio section is in index.html, hidden inside comment markers
(<!-- and -->). Remove those markers and fill in the links once projects are finished.

SECURE CONNECTION (SSL / HTTPS)
Turn on your free IONOS SSL certificate BEFORE uploading these files.
The hidden file ".htaccess" in this folder sends every visitor to the secure
https:// version of your site. If it is uploaded before SSL is active, the
site will not load until SSL is turned on.

LOGO
Put your logo in the "images" folder, named logo.png. It appears large in the
maroon banner on the homepage (the top bar keeps the gold text name). Upload the images folder to IONOS the same way as articles.
