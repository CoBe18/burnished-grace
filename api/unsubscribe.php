<?php
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
// Burnished Grace Creative Studio - unsubscribe handler
// The form is unsubscribe/index.html. This file:
// 1) Saves the address to bg-private/unsubscribes.csv (outside the website folder, so no one can open it)
// 2) Emails inquiry@BurnishedGraceStudio.com so the contact can be marked "Do not email"

$notify_to   = 'inquiry@BurnishedGraceStudio.com';
$notify_from = 'inquiry@BurnishedGraceStudio.com';
$list_file   = dirname(__DIR__, 2) . '/bg-private/unsubscribes.csv';

function page($title, $message) {
    $t = htmlspecialchars($title, ENT_QUOTES, 'UTF-8');
    echo '<!DOCTYPE html><html lang="en"><head><meta charset="utf-8">'
       . '<meta name="viewport" content="width=device-width, initial-scale=1">'
       . '<meta name="robots" content="noindex, nofollow">'
       . '<title>' . $t . ' | Burnished Grace Creative Studio</title>'
       . '<link href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;600&family=Young+Serif&display=swap" rel="stylesheet">'
       . '<style>body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;'
       . 'font-family:Figtree,system-ui,sans-serif;color:#2b1a1c;background:radial-gradient(ellipse at 30% 20%,#8a2a36 0%,#5e1a24 45%,#3f0f17 100%)}'
       . '.card{max-width:480px;width:100%;background:#fbf6ee;border:1px solid #c9a24a;border-radius:14px;padding:36px 32px;box-shadow:0 18px 50px rgba(0,0,0,.35)}'
       . 'h1{font-family:"Young Serif",Georgia,serif;font-weight:400;color:#5e1a24;margin:0 0 12px}p{line-height:1.6}a{color:#5e1a24}</style>'
       . '</head><body><main class="card"><h1>' . $t . '</h1><p>' . $message . '</p>'
       . '<p><a href="https://burnishedgracestudio.com">Return to Burnished Grace Creative Studio</a></p></main></body></html>';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: ../unsubscribe/');
    exit;
}

// Bots fill the hidden field; quietly show success without saving
if (!empty($_POST['website'])) {
    page('You are unsubscribed', 'You will not receive any more product emails from us.');
}

$email = strtolower(trim($_POST['email'] ?? ''));
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
    page('Please check that address', 'That email address doesn\'t look complete. <a href="../unsubscribe/">Go back and try again.</a>');
}

// Save to the private list (skip if already there)
$already = false;
if (is_readable($list_file)) {
    $fh = fopen($list_file, 'r');
    while (($row = fgetcsv($fh)) !== false) {
        if (isset($row[1]) && $row[1] === $email) { $already = true; break; }
    }
    fclose($fh);
}
if (!$already) {
    $fh = @fopen($list_file, 'a');
    if (!$fh) error_log('unsubscribe: could not write ' . $list_file);
    if ($fh) {
        if (flock($fh, LOCK_EX)) {
            fputcsv($fh, [gmdate('Y-m-d H:i:s') . ' UTC', $email]);
            flock($fh, LOCK_UN);
        }
        fclose($fh);
    }

    // Notify the inbox
    $subject = 'Unsubscribe request: ' . $email;
    $body  = "Someone asked to stop receiving Burnished Grace product emails.\n\n";
    $body .= "Email: $email\n";
    $body .= 'Time: ' . gmdate('Y-m-d H:i:s') . " UTC\n\n";
    $body .= "Mark this contact \"Do not email\" in Notion (Cleaning Calculator Outreach) before the next send.\n";
    $headers = 'From: Burnished Grace Studio <' . $notify_from . ">\r\n" . 'Content-Type: text/plain; charset=UTF-8';
    @mail($notify_to, $subject, $body, $headers);
}

page('You are unsubscribed', 'We\'ve removed <strong>' . htmlspecialchars($email, ENT_QUOTES, 'UTF-8')
   . '</strong> from our product emails. You won\'t receive any more of them.');
