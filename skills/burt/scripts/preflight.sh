#!/usr/bin/env bash
# Burt pre-flight — the mechanical DS-compliance net for a screen mockup. TEMPLATE:
# the harness is reusable as-is; the nets marked ADAPT carry example values that MUST
# be replaced with the adopting project's design-system §3 tokens before first use.
#
# Usage:  bash preflight.sh <path/to/mockup.html>
#
# Every hit is a CANDIDATE, not a confirmed violation — greps can't read intent.
# Confirm each by reading the cited line, then do the rule-by-rule pass. This only
# tells Burt WHERE to look. Exit code is always 0 (informational).

set -u
F="${1:-}"
if [ -z "$F" ] || [ ! -f "$F" ]; then
  echo "Burt pre-flight: file not found — usage: bash preflight.sh <mockup.html>" >&2
  exit 0
fi

hr() { printf '%s\n' "------------------------------------------------------------"; }
section() { printf '\n### %s\n' "$1"; }
# run a grep; print results or "— clean —"
net() {
  local title="$1"; shift
  section "$title"
  local out; out="$("$@" 2>/dev/null)"
  if [ -n "$out" ]; then printf '%s\n' "$out"; else printf '  — clean —\n'; fi
}

echo "Burt pre-flight · $F"
hr

# ADAPT — type ladder: list every OFF-ladder px value seen in the wild; keep the leading
# space (or \b) so 8px never matches inside 18px. Exclude the project's doc-chrome classes.
type_ladder() {
  grep -nE 'font(-size)?:[^;}]*( 8px| 10px| 12px| 13px| 14px| 16px| 17px| 18px)' "$F" \
    | grep -vE 'REPLACE-with-exempt-chrome-classes'
}
net "Type off the §3 ladder (ADAPT values + exclusions) → snap to the ladder" type_ladder

# ADAPT — restricted tokens: one net per token whose USE is rule-bound (not just its value).
# Print every appearance; each is confirmed against the token's rule during the read.
restricted_token() { grep -nE '\-\-REPLACE-restricted-token\b|#REPLACEHEX' "$F"; }
net "Restricted token — confirm every use against its §2 rule (ADAPT)" restricted_token

# ADAPT — never-list patterns: derive greps from §1's Never bullets (shadows, radius,
# gradients, press-travel — whatever the profile forbids). Exclude the blessed exceptions.
never_list() {
  grep -nE 'REPLACE-never-list-pattern' "$F" \
    | grep -vE 'REPLACE-blessed-exception-classes'
}
net "Never-list patterns (ADAPT from §1) — blessed exceptions excluded" never_list

# ADAPT — fixed component sizes: if the catalog enumerates sizes, flag any instance whose
# real dimension isn't on the list (ratio-right ≠ size-right).
fixed_sizes() {
  grep -nE '\.REPLACE-component[^{]*\{[^}]*width:\s*[0-9]+px' "$F" \
    | grep -vE 'width:\s*(REPLACE|ALLOWED|WIDTHS)px'
}
net "Fixed component size off the catalog list (ADAPT allowed widths)" fixed_sizes

# Foreign font voice — generic as-is; add the project's blessed faces to the exclusion.
foreign_font() { grep -niE "font[^;]*(arial|helvetica|times|courier|system-ui|-apple-system|monospace|\bserif\b|sans-serif)" "$F"; }
net "Foreign font voice (fallbacks inside the token defs themselves are usually OK)" foreign_font

# Font-load pattern — absence is the finding, if the project prescribes one.
font_load() { grep -nE 'media="print"|<noscript' "$F" | head -3; }
net "Font-load pattern present? (expect the project's prescribed load + fallback)" font_load

# Raster artifacts + external deps — generic as-is; extend the blessed-host exclusion if needed.
raster() { grep -nE '\.png|\.jpe?g|\.webp|<img ' "$F"; }
net "Raster artifacts / <img> (self-contained mockups; inline SVG only)" raster
extdep() { grep -nE '<script src=|<link [^>]*href=' "$F" | grep -vE 'fonts\.googleapis|fonts\.gstatic'; }
net "External non-font deps (mockups must be self-contained)" extdep

hr
echo "Pre-flight done. Candidates only — confirm each by reading the line, then run the rule-by-rule pass (SKILL.md)."
