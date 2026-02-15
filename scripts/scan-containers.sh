#!/usr/bin/env bash

#
# Trivy Container Security Scanner
#
# Scans Docker containers and images for vulnerabilities, misconfigurations, and secrets
#
# Usage:
#   ./scan-containers.sh [options] [image-name]
#
# Options:
#   --all              Scan all local images
#   --running          Scan all running containers
#   --severity LEVEL   Severity filter (CRITICAL,HIGH,MEDIUM,LOW,UNKNOWN)
#   --format FORMAT    Output format (json, table, sarif)
#   --output FILE      Save results to file
#   --update           Update vulnerability database before scanning
#   --help             Show this help message
#
# Examples:
#   ./scan-containers.sh nginx:latest
#   ./scan-containers.sh --all --severity CRITICAL,HIGH
#   ./scan-containers.sh --running --format json --output scan-results.json
#

set -euo pipefail

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
SEVERITY="CRITICAL,HIGH"
FORMAT="table"
OUTPUT=""
UPDATE_DB=false
SCAN_ALL=false
SCAN_RUNNING=false
TARGET_IMAGE=""

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

# Function to show help
show_help() {
  cat << EOF
Trivy Container Security Scanner

Scans Docker containers and images for vulnerabilities, misconfigurations, and secrets

Usage:
  $0 [options] [image-name]

Options:
  --all              Scan all local images
  --running          Scan all running containers
  --severity LEVEL   Severity filter (default: CRITICAL,HIGH)
  --format FORMAT    Output format: json, table, sarif (default: table)
  --output FILE      Save results to file
  --update           Update vulnerability database before scanning
  --help             Show this help message

Examples:
  $0 nginx:latest
  $0 --all --severity CRITICAL,HIGH
  $0 --running --format json --output scan-results.json
  $0 --update agentik-os/runtime:latest

EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --all)
      SCAN_ALL=true
      shift
      ;;
    --running)
      SCAN_RUNNING=true
      shift
      ;;
    --severity)
      SEVERITY="$2"
      shift 2
      ;;
    --format)
      FORMAT="$2"
      shift 2
      ;;
    --output)
      OUTPUT="$2"
      shift 2
      ;;
    --update)
      UPDATE_DB=true
      shift
      ;;
    --help)
      show_help
      exit 0
      ;;
    *)
      TARGET_IMAGE="$1"
      shift
      ;;
  esac
done

# Check if Trivy is installed
if ! command -v trivy &> /dev/null; then
  print_error "Trivy is not installed."
  echo ""
  echo "Installation instructions:"
  echo "  macOS:  brew install trivy"
  echo "  Linux:  wget -qO - https://aquasecurity.github.io/trivy-repo/deb/public.key | sudo apt-key add -"
  echo "          echo 'deb https://aquasecurity.github.io/trivy-repo/deb bionic main' | sudo tee -a /etc/apt/sources.list.d/trivy.list"
  echo "          sudo apt update && sudo apt install trivy"
  echo ""
  exit 1
fi

# Update database if requested
if [ "$UPDATE_DB" = true ]; then
  print_info "Updating Trivy vulnerability database..."
  trivy image --download-db-only || {
    print_warning "Failed to update database, continuing with existing DB"
  }
fi

# Function to scan a single image
scan_image() {
  local image=$1
  local output_args=""

  print_info "Scanning image: $image"

  if [ -n "$OUTPUT" ]; then
    output_args="--output $OUTPUT"
  fi

  # Build Trivy command
  local cmd="trivy image"
  cmd="$cmd --severity $SEVERITY"
  cmd="$cmd --format $FORMAT"
  cmd="$cmd --scanners vuln,config,secret"

  if [ -n "$output_args" ]; then
    cmd="$cmd $output_args"
  fi

  cmd="$cmd $image"

  # Run scan
  if eval "$cmd"; then
    print_success "Scan completed for $image"
    return 0
  else
    # Trivy returns exit code 1 if vulnerabilities are found
    if [ $? -eq 1 ]; then
      print_warning "Vulnerabilities found in $image"
      return 0
    else
      print_error "Scan failed for $image"
      return 1
    fi
  fi
}

# Function to scan all local images
scan_all_images() {
  print_info "Scanning all local Docker images..."

  if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
  fi

  # Get list of all images
  local images
  images=$(docker images --format "{{.Repository}}:{{.Tag}}" | grep -v "<none>")

  if [ -z "$images" ]; then
    print_warning "No Docker images found"
    exit 0
  fi

  local count=0
  local total
  total=$(echo "$images" | wc -l)

  print_info "Found $total images to scan"
  echo ""

  while IFS= read -r image; do
    ((count++))
    echo "========================================="
    echo "Scanning [$count/$total]: $image"
    echo "========================================="
    scan_image "$image"
    echo ""
  done <<< "$images"

  print_success "Scanned all $total images"
}

# Function to scan running containers
scan_running_containers() {
  print_info "Scanning all running containers..."

  if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed"
    exit 1
  fi

  # Get list of running containers
  local containers
  containers=$(docker ps --format "{{.Image}}")

  if [ -z "$containers" ]; then
    print_warning "No running containers found"
    exit 0
  fi

  local count=0
  local total
  total=$(echo "$containers" | wc -l)

  print_info "Found $total running containers to scan"
  echo ""

  while IFS= read -r image; do
    ((count++))
    echo "========================================="
    echo "Scanning container [$count/$total]: $image"
    echo "========================================="
    scan_image "$image"
    echo ""
  done <<< "$containers"

  print_success "Scanned all $total running containers"
}

# Main execution
main() {
  print_info "Trivy Container Security Scanner"
  echo ""

  if [ "$SCAN_ALL" = true ]; then
    scan_all_images
  elif [ "$SCAN_RUNNING" = true ]; then
    scan_running_containers
  elif [ -n "$TARGET_IMAGE" ]; then
    scan_image "$TARGET_IMAGE"
  else
    print_error "No image specified"
    echo ""
    echo "Usage: $0 [options] [image-name]"
    echo "Run '$0 --help' for more information"
    exit 1
  fi
}

main
