#!/usr/bin/env bash
# Deploys the Burnished Grace website from GitHub to IONOS over SFTP.
#
# Modes:
#   check-connection  Log in and list the website folder. Changes nothing.
#   preview           Download the live site, compare it with GitHub, and
#                     report what WOULD change. Changes nothing.
#   deploy            Same comparison, then upload only new or changed files.
#
# Safety rules built into this script:
#   * Upload and update only. Nothing on IONOS is ever deleted.
#   * The SFTP user must be locked to the website folder. If bg-private,
#     config.php or orders.csv are visible, the script stops.
#   * Files that must never go live are excluded (see EXCLUDES).
set -euo pipefail

MODE="${1:?usage: ionos-deploy.sh check-connection|preview|deploy}"
: "${IONOS_SFTP_HOST:?IONOS_SFTP_HOST secret is missing}"
: "${IONOS_SFTP_USER:?IONOS_SFTP_USER secret is missing}"
: "${LFTP_PASSWORD:?IONOS_SFTP_PASSWORD secret is missing}"

SITE_DIR="$(cd "${SITE_DIR:-.}" && pwd)"
WORK="${RUNNER_TEMP:-/tmp}/bg-deploy"
SUMMARY="${GITHUB_STEP_SUMMARY:-/dev/null}"
SITE_URL="${SITE_URL:-https://burnishedgracestudio.com/}"

# Never uploaded. survey/ stays out until its database and consent form exist.
EXCLUDES=(.git/ .github/ .gitignore .DS_Store README.txt survey/)

fail() { echo "::error::$1"; echo "**Stopped:** $1" >>"$SUMMARY"; exit 1; }

lftp_run() {
  lftp -c "set sftp:auto-confirm yes; set net:max-retries 2; set net:timeout 30; \
open --env-password -u '${IONOS_SFTP_USER}' 'sftp://${IONOS_SFTP_HOST}'; $1"
}

check_connection() {
  echo "Connecting to IONOS as ${IONOS_SFTP_USER}..."
  local listing
  listing="$(lftp_run 'cls -1a')" || fail "Could not log in to IONOS. Check the three IONOS_SFTP secrets."
  echo "Top level of the deploy user's folder:"
  echo "$listing"
  if grep -Eqx '(\./)?(bg-private|config\.php|orders\.csv)/?' <<<"$listing"; then
    fail "The deploy user can see private files. It must be locked to /burnishedgrace before any deploy."
  fi
  grep -Eqx '(\./)?index\.html' <<<"$listing" \
    || fail "index.html was not found. The deploy user is not pointed at the website folder."
  echo "Connection OK: locked to the website folder, private files not visible."
  { echo "### Connection check"; echo "Logged in as \`${IONOS_SFTP_USER}\`. Website folder found; private files not visible."; } >>"$SUMMARY"
}

rsync_excludes() { local e; for e in "${EXCLUDES[@]}"; do printf -- '--exclude=%s\n' "$e"; done; }

compare() {
  rm -rf "$WORK"; mkdir -p "$WORK/live" "$WORK/staging"
  echo "Downloading the live site for comparison (read-only)..."
  lftp_run "mirror --no-perms --parallel=4 . '$WORK/live'" >/dev/null \
    || fail "Could not download the live site for comparison."

  mapfile -t EX < <(rsync_excludes)
  # Files that are new or whose content differs (checksum comparison).
  rsync -rcn --out-format='%n' "${EX[@]}" "$SITE_DIR/" "$WORK/live/" \
    | grep -v '/$' | sort >"$WORK/changed.txt" || true
  # Files that exist only on IONOS. Reported, never deleted.
  rsync -rn --ignore-existing --out-format='%n' "${EX[@]}" --exclude='.htaccess' \
    "$WORK/live/" "$SITE_DIR/" | grep -v '/$' | sort >"$WORK/live-only.txt" || true

  local count new=0 upd=0 f
  count="$(wc -l <"$WORK/changed.txt" | tr -d ' ')"
  {
    echo "### What GitHub would change on the live site"
    if [ "$count" -eq 0 ]; then
      echo "Nothing. The live site already matches GitHub."
    else
      echo "| File | Change |"; echo "|---|---|"
    fi
  } >>"$SUMMARY"
  while IFS= read -r f; do
    [ -z "$f" ] && continue
    if [ -e "$WORK/live/$f" ]; then upd=$((upd+1)); echo "| \`$f\` | updated |" >>"$SUMMARY"
    else new=$((new+1)); echo "| \`$f\` | new |" >>"$SUMMARY"; fi
  done <"$WORK/changed.txt"
  echo "Comparison: $new new, $upd updated."

  if [ -s "$WORK/live-only.txt" ]; then
    { echo; echo "### Only on IONOS (left exactly as they are)"; sed 's/.*/- `&`/' "$WORK/live-only.txt"; } >>"$SUMMARY"
  fi

  echo "---- Text differences (live → GitHub) ----"
  while IFS= read -r f; do
    [ -e "$WORK/live/$f" ] || continue
    case "$f" in *.html|*.css|*.js|*.php|*.txt|*.xml|*.json|.htaccess|*/.htaccess)
      echo "== $f"; diff -u "$WORK/live/$f" "$SITE_DIR/$f" | head -n 120 || true ;;
    esac
  done <"$WORK/changed.txt"
}

deploy() {
  if [ ! -s "$WORK/changed.txt" ]; then
    echo "Nothing to upload."; return
  fi
  rsync -a --files-from="$WORK/changed.txt" "$SITE_DIR/" "$WORK/staging/"
  echo "Uploading $(wc -l <"$WORK/changed.txt" | tr -d ' ') file(s). Nothing will be deleted."
  # mirror -R without --delete only adds and updates.
  lftp_run "mirror -R --no-perms --verbose '$WORK/staging' ." || fail "Upload failed partway. Check the log; the backup on your Mac can restore any file."
  echo "### Uploaded" >>"$SUMMARY"
  sed 's/.*/- `&`/' "$WORK/changed.txt" >>"$SUMMARY"

  local code
  code="$(curl -sS -o /dev/null -w '%{http_code}' "$SITE_URL" || echo 000)"
  echo "Homepage answered with HTTP $code."
  echo "Homepage check: HTTP $code" >>"$SUMMARY"
  [ "$code" = "200" ] || fail "The homepage did not answer normally after the upload (HTTP $code)."
}

check_connection
case "$MODE" in
  check-connection) ;;
  preview) compare ;;
  deploy) compare; deploy ;;
  *) fail "Unknown mode: $MODE" ;;
esac
