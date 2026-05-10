#!/usr/bin/env bash
# Seed 2026 US federal holidays + observed half-days into Locus.
# Run while the dev server is up: `bash scripts/seed-2026-holidays.sh`
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"

put() {
  local date="$1" status="$2" location="$3" note="$4"
  local body
  if [[ -n "$note" ]]; then
    body=$(printf '{"from":"%s","to":"%s","status":"%s","location":"%s","note":"%s"}' \
      "$date" "$date" "$status" "$location" "$note")
  else
    body=$(printf '{"from":"%s","to":"%s","status":"%s","location":"%s"}' \
      "$date" "$date" "$status" "$location")
  fi
  echo "→ $date  $status  $location  ${note:-(no note)}"
  curl -fsS -X PUT "$BASE_URL/api/days" \
    -H "content-type: application/json" \
    -d "$body" >/dev/null
}

# Full OOO holidays
put 2026-01-01 out_of_office CA "New Year's Day"
put 2026-01-19 out_of_office CA "Martin Luther King, Jr. Day"
put 2026-02-16 out_of_office CA "Washington's Birthday"
put 2026-04-03 out_of_office CA "Good Friday"
put 2026-05-25 out_of_office CA "Memorial Day"
put 2026-06-19 out_of_office CA "Juneteenth"
put 2026-07-03 out_of_office CA "Independence Day (observed)"
put 2026-09-07 out_of_office CA "Labor Day"
put 2026-11-26 out_of_office CA "Thanksgiving Day"
put 2026-12-25 out_of_office CA "Christmas Day"

# Half-days — count as working per request, note records the reason
put 2026-11-27 working CA "Half day — Black Friday"
put 2026-12-24 working CA "Half day — Christmas Eve"

echo "done."
