<?php
// Shared helpers for the survey database. The private settings file lives
// OUTSIDE the website folder (bg-private/survey-config.php), so nobody can
// open it from a browser. See README.txt, "SURVEY DATABASE".
if (count(get_included_files()) === 1) { http_response_code(404); exit; }

// Why the settings could not be used, for the private survey page.
$SURVEY_CONFIG_PROBLEM = '';

function survey_config(): ?array {
    global $SURVEY_CONFIG_PROBLEM;
    $file = dirname(__DIR__, 2) . '/bg-private/survey-config.php';
    if (!is_file($file)) { $SURVEY_CONFIG_PROBLEM = 'bg-private/survey-config.php was not found.'; return null; }
    try {
        $cfg = require $file;
    } catch (Throwable $e) {
        error_log('survey-config.php: ' . $e->getMessage());
        $SURVEY_CONFIG_PROBLEM = 'bg-private/survey-config.php has a typing error on line ' . $e->getLine()
            . '. Check that each value is wrapped in straight single quotes and each line ends with a comma.';
        return null;
    }
    if (!is_array($cfg)) { $SURVEY_CONFIG_PROBLEM = 'bg-private/survey-config.php does not start with <?php and return [ ... ];'; return null; }
    foreach (['db_host', 'db_name', 'db_user', 'db_pass', 'admin_password'] as $k) {
        if (empty($cfg[$k])) { $SURVEY_CONFIG_PROBLEM = "The '$k' setting is empty."; return null; }
        if (strpos((string)$cfg[$k], 'YOUR_') !== false || strpos((string)$cfg[$k], 'PASTE_') !== false) {
            $SURVEY_CONFIG_PROBLEM = "The '$k' setting still has the placeholder text in it."; return null;
        }
    }
    return $cfg;
}

function survey_db(array $cfg): PDO {
    $dsn = 'mysql:host=' . $cfg['db_host'] . ';dbname=' . $cfg['db_name'] . ';charset=utf8mb4';
    $pdo = new PDO($dsn, $cfg['db_user'], $cfg['db_pass'], [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
    // The table is created the first time it is needed; nothing to set up by hand.
    // Each email address appears only once (uq_email).
    $pdo->exec("CREATE TABLE IF NOT EXISTS survey_responses (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        times_submitted SMALLINT UNSIGNED NOT NULL DEFAULT 1,
        letter CHAR(1) NOT NULL,
        last_name VARCHAR(80) NOT NULL,
        first_name VARCHAR(80) NOT NULL,
        email VARCHAR(254) NOT NULL,
        updates_ok TINYINT(1) NOT NULL DEFAULT 0,
        answers JSON NOT NULL,
        unsubscribe_token CHAR(32) NOT NULL,
        unsubscribed_at DATETIME NULL,
        INDEX idx_letter_name (letter, last_name, first_name),
        UNIQUE KEY uq_email (email),
        UNIQUE KEY uq_token (unsubscribe_token)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
    return $pdo;
}

// A-Z filing letter from the last name. Accents are folded (Ávila files
// under A); anything that is not a letter files under "#".
function survey_letter(string $lastName): string {
    $s = trim($lastName);
    if (function_exists('transliterator_transliterate')) {
        $t = transliterator_transliterate('Any-Latin; Latin-ASCII', $s);
        if (is_string($t)) $s = $t;
    }
    $c = strtoupper(substr(ltrim($s, " '\"-.("), 0, 1));
    return ($c >= 'A' && $c <= 'Z') ? $c : '#';
}

// Readable question names, in survey order, for the admin page and the files.
const SURVEY_QUESTIONS = [
    'q1'       => '1. Small business owner or freelancer?',
    'q2'       => '2. Profession',
    'q2_other' => '2. Profession (described)',
    'q3'       => '3. Last work task that cost time or money',
    'q4'       => '4. How often it occurs',
    'q5'       => '5. Time cost per week',
    'q6'       => '6. Categories',
    'q6_other' => '6. Categories (other, described)',
    'q7'       => '7. Current workarounds',
    'q7_other' => '7. Workarounds (other, described)',
    'q8'       => '8. What the app should do',
    'q9'       => '9. Ever paid for a tool?',
    'q10'      => '10. Willing to pay per month',
];

// Answer choices in survey order, for the Summary tallies. q6 and q7 allow
// several answers, saved joined with ", ".
const SURVEY_CHOICES = [
    'q1'  => ['Yes', 'No'],
    'q2'  => ['Designer', 'Developer', 'Writer', 'Consultant', 'Trades or home services', 'Retail or e-commerce', 'Food or hospitality', 'Coaching or education', 'Other'],
    'q4'  => ['Daily', 'A few times a week', 'Weekly', 'Monthly', 'Rarely'],
    'q5'  => ['Less than 1 hour', '1-3 hours', '3-5 hours', '5-10 hours', '10+ hours'],
    'q6'  => ['Scheduling and bookings', 'Invoicing and getting paid', 'Tracking income and expenses', 'Finding and keeping clients', 'Managing projects or tasks', 'Communicating with clients', 'Marketing and social media', 'Other'],
    'q7'  => ['Spreadsheet', 'Paper or notebook', 'Several different apps', 'I pay someone else to do it', 'Nothing', 'Other'],
    'q9'  => ['Yes', 'No'],
    'q10' => ['Nothing', 'Under $10', '$11-$25', '$26-$50', '$50 or more'],
];
const SURVEY_MULTI = ['q6', 'q7'];
// Written answers, shown together on the Summary page.
const SURVEY_WRITTEN = ['q3', 'q8', 'q2_other', 'q6_other', 'q7_other'];

// Emails a new or updated response to the studio inbox. Never stops the
// survey from saving: a failed email is only logged.
function survey_notify(array $cfg, array $r, bool $isNew, int $total): void {
    if (array_key_exists('notify_email', $cfg) && !$cfg['notify_email']) return; // turned off
    $to = $cfg['notify_email'] ?? 'inquiry@BurnishedGraceStudio.com';
    $one = fn($v) => trim(str_replace(["\r", "\n"], ' ', (string)$v));
    $name = $one($r['first_name'] . ' ' . $r['last_name']);
    $subject = ($isNew ? 'New survey response' : 'Updated survey response') . ': ' . $name . " ($total total)";
    if ($isNew && in_array($total, [15, 25, 50, 100], true)) $subject = "Survey milestone: $total responses! Latest from " . $name;

    $lines = [
        ($isNew ? 'A new response' : 'An updated response (same email, newer answers)') . ' just came in.',
        '',
        'Name: ' . $name,
        'Email: ' . $r['email'],
        'Wants update emails: ' . ($r['updates_ok'] ? 'Yes' : 'No'),
        'Filed under: ' . ($r['letter'] === '#' ? 'Other' : $r['letter']),
        '',
    ];
    foreach (SURVEY_QUESTIONS as $k => $q) if (isset($r['answers'][$k])) $lines[] = $q . "\n   " . $r['answers'][$k] . "\n";
    $lines[] = "Total responses so far: $total";
    $lines[] = 'See all responses, filed A-Z, with a Summary of every answer:';
    $lines[] = survey_site_url() . '/api/survey-admin.php';

    $from = $cfg['notify_from'] ?? $to;
    $headers = "From: Burnished Grace Survey <$from>\r\n"
             . 'Reply-To: ' . $one($r['email']) . "\r\n"
             . "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: 8bit";
    $ok = @mail($to, mb_encode_mimeheader($subject, 'UTF-8'), implode("\n", $lines), $headers, '-f' . $from);
    if (!$ok) error_log('survey notify: mail() failed for response from ' . $r['email']);
}

function survey_site_url(): string {
    return 'https://' . ($_SERVER['HTTP_HOST'] ?? 'burnishedgracestudio.com');
}
