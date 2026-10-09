<?php
// PRODUCTS FOR SALE, checked against every PayPal payment.
// id => name, price, and the ZIP file name in bg-private/files on the server.
// The id and price must match the same product in products.js.
// Opening this file in a browser shows nothing.
if (count(get_included_files()) === 1) { http_response_code(404); exit; }
return [
    'commercial-cleaning' => [
        'name'  => 'Commercial Cleaning App',
        'price' => 37.00,
        'file'  => 'Cleaning-Budget-Quote-Planner.zip',
    ],
    'real-estate-app' => [
        'name'  => 'Rental Property Finances: Individual Edition',
        'price' => 57.00,
        'file'  => 'Rental-Property-Finances-Individual-Edition.zip',
    ],
    'rental-finances-plr' => [
        'name'  => 'Rental Property Finances: PLR Edition',
        'price' => 107.00,
        'file'  => 'Rental-Property-Finances-PLR-Edition.zip',
    ],
];
