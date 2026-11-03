<?php
// One-click unsubscribe from survey update emails. Each person's link is in
// the "Unsubscribe link" column of the A-Z files on the private survey page.
require __DIR__ . '/survey-lib.php';
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');

$t = (string)($_GET['t'] ?? $_POST['t'] ?? '');
$done = false;
$cfg = survey_config();
if ($cfg && preg_match('/^[a-f0-9]{32}$/', $t)) {
    try {
        $db = survey_db($cfg);
        $db->prepare('UPDATE survey_responses SET unsubscribed_at = COALESCE(unsubscribed_at, UTC_TIMESTAMP()), updates_ok = 0 WHERE unsubscribe_token = ?')->execute([$t]);
        $chk = $db->prepare('SELECT 1 FROM survey_responses WHERE unsubscribe_token = ? AND unsubscribed_at IS NOT NULL');
        $chk->execute([$t]);
        $done = (bool)$chk->fetchColumn();
    } catch (Throwable $e) { error_log('survey unsubscribe: ' . $e->getMessage()); }
}
?><!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>Unsubscribe · Burnished Grace Creative Studio</title>
<link rel="stylesheet" href="../styles.css"></head><body>
<main class="wrap" style="padding:4rem 0;max-width:40rem">
<h1>Burnished Grace Creative Studio</h1>
<?php if ($done): ?>
<p>You’re unsubscribed. You won’t receive any more update emails from Burnished Grace Creative Studio.</p>
<?php else: ?>
<p>This unsubscribe link didn’t work. Please email <a href="mailto:inquiry@BurnishedGraceStudio.com?subject=Unsubscribe">inquiry@BurnishedGraceStudio.com</a> and you’ll be removed by hand.</p>
<?php endif; ?>
<p><a href="../index.html">Back to Burnished Grace</a></p>
</main></body></html>
