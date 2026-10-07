<?php
// Called by the shop after PayPal payment. Confirms the order with PayPal,
// checks every item was paid at the real price, then returns download links.
require __DIR__ . '/lib.php';
header('Content-Type: application/json');
$fail = function (string $why, int $code = 400) { http_response_code($code); echo json_encode(['ok' => false, 'error' => $why]); exit; };

$in = json_decode(file_get_contents('php://input'), true);
$orderId = is_array($in) ? ($in['orderID'] ?? '') : '';
if (!preg_match('/^[A-Z0-9]{5,40}$/', $orderId)) $fail('Invalid order.');

$order = bg_paypal_order($CFG, $orderId);
if (!$order) $fail('Could not confirm the order with PayPal.', 502);
if (($order['status'] ?? '') !== 'COMPLETED') $fail('Payment is not complete.', 402);

$pu = $order['purchase_units'][0] ?? [];
$cap = $pu['payments']['captures'][0] ?? [];
if (($cap['status'] ?? '') !== 'COMPLETED') $fail('Payment is not complete.', 402);
$paid = (float)($cap['amount']['value'] ?? 0);
if (($cap['amount']['currency_code'] ?? '') !== 'USD') $fail('Unexpected currency.');

$catalog = $CFG['products'];
$skus = []; $expected = 0.0;
foreach ($pu['items'] ?? [] as $it) {
    $sku = $it['sku'] ?? '';
    if (!isset($catalog[$sku])) $fail('Unknown product in order.');
    $qty = max(1, (int)($it['quantity'] ?? 1));
    $expected += $catalog[$sku]['price'] * $qty;
    $skus[$sku] = true;
}
if (!$skus) $fail('No products in order.');
if ($paid + 0.001 < $expected) $fail('Amount paid does not match prices.', 402);

$hours = (int)($CFG['link_hours'] ?? 72);
$exp = time() + $hours * 3600;
$links = [];
foreach (array_keys($skus) as $sku) {
    $t = bg_token(['o' => $orderId, 's' => $sku, 'e' => $exp], $CFG['signing_key']);
    $links[] = ['name' => $catalog[$sku]['name'], 'url' => $CFG['site_url'] . '/api/download.php?t=' . $t];
}

// Keep a simple order record (once per order) and email the buyer their links.
$log = dirname($CFG['files_dir']) . '/orders.csv';
$seen = is_file($log) && strpos(file_get_contents($log), $orderId) !== false;
if (!$seen) {
    $email = $order['payer']['email_address'] ?? '';
    $nameP = trim(($order['payer']['name']['given_name'] ?? '') . ' ' . ($order['payer']['name']['surname'] ?? ''));
    $fh = fopen($log, 'a');
    if ($fh) { fputcsv($fh, [date('c'), $orderId, $nameP, $email, implode('|', array_keys($skus)), number_format($paid, 2)]); fclose($fh); }
    if ($email && filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $body = "Thank you for your purchase from Burnished Grace Creative Studio!\n\nYour downloads (links work for $hours hours):\n\n";
        foreach ($links as $l) $body .= $l['name'] . ":\n" . $l['url'] . "\n\n";
        $body .= "Each download includes an installation and use guide.\nQuestions? Reply to this email or write to " . $CFG['support_email'] . "\n\nOrder: $orderId\n";
        $from = $CFG['support_email'];
        @mail($email, 'Your Burnished Grace downloads', $body,
            "From: Burnished Grace Creative Studio <$from>\r\nReply-To: $from\r\nContent-Type: text/plain; charset=UTF-8", "-f$from");
    }
}

echo json_encode(['ok' => true, 'hours' => $hours, 'links' => $links]);
