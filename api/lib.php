<?php
// Shared helpers for secure downloads. The private settings file lives OUTSIDE
// the website folder, so nobody can open it from a browser.
$BG_PRIVATE = dirname(__DIR__, 2) . '/bg-private';
$cfgFile = $BG_PRIVATE . '/config.php';
if (!is_file($cfgFile)) { http_response_code(500); exit('Store setup is incomplete.'); }
$CFG = require $cfgFile;
$CFG['files_dir'] = $BG_PRIVATE . '/files';
$CFG['api_base'] = $CFG['api_base'] ?? 'https://api-m.paypal.com';

function bg_b64(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function bg_unb64(string $s): string { return base64_decode(strtr($s, '-_', '+/')); }

function bg_token(array $data, string $key): string {
    $p = bg_b64(json_encode($data));
    return $p . '.' . bg_b64(hash_hmac('sha256', $p, $key, true));
}
function bg_read_token(string $t, string $key): ?array {
    $parts = explode('.', $t);
    if (count($parts) !== 2) return null;
    [$p, $sig] = $parts;
    if (!hash_equals(bg_b64(hash_hmac('sha256', $p, $key, true)), $sig)) return null;
    $d = json_decode(bg_unb64($p), true);
    return is_array($d) ? $d : null;
}

function bg_http(string $method, string $url, array $headers, ?string $body = null): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 20]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    $out = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, $out === false ? null : json_decode($out, true)];
}

function bg_paypal_order(array $cfg, string $orderId): ?array {
    [$c, $tok] = bg_http('POST', $cfg['api_base'] . '/v1/oauth2/token',
        ['Authorization: Basic ' . base64_encode($cfg['paypal_client_id'] . ':' . $cfg['paypal_secret']),
         'Content-Type: application/x-www-form-urlencoded'], 'grant_type=client_credentials');
    if ($c !== 200 || empty($tok['access_token'])) return null;
    [$c, $order] = bg_http('GET', $cfg['api_base'] . '/v2/checkout/orders/' . rawurlencode($orderId),
        ['Authorization: Bearer ' . $tok['access_token']]);
    return $c === 200 ? $order : null;
}
