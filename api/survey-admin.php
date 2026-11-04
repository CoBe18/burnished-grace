<?php
// Private survey page: responses filed A-Z by last name, with each letter
// downloadable as its own spreadsheet file (A.csv, B.csv ...) or all at once.
// Protected by the admin password in bg-private/survey-config.php.
require __DIR__ . '/survey-lib.php';
header('X-Robots-Tag: noindex, nofollow');
header('Cache-Control: no-store');
header('X-Frame-Options: DENY');

session_set_cookie_params(['lifetime' => 0, 'path' => '/api/', 'secure' => true, 'httponly' => true, 'samesite' => 'Strict']);
session_name('bgsurvey');
session_start();

$cfg = survey_config();
$h = fn($s) => htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8');
$letters = array_merge(range('A', 'Z'), ['#']);

function page(string $title, string $body): void {
    echo '<!doctype html><html lang="en"><head><meta charset="utf-8">'
       . '<meta name="viewport" content="width=device-width,initial-scale=1">'
       . '<meta name="robots" content="noindex,nofollow"><title>' . htmlspecialchars($title) . '</title><style>
:root{--navy:#12244a;--navy-2:#1d3566;--gold:#c9a24a;--ink:#1b2333;--muted:#5b6476;--line:#d8dde8;--bg:#f4f6fa}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
header{background:var(--navy);color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap}
header h1{margin:0;font-size:1.25rem;font-weight:600}header a{color:var(--gold)}
main{max-width:1200px;margin:0 auto;padding:20px 16px 48px}
.card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:18px;margin:0 0 16px}
.tabs{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 16px}
.tabs a,.tabs span{min-width:44px;min-height:44px;display:inline-grid;place-items:center;padding:4px 8px;border-radius:8px;border:1px solid var(--line);background:#fff;color:var(--navy);text-decoration:none;font-weight:600;line-height:1.1;text-align:center}
.tabs a small,.tabs span small{display:block;font-weight:400;font-size:.75rem;color:var(--muted)}
.tabs a.on{background:var(--navy);color:#fff;border-color:var(--navy)}.tabs a.on small{color:#dfe5f2}
.tabs span{opacity:.45}
.btn{display:inline-block;background:var(--navy);color:#fff;border:0;border-radius:8px;padding:10px 16px;font:inherit;font-weight:600;text-decoration:none;cursor:pointer;min-height:44px}
.btn.alt{background:#fff;color:var(--navy);border:1px solid var(--navy)}
.actions{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 16px}
table{width:100%;border-collapse:collapse;font-size:.95rem}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid var(--line);vertical-align:top}
th{color:var(--muted);font-weight:600;font-size:.85rem}
.wrap{overflow-x:auto}
details summary{cursor:pointer;color:var(--navy-2);font-weight:600}
dl{margin:8px 0 0}dt{font-weight:600;margin-top:8px}dd{margin:0 0 0 0;white-space:pre-wrap}
.tag{display:inline-block;padding:1px 8px;border-radius:99px;font-size:.8rem;background:#e7f0e7;color:#24572a}.tag.no{background:#eef0f4;color:var(--muted)}.tag.off{background:#fbe9e7;color:#8a2a1c}
input[type=password]{font:inherit;padding:10px 12px;border:1px solid var(--line);border-radius:8px;width:100%;max-width:320px;min-height:44px}
.err{color:#8a2a1c;font-weight:600}
.btn.del{background:#fff;color:#8a2a1c;border:1px solid #c9a39c;padding:6px 12px;min-height:36px}.btn.del:hover{background:#fbe9e7}
.bar{display:grid;grid-template-columns:minmax(8rem,16rem) 1fr 6.5rem;gap:10px;align-items:center;margin:6px 0}
.bar .track{height:14px;background:#e8ebf2;border-radius:99px;overflow:hidden}.bar .fill{display:block;height:100%;background:var(--navy-2)}
.bar .num{font-variant-numeric:tabular-nums;color:var(--muted);text-align:right}
.muted{color:var(--muted);margin:0 0 8px}h3{margin:0 0 4px;color:var(--navy)}h3 small{font-weight:400;color:var(--muted)}
.quotes{list-style:none;margin:0;padding:0}.quotes li{border-left:4px solid var(--gold);padding:6px 12px;margin:10px 0;background:#fafbfd}
.quotes blockquote{margin:0}.quotes cite{display:block;color:var(--muted);font-size:.9rem;margin-top:4px}
@media(max-width:600px){.bar{grid-template-columns:1fr 5.5rem}.bar .lbl{grid-column:1/-1}}
@media print{header a,.actions,.tabs{display:none}body{background:#fff}.card{break-inside:avoid;border-color:#ccc}}
.flash{background:#e7f0e7;color:#24572a;border-radius:8px;padding:10px 14px;margin:0 0 16px;font-weight:600}
</style></head><body>' . $body . '</body></html>';
    exit;
}

if (!$cfg) {
    page('Survey responses', '<header><h1>Survey responses</h1></header><main><div class="card"><p class="err">The survey database is not set up yet.</p><p>' . htmlspecialchars($GLOBALS['SURVEY_CONFIG_PROBLEM'] ?: 'Create bg-private/survey-config.php as described in README.txt under "SURVEY DATABASE".') . '</p></div></main>');
}

// Sign in / sign out
if (isset($_GET['logout'])) { $_SESSION = []; session_destroy(); header('Location: survey-admin.php'); exit; }
if (empty($_SESSION['ok'])) {
    $msg = '';
    if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
        if (hash_equals((string)$cfg['admin_password'], (string)($_POST['password'] ?? ''))) {
            session_regenerate_id(true);
            $_SESSION['ok'] = true;
            $_SESSION['csrf'] = bin2hex(random_bytes(16));
            header('Location: survey-admin.php'); exit;
        }
        sleep(2);
        $msg = '<p class="err" role="alert">That password is not right.</p>';
    }
    page('Sign in · Survey responses', '<header><h1>Survey responses</h1></header><main><div class="card"><form method="post"><label for="pw"><strong>Password</strong></label><br><input type="password" id="pw" name="password" autocomplete="current-password" autofocus required> ' . $msg . '<p><button class="btn" type="submit">Sign in</button></p></form></div></main>');
}

try { $db = survey_db($cfg); }
catch (Throwable $e) {
    error_log('survey admin db: ' . $e->getMessage());
    page('Survey responses', '<header><h1>Survey responses</h1></header><main><div class="card"><p class="err">Could not connect to the survey database.</p><p>Check the database name, host, user and password in <code>bg-private/survey-config.php</code>.</p></div></main>');
}

function rows_for(PDO $db, ?string $letter): array {
    $sql = 'SELECT * FROM survey_responses' . ($letter === null ? '' : ' WHERE letter = ?') . ' ORDER BY letter, last_name, first_name, created_at';
    $st = $db->prepare($sql);
    $st->execute($letter === null ? [] : [$letter]);
    return $st->fetchAll();
}

function local_time(string $utc): string {
    $d = new DateTime($utc, new DateTimeZone('UTC'));
    $d->setTimezone(new DateTimeZone('America/New_York'));
    return $d->format('Y-m-d g:i A');
}

// Spreadsheet-safe cell: values starting with = + - @ are shown as text.
function cell(string $v): string { return preg_match('/^[=+\-@\t\r]/', $v) ? "'" . $v : $v; }

function csv_text(array $rows): string {
    $f = fopen('php://temp', 'w+');
    fwrite($f, "\xEF\xBB\xBF"); // so Excel and Numbers read accents correctly
    $head = ['Last name', 'First name', 'Email', 'Wants updates', 'Unsubscribed', 'First submitted (Eastern)', 'Last submitted (Eastern)', 'Times submitted', 'Unsubscribe link'];
    fputcsv($f, array_merge($head, array_values(SURVEY_QUESTIONS)), ',', '"', '');
    foreach ($rows as $r) {
        $a = json_decode($r['answers'], true) ?: [];
        $line = [$r['last_name'], $r['first_name'], $r['email'], $r['updates_ok'] ? 'Yes' : 'No',
                 $r['unsubscribed_at'] ? 'Yes' : 'No', local_time($r['created_at']), local_time($r['updated_at']), (string)$r['times_submitted'],
                 survey_site_url() . '/api/survey-unsubscribe.php?t=' . $r['unsubscribe_token']];
        foreach (array_keys(SURVEY_QUESTIONS) as $k) $line[] = $a[$k] ?? '';
        fputcsv($f, array_map('cell', $line), ',', '"', '');
    }
    rewind($f);
    return stream_get_contents($f);
}

if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(16));

// Delete one response (button on each row; asks to confirm first)
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'POST' && ($_POST['action'] ?? '') === 'delete') {
    $back = in_array($_POST['l'] ?? '', $letters, true) ? $_POST['l'] : 'A';
    if (hash_equals($_SESSION['csrf'], (string)($_POST['csrf'] ?? ''))) {
        $db->prepare('DELETE FROM survey_responses WHERE id = ?')->execute([(int)($_POST['id'] ?? 0)]);
        $_SESSION['flash'] = 'Response deleted.';
    }
    header('Location: survey-admin.php?l=' . rawurlencode($back)); exit;
}

// Downloads
if (isset($_GET['download'])) {
    $want = (string)$_GET['download'];
    $stamp = (new DateTime('now', new DateTimeZone('America/New_York')))->format('Y-m-d');
    if ($want === 'all') {
        $all = rows_for($db, null);
        $by = [];
        foreach ($all as $r) $by[$r['letter']][] = $r;
        $tmp = tempnam(sys_get_temp_dir(), 'bgs');
        $zip = new ZipArchive();
        $zip->open($tmp, ZipArchive::OVERWRITE);
        foreach ($by as $L => $rows) $zip->addFromString(($L === '#' ? 'Other' : $L) . '.csv', csv_text($rows));
        if (!$by) $zip->addFromString('README.txt', "No survey responses yet.\n");
        $zip->close();
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="survey-responses-A-Z-' . $stamp . '.zip"');
        header('Content-Length: ' . filesize($tmp));
        readfile($tmp); unlink($tmp); exit;
    }
    if (in_array($want, $letters, true)) {
        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename="' . ($want === '#' ? 'Other' : $want) . '.csv"');
        echo csv_text(rows_for($db, $want)); exit;
    }
    http_response_code(404); exit;
}

// Page
$counts = array_fill_keys($letters, 0);
foreach ($db->query('SELECT letter, COUNT(*) n FROM survey_responses GROUP BY letter') as $c) $counts[$c['letter']] = (int)$c['n'];
$total = array_sum($counts);
$sel = isset($_GET['l']) && in_array($_GET['l'], $letters, true) ? $_GET['l'] : null;
if ($sel === null) foreach ($letters as $L) if ($counts[$L]) { $sel = $L; break; }
$sel = $sel ?? 'A';
$label = $sel === '#' ? 'Other' : $sel;

$tabs = '';
foreach ($letters as $L) {
    $name = $L === '#' ? 'Other' : $L;
    $inner = $h($name) . '<small>' . $counts[$L] . '</small>';
    $tabs .= $counts[$L]
        ? '<a href="?l=' . rawurlencode($L) . '"' . ($L === $sel ? ' class="on" aria-current="page"' : '') . ' aria-label="' . $h($name) . ', ' . $counts[$L] . ($counts[$L] === 1 ? ' response">' : ' responses">') . $inner . '</a>'
        : '<span aria-label="' . $h($name) . ', no responses">' . $inner . '</span>';
}

// Summary: every answer tallied across all responses
if (($_GET['view'] ?? '') === 'summary') {
    $all = rows_for($db, null);
    $n = count($all);
    $tally = []; $written = [];
    foreach ($all as $r) {
        $a = json_decode($r['answers'], true) ?: [];
        foreach (SURVEY_CHOICES as $k => $opts) {
            if (!isset($a[$k])) continue;
            $picked = in_array($k, SURVEY_MULTI, true) ? array_map('trim', explode(', ', $a[$k])) : [trim($a[$k])];
            foreach ($picked as $v) $tally[$k][$v] = ($tally[$k][$v] ?? 0) + 1;
        }
        foreach (SURVEY_WRITTEN as $k) if (!empty($a[$k])) $written[$k][] = ['who' => $r['first_name'] . ' ' . $r['last_name'], 'text' => $a[$k]];
    }
    $body = '';
    foreach (SURVEY_CHOICES as $k => $opts) {
        $answered = 0;
        foreach ($all as $r) { $a = json_decode($r['answers'], true) ?: []; if (isset($a[$k])) $answered++; }
        $extra = array_diff(array_keys($tally[$k] ?? []), $opts);
        $bars = '';
        foreach (array_merge($opts, $extra) as $o) {
            $c = $tally[$k][$o] ?? 0;
            $pct = $answered ? round($c * 100 / $answered) : 0;
            $bars .= '<div class="bar"><span class="lbl">' . $h($o) . '</span><span class="track"><span class="fill" style="width:' . $pct . '%"></span></span><span class="num">' . $c . ' · ' . $pct . '%</span></div>';
        }
        $note = in_array($k, SURVEY_MULTI, true) ? ' <small>(people could pick several, so percentages add up to more than 100)</small>' : '';
        $body .= '<div class="card"><h3>' . $h(SURVEY_QUESTIONS[$k]) . $note . '</h3><p class="muted">' . $answered . ' of ' . $n . ' answered</p>' . $bars . '</div>';
    }
    foreach (SURVEY_WRITTEN as $k) {
        $items = '';
        foreach ($written[$k] ?? [] as $w) $items .= '<li><blockquote>' . nl2br($h($w['text'])) . '</blockquote><cite>' . $h($w['who']) . '</cite></li>';
        $body .= '<div class="card"><h3>' . $h(SURVEY_QUESTIONS[$k]) . '</h3><p class="muted">' . count($written[$k] ?? []) . (count($written[$k] ?? []) === 1 ? ' written answer' : ' written answers') . '</p>' . ($items ? '<ul class="quotes">' . $items . '</ul>' : '') . '</div>';
    }
    page('Survey summary (' . $n . ')',
        '<header><h1>Survey summary · ' . $n . ' ' . ($n === 1 ? 'response' : 'responses') . '</h1><a href="?logout=1">Sign out</a></header><main>'
      . '<div class="actions"><a class="btn alt" href="survey-admin.php">← Back to A–Z</a><a class="btn alt" href="?download=all">Download all letters (ZIP of A–Z files)</a><button class="btn alt" type="button" onclick="window.print()">Print or save as PDF</button></div>'
      . ($n === 0 ? '<div class="card"><p>No responses yet.</p></div>' : $body)
      . '</main>');
}

$rows = rows_for($db, $sel);
$list = '';
foreach ($rows as $r) {
    $a = json_decode($r['answers'], true) ?: [];
    $dl = '';
    foreach (SURVEY_QUESTIONS as $k => $q) if (isset($a[$k])) $dl .= '<dt>' . $h($q) . '</dt><dd>' . $h($a[$k]) . '</dd>';
    $status = $r['unsubscribed_at'] ? '<span class="tag off">Unsubscribed</span>'
            : ($r['updates_ok'] ? '<span class="tag">Yes</span>' : '<span class="tag no">No</span>');
    $list .= '<tr><td><strong>' . $h($r['last_name']) . '</strong>, ' . $h($r['first_name']) . '</td><td><a href="mailto:' . $h($r['email']) . '">' . $h($r['email']) . '</a></td><td>' . $status . '</td><td>' . $h(local_time($r['updated_at'])) . ($r['times_submitted'] > 1 ? '<br><small>submitted ' . (int)$r['times_submitted'] . ' times; latest answers shown</small>' : '') . '</td><td><details><summary>Answers</summary><dl>' . $dl . '</dl></details></td>'
           . '<td><form method="post" onsubmit="return confirm(\'Delete the response from ' . $h(addslashes($r['first_name'] . ' ' . $r['last_name'])) . '? This cannot be undone.\')">'
           . '<input type="hidden" name="action" value="delete"><input type="hidden" name="id" value="' . (int)$r['id'] . '">'
           . '<input type="hidden" name="l" value="' . $h($sel) . '"><input type="hidden" name="csrf" value="' . $h($_SESSION['csrf']) . '">'
           . '<button class="btn del" type="submit" aria-label="Delete response from ' . $h($r['first_name'] . ' ' . $r['last_name']) . '">Delete</button></form></td></tr>';
}
if ($list === '') $list = '<tr><td colspan="6">No responses filed under ' . $h($label) . ' yet.</td></tr>';

$flash = (string)($_SESSION['flash'] ?? ''); unset($_SESSION['flash']);
page('Survey responses (' . $total . ')',
    '<header><h1>Survey responses · ' . $total . ' total</h1><a href="?logout=1">Sign out</a></header><main>'
  . ($flash !== '' ? '<p class="flash" role="status">' . $h($flash) . '</p>' : '')
  . '<nav class="tabs" aria-label="Filed by last name">' . $tabs . '</nav>'
  . '<div class="actions"><a class="btn" href="?view=summary">Summary of all answers</a><a class="btn alt" href="?download=' . rawurlencode($sel) . '">Download ' . $h($label) . '.csv</a>'
  . '<a class="btn alt" href="?download=all">Download all letters (ZIP of A–Z files)</a></div>'
  . '<div class="card wrap"><h2 style="margin-top:0">' . $h($label) . ' · ' . count($rows) . ' ' . (count($rows) === 1 ? 'response' : 'responses') . '</h2>'
  . '<table><thead><tr><th>Name</th><th>Email</th><th>Wants updates</th><th>Last submitted (Eastern)</th><th></th><th></th></tr></thead><tbody>' . $list . '</tbody></table></div>'
  . '</main>');
