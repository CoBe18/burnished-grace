<?php
// Receives one survey response (JSON) from survey/survey.html and saves it
// to the survey database. Answers with {"ok":true} or {"ok":false,"error":...}.
require __DIR__ . '/survey-lib.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

function reply(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') reply(405, ['ok' => false, 'error' => 'POST only']);

$cfg = survey_config();
if (!$cfg) reply(503, ['ok' => false, 'error' => 'The survey is not set up yet.']);

$raw = file_get_contents('php://input', false, null, 0, 65536);
$in = json_decode((string)$raw, true);
if (!is_array($in)) reply(400, ['ok' => false, 'error' => 'Bad request']);

// Hidden "website" box: people never see it, so only spam robots fill it in.
// Pretend success so the robot moves on.
if (!empty($in['website'])) reply(200, ['ok' => true]);

$clean = function ($v, int $max): string {
    $v = is_array($v) ? implode(', ', array_map('strval', $v)) : (string)$v;
    $v = trim(preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $v) ?? '');
    return mb_substr($v, 0, $max);
};

$first = $clean($in['first_name'] ?? '', 80);
$last  = $clean($in['last_name'] ?? '', 80);
$email = $clean($in['email'] ?? '', 254);
if ($first === '' || $last === '') reply(422, ['ok' => false, 'error' => 'Please enter your first and last name.']);
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) reply(422, ['ok' => false, 'error' => 'Please enter a valid email address.']);
if (($in['q1'] ?? '') !== 'Yes') reply(422, ['ok' => false, 'error' => 'Please answer the first question.']);

$answers = [];
foreach (SURVEY_QUESTIONS as $key => $label) {
    $v = $clean($in[$key] ?? '', 1000);
    if ($v !== '') $answers[$key] = $v;
}

try {
    $db = survey_db($cfg);
    // One row per email address. Taking the survey again with the same email
    // replaces the earlier name and answers instead of adding a duplicate.
    // Ticking "email me updates" again also undoes an earlier unsubscribe.
    $wants = !empty($in['updates_ok']) ? 1 : 0;
    $st = $db->prepare('INSERT INTO survey_responses
        (created_at, updated_at, letter, last_name, first_name, email, updates_ok, answers, unsubscribe_token)
        VALUES (UTC_TIMESTAMP(), UTC_TIMESTAMP(), ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            updated_at = UTC_TIMESTAMP(),
            times_submitted = times_submitted + 1,
            letter = VALUES(letter), last_name = VALUES(last_name), first_name = VALUES(first_name),
            answers = VALUES(answers),
            updates_ok = VALUES(updates_ok),
            unsubscribed_at = IF(VALUES(updates_ok) = 1, NULL, unsubscribed_at)');
    $st->execute([
        survey_letter($last), $last, $first, strtolower($email), $wants,
        json_encode($answers, JSON_UNESCAPED_UNICODE),
        bin2hex(random_bytes(16)),
    ]);
} catch (Throwable $e) {
    error_log('survey save failed: ' . $e->getMessage());
    reply(500, ['ok' => false, 'error' => 'Your answers could not be saved. Please try again in a moment.']);
}

reply(200, ['ok' => true]);
