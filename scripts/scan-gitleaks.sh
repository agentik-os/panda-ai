#!/usr/bin/env bash

#
# Gitleaks Secret Scanner
#
# Scans git repositories for hardcoded secrets and credentials
#
# Usage:
#   ./scan-gitleaks.sh [options] [repository-path]
#
# Options:
#   --uncommitted      Scan uncommitted changes only
#   --config FILE      Path to custom Gitleaks config file
#   --verbose          Enable verbose output
#   --baseline FILE    Path to baseline file (ignore known secrets)
#   --report FILE      Save report to file (JSON format)
#   --help             Show this help message
#
# Examples:
#   ./scan-gitleaks.sh /path/to/repo
#   ./scan-gitleaks.sh --uncommitted .
#   ./scan-gitleaks.sh --config .gitleaks.toml --report secrets.json .
#   ./scan-gitleaks.sh --baseline .gitleaks-baseline.json /path/to/skill
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
UNCOMMITTED=false
CONFIG_FILE=""
VERBOSE=false
BASELINE_FILE=""
REPORT_FILE=""
REPO_PATH="."

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
Gitleaks Secret Scanner

Scans git repositories for hardcoded secrets:
- API keys and tokens
- AWS, GCP, Azure credentials
- Passwords and private keys
- Database connection strings
- OAuth secrets

Usage:
  $0 [options] [repository-path]

Options:
  --uncommitted      Scan uncommitted changes only
  --config FILE      Path to custom Gitleaks config file
  --verbose          Enable verbose output
  --baseline FILE    Path to baseline file (ignore known secrets)
  --report FILE      Save report to file (JSON format)
  --help             Show this help message

Examples:
  $0 /path/to/repo
  $0 --uncommitted .
  $0 --config .gitleaks.toml --report secrets.json .
  $0 --baseline .gitleaks-baseline.json /path/to/skill

Baseline Files:
  Create a baseline to ignore existing secrets:
  $0 --report .gitleaks-baseline.json .
  Then use it in future scans:
  $0 --baseline .gitleaks-baseline.json .

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --uncommitted)
      UNCOMMITTED=true
      shift
      ;;
    --config)
      CONFIG_FILE="$2"
      shift 2
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --baseline)
      BASELINE_FILE="$2"
      shift 2
      ;;
    --report)
      REPORT_FILE="$2"
      shift 2
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      REPO_PATH="$1"
      shift
      ;;
  esac
done

# Check if Gitleaks is installed
if ! command -v gitleaks &> /dev/null; then
  print_error "Gitleaks is not installed."
  echo ""
  echo "Installation instructions:"
  echo "  macOS:  brew install gitleaks"
  echo "  Linux:  "
  echo "    # Binary install"
  echo "    wget https://github.com/gitleaks/gitleaks/releases/latest/download/gitleaks_\$(uname -s)_x64.tar.gz"
  echo "    tar -xzf gitleaks_\$(uname -s)_x64.tar.gz"
  echo "    sudo mv gitleaks /usr/local/bin/"
  echo ""
  echo "Or see: https://github.com/gitleaks/gitleaks"
  echo ""
  exit 1
fi

# Verify repo exists
if [ ! -d "$REPO_PATH" ]; then
  print_error "Repository path does not exist: $REPO_PATH"
  exit 1
fi

# Verify it's a git repo (unless scanning uncommitted only)
if [ "$UNCOMMITTED" = false ] && [ ! -d "$REPO_PATH/.git" ]; then
  print_error "Not a git repository: $REPO_PATH"
  echo "Tip: Use --uncommitted to scan files without git history"
  exit 1
fi

print_info "Gitleaks Secret Scanner"
echo ""
print_info "Repository: $REPO_PATH"
print_info "Mode: $([ "$UNCOMMITTED" = true ] && echo "uncommitted changes only" || echo "full repository")"
echo ""

# Build command
cmd="gitleaks detect --source $REPO_PATH"

# Add options
if [ "$UNCOMMITTED" = true ]; then
  cmd="$cmd --uncommitted"
fi

if [ -n "$CONFIG_FILE" ]; then
  if [ ! -f "$CONFIG_FILE" ]; then
    print_error "Config file not found: $CONFIG_FILE"
    exit 1
  fi
  cmd="$cmd --config $CONFIG_FILE"
  print_info "Using config: $CONFIG_FILE"
fi

if [ "$VERBOSE" = true ]; then
  cmd="$cmd --verbose"
fi

if [ -n "$BASELINE_FILE" ]; then
  if [ ! -f "$BASELINE_FILE" ]; then
    print_error "Baseline file not found: $BASELINE_FILE"
    exit 1
  fi
  cmd="$cmd --baseline-path $BASELINE_FILE"
  print_info "Using baseline: $BASELINE_FILE"
fi

# Report output
if [ -n "$REPORT_FILE" ]; then
  cmd="$cmd --report-format json --report-path $REPORT_FILE"
else
  # Output to stdout
  cmd="$cmd --report-format json --report-path /dev/stdout"
fi

# Run scan
print_info "Running scan..."
echo ""

scan_exit_code=0
scan_output=$(eval "$cmd" 2>&1) || scan_exit_code=$?

# Gitleaks returns exit code 1 if secrets found (not an error)
if [ $scan_exit_code -eq 1 ]; then
  print_critical "Secrets detected!"

  # Count secrets
  if [ -n "$REPORT_FILE" ]; then
    secret_count=$(jq 'length' "$REPORT_FILE" 2>/dev/null || echo "unknown")
  else
    secret_count=$(echo "$scan_output" | jq 'length' 2>/dev/null || echo "unknown")
  fi

  print_critical "$secret_count secret(s) found!"
  echo ""

  # Display results
  if [ -n "$REPORT_FILE" ]; then
    jq '.' "$REPORT_FILE"
    print_success "Full report saved to: $REPORT_FILE"
  else
    echo "$scan_output" | jq '.'
  fi

  echo ""
  print_warning "Fix these secrets before committing!"
  echo ""
  echo "Tips:"
  echo "  1. Remove secrets from code and use environment variables"
  echo "  2. Rotate any exposed credentials immediately"
  echo "  3. Use git history rewriting to remove from history:"
  echo "     git filter-branch --tree-filter 'rm -f FILE' HEAD"
  echo "  4. Create .gitleaks.toml to customize rules"
  echo ""

  exit 1

elif [ $scan_exit_code -eq 0 ]; then
  print_success "No secrets detected!"

  if [ -n "$REPORT_FILE" ]; then
    print_info "Empty report saved to: $REPORT_FILE"
  fi

  exit 0

else
  print_error "Scan failed with exit code $scan_exit_code"
  echo "$scan_output"
  exit $scan_exit_code
fi
