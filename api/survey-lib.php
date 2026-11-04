<?php
// Shared helpers for the survey database. The private settings file lives
// OUTSIDE the website folder (bg-private/survey-config.php), so nobody can
// open it from a browser. See README.txt, "SURVEY DATABASE".
if (count(get_included_files()) === 1) { http_response_code(404); exit; }

function survey_config(): ?array {
    $file = dirname(__DIR__, 2) . '/bg-private/survey-config.php';
    if (!is_file($file)) return null;
    $cfg = require $file;
    foreach (['db_host', 'db_name', 'db_user', 'db_pass', 'admin_password'] as $k) {
        if (empty($cfg[$k]) || str_contains((string)$cfg[$k], 'YOUR_')) return null;
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

function survey_site_url(): string {
    return 'https://' . ($_SERVER['HTTP_HOST'] ?? 'burnishedgracestudio.com');
}
