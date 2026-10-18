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
    'rental-cleaning-calc' => [
        'name'  => 'Rental Cleaning Pricing Calculator',
        'price' => 17.00,
        'file'  => 'Rental-Cleaning-Pricing-Calculator.zip',
    ],
    'rental-cleaning-calc-plr' => [
        'name'  => 'Rental Cleaning Pricing Calculator: Private Label Rights Edition',
        'price' => 47.00,
        'file'  => 'Rental-Cleaning-Pricing-Calculator-PLR.zip',
    ],
    'beatitudes-kids' => [
        'name'  => 'The Beatitudes: Kids Edition',
        'price' => 4.99,
        'file'  => 'Beatitudes-Kids-Edition.zip',
    ],
    'beatitudes-teen' => [
        'name'  => 'The Beatitudes: Teen Devotional Edition',
        'price' => 7.99,
        'file'  => 'Beatitudes-Teen-Edition.zip',
    ],
    'beatitudes-adult' => [
        'name'  => 'The Beatitudes: Adult Devotional Edition',
        'price' => 9.99,
        'file'  => 'Beatitudes-Adult-Edition.zip',
    ],
    'beatitudes-bundle' => [
        'name'  => 'The Beatitudes: Complete Bundle (Kids, Teen and Adult)',
        'price' => 16.99,
        'file'  => 'Beatitudes-Complete-Bundle.zip',
    ],
    'beatitudes-kids-es' => [
        'name'  => 'Las Bienaventuranzas: Libro para colorear para niños (Spanish edition)',
        'price' => 4.99,
        'file'  => 'Beatitudes-Kids-Edition-Spanish.zip',
    ],
    'beatitudes-teen-es' => [
        'name'  => 'Las Bienaventuranzas: Libro devocional para colorear para jóvenes (Spanish edition)',
        'price' => 7.99,
        'file'  => 'Beatitudes-Teen-Edition-Spanish.zip',
    ],
    'beatitudes-adult-es' => [
        'name'  => 'Las Bienaventuranzas: Libro devocional para colorear para adultos (Spanish edition)',
        'price' => 9.99,
        'file'  => 'Beatitudes-Adult-Edition-Spanish.zip',
    ],
    'beatitudes-bundle-es' => [
        'name'  => 'Las Bienaventuranzas: Paquete completo para niños, jóvenes y adultos (Spanish edition)',
        'price' => 16.99,
        'file'  => 'Beatitudes-Complete-Bundle-Spanish.zip',
    ],
];
