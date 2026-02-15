#!/usr/bin/env bash

#
# TruffleHog Secret Scanner
#
# Scans git repositories and filesystems for exposed secrets
#
# Usage:
#   ./scan-secrets.sh [options] [directory]
#
# Options:
#   --git              Scan git repository (default if .git exists)
#   --filesystem       Scan filesystem only (no git history)
#   --max-depth N      Maximum git depth to scan (default: 100)
#   --verify           Verify found secrets against live services
#   --no-entropy       Disable entropy detection
#   --format FORMAT    Output format (json, text) (default: text)
#   --output FILE      Save results to file
#   --help             Show this help message
#
# Examples:
#   ./scan-secrets.sh /path/to/repo
#   ./scan-secrets.sh --verify --max-depth 50 .
#   ./scan-secrets.sh --filesystem --format json --output secrets.json .
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
MAX_DEPTH=100
VERIFY=false
ENTROPY=true
FORMAT="text"
OUTPUT=""
SCAN_MODE="auto"
TARGET_DIR="."

# Function to print colored output
print_info() {
  echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
  echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

print_critical() {
  echo -e "${RED}[CRITICAL]${NC} $1"
}

# Function to show help
show_help() {
  cat << EOF
TruffleHog Secret Scanner

Scans git repositories and filesystems for exposed secrets:
- API keys (AWS, GitHub, Stripe, etc.)
- Passwords and tokens
- Private keys and certificates
- Database credentials

Usage:
  $0 [options] [directory]

Options:
  --git              Scan git repository (default if .git exists)
  --filesystem       Scan filesystem only (no git history)
  --max-depth N      Maximum git depth to scan (default: 100)
  --verify           Verify found secrets against live services
  --no-entropy       Disable entropy detection
  --format FORMAT    Output format: json, text (default: text)
  --output FILE      Save results to file
  --help             Show this help message

Examples:
  $0 /path/to/repo
  $0 --verify --max-depth 50 .
  $0 --filesystem --format json --output secrets.json .
  $0 --git --verify /path/to/skill-package

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --git)
      SCAN_MODE="git"
      shift
      ;;
    --filesystem)
      SCAN_MODE="filesystem"
      shift
      ;;
    --max-depth)
      MAX_DEPTH="$2"
      shift 2
      ;;
    --verify)
      VERIFY=true
      shift
      ;;
    --no-entropy)
      ENTROPY=false
      shift
      ;;
    --format)
      FORMAT="$2"
      shift 2
      ;;
    --output)
      OUTPUT="$2"
      shift 2
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      TARGET_DIR="$1"
      shift
      ;;
  esac
done

# Check if TruffleHog is installed
if ! command -v trufflehog &> /dev/null; then
  print_error "TruffleHog is not installed."
  echo ""
  echo "Installation instructions:"
  echo "  macOS:  brew install trufflehog"
  echo "  Linux:  curl -sSfL https://raw.githubusercontent.com/trufflesecurity/trufflehog/main/scripts/install.sh | sh -s -- -b /usr/local/bin"
  echo ""
  echo "Or see: https://github.com/trufflesecurity/trufflehog"
  echo ""
  exit 1
fi

# Auto-detect scan mode
if [ "$SCAN_MODE" = "auto" ]; then
  if [ -d "$TARGET_DIR/.git" ]; then
    SCAN_MODE="git"
    print_info "Detected git repository, using git scan mode"
  else
    SCAN_MODE="filesystem"
    print_info "No git repository detected, using filesystem scan mode"
  fi
fi

# Verify target exists
if [ ! -d "$TARGET_DIR" ]; then
  print_error "Target directory does not exist: $TARGET_DIR"
  exit 1
fi

print_info "TruffleHog Secret Scanner"
echo ""
print_info "Target: $TARGET_DIR"
print_info "Mode: $SCAN_MODE"
print_info "Max depth: $MAX_DEPTH"
print_info "Verify secrets: $VERIFY"
print_info "Entropy detection: $ENTROPY"
echo ""

# Build command
if [ "$SCAN_MODE" = "git" ]; then
  cmd="trufflehog git file://$TARGET_DIR"
else
  cmd="trufflehog filesystem --directory $TARGET_DIR"
fi

# Add options
cmd="$cmd --max-depth $MAX_DEPTH"

if [ "$VERIFY" = true ]; then
  cmd="$cmd --verify"
fi

if [ "$ENTROPY" = false ]; then
  cmd="$cmd --no-entropy"
fi

if [ "$FORMAT" = "json" ]; then
  cmd="$cmd --json"
fi

if [ -n "$OUTPUT" ]; then
  cmd="$cmd > $OUTPUT"
fi

# Run scan
print_info "Running scan..."
echo ""

scan_output=$(mktemp)
scan_exit_code=0

eval "$cmd" > "$scan_output" 2>&1 || scan_exit_code=$?

# TruffleHog returns exit code 183 if secrets found (not an error)
if [ $scan_exit_code -eq 183 ]; then
  print_warning "Secrets detected!"
  scan_exit_code=0
elif [ $scan_exit_code -ne 0 ]; then
  print_error "Scan failed with exit code $scan_exit_code"
  cat "$scan_output"
  rm -f "$scan_output"
  exit $scan_exit_code
fi

# Parse and display results
if [ "$FORMAT" = "json" ]; then
  # Count secrets
  secret_count=$(grep -c "DetectorName" "$scan_output" || echo "0")

  if [ "$secret_count" -eq 0 ]; then
    print_success "No secrets detected!"
  else
    print_critical "$secret_count secret(s) found!"
    echo ""

    # Show secrets
    cat "$scan_output"
  fi
else
  # Text format
  if [ ! -s "$scan_output" ]; then
    print_success "No secrets detected!"
  else
    print_critical "Secrets found!"
    echo ""
    cat "$scan_output"
  fi
fi

# Save to file if requested
if [ -n "$OUTPUT" ]; then
  if [ "$FORMAT" != "json" ]; then
    cp "$scan_output" "$OUTPUT"
  fi
  print_success "Results saved to: $OUTPUT"
fi

rm -f "$scan_output"

# Exit with appropriate code
if grep -q "DetectorName" "$OUTPUT" 2>/dev/null || grep -q "DetectorName" "$scan_output" 2>/dev/null; then
  exit 1
fi

exit 0
