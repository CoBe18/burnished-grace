<?php
// Delivers a purchased file when given a valid, unexpired download link.
require __DIR__ . '/lib.php';
$d = bg_read_token($_GET['t'] ?? '', $CFG['signing_key']);
$deny = function (string $msg) use ($CFG) {
    http_response_code(403); header('Content-Type: text/html; charset=utf-8');
    echo '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font-family:sans-serif;max-width:36rem;margin:4rem auto;padding:0 1rem">'
       . '<h1>Download unavailable</h1><p>' . htmlspecialchars($msg) . '</p><p>Email <a href="mailto:' . htmlspecialchars($CFG['support_email']) . '">'
       . htmlspecialchars($CFG['support_email']) . '</a> with your PayPal receipt and we will send your files right away.</p>';
    exit;
};
if (!$d) $deny('This download link is not valid.');
if (($d['e'] ?? 0) < time()) $deny('This download link has expired.');
$p = $CFG['products'][$d['s'] ?? ''] ?? null;
if (!$p) $deny('This product could not be found.');
$file = $CFG['files_dir'] . '/' . basename($p['file']);
if (!is_file($file)) $deny('This file is temporarily unavailable.');
header('Content-Type: application/zip');
header('Content-Disposition: attachment; filename="' . basename($p['file']) . '"');
header('Content-Length: ' . filesize($file));
header('Cache-Control: private, no-store');
readfile($file);
