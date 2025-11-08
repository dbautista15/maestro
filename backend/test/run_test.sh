#!/bin/bash

"""
Test runner script for Maestro.
Run tests locally or in CI/CD pipeline.
"""

set -e

echo "🧪 Maestro Test Suite"
echo "===================="
echo ""

# Configuration
VERBOSE=${VERBOSE:-false}
COVERAGE=${COVERAGE:-true}
PARALLEL=${PARALLEL:-false}
TEST_DIR="."

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${YELLOW}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    print_error "pytest not found. Install with: pip install -r requirements-test.txt"
    exit 1
fi

# Build pytest command
PYTEST_CMD="pytest"

# Add verbosity
if [ "$VERBOSE" = true ]; then
    PYTEST_CMD="$PYTEST_CMD -v"
fi

# Add coverage
if [ "$COVERAGE" = true ]; then
    PYTEST_CMD="$PYTEST_CMD --cov=core --cov=adapters --cov-report=html --cov-report=term"
fi

# Add parallel execution
if [ "$PARALLEL" = true ]; then
    PYTEST_CMD="$PYTEST_CMD -n auto"
fi

# Add test discovery pattern
PYTEST_CMD="$PYTEST_CMD test_*.py"

print_header "Running tests..."
echo "Command: $PYTEST_CMD"
echo ""

# Run tests
if eval $PYTEST_CMD; then
    print_success "All tests passed!"
    echo ""
    
    if [ "$COVERAGE" = true ]; then
        print_header "Coverage report generated:"
        echo "  Open htmlcov/index.html to view detailed coverage"
    fi
    exit 0
else
    print_error "Tests failed!"
    exit 1
fi