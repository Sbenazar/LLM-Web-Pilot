#!/bin/bash
set -e
echo "🔎 Starting Batch Runner Test..."

# Get project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BROWSER_AGENT_DIR="$PROJECT_ROOT"
SESSION_FILE="$BROWSER_AGENT_DIR/session.json"
TEST_PAGE_PATH="$BROWSER_AGENT_DIR/test_page.html"
BATCH_EXAMPLE="$SCRIPT_DIR/batch-example.json"

# --- 1. Start LLM-Web-Pilot (Background) ---
echo "🚀 Launching LLM-Web-Pilot Server (Headless)..."
export HEADLESS=true
node "$BROWSER_AGENT_DIR/init_browser.js" >/dev/null 2>&1 &
AGENT_PID=$!

# Wait for session.json to appear
MAX_RETRIES=15
RETRY_COUNT=0
while [ ! -f "$SESSION_FILE" ]; do
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "❌ Failed to start LLM-Web-Pilot."
        kill $AGENT_PID || true
        exit 1
    fi
    sleep 1
    RETRY_COUNT=$((RETRY_COUNT+1))
done
echo "✅ LLM-Web-Pilot started (PID: $AGENT_PID)"

# --- Cleanup Trap ---
cleanup() {
    echo "🧹 Cleaning up processes..."
    node "$BROWSER_AGENT_DIR/web-pilot.js" "close" || true
    if ps -p $AGENT_PID > /dev/null 2>&1; then kill $AGENT_PID; fi
    rm -f "$SESSION_FILE" "$TMPFILE"
}
trap cleanup EXIT

# --- 2. Prepare test file with correct path ---
TMPDIR="$BROWSER_AGENT_DIR/tmp"
mkdir -p "$TMPDIR"
TMPFILE="$TMPDIR/batch-test-tmp.json"
sed "s|__TEST_PAGE__|$TEST_PAGE_PATH|g" "$BATCH_EXAMPLE" > "$TMPFILE"

# --- 3. Run batch runner ---
echo "👉 Running batch tests..."
BATCH_OUTPUT=$(node "$BROWSER_AGENT_DIR/batch-runner.js" "$TMPFILE") || true
echo "Batch Output: $BATCH_OUTPUT"

# --- 4. Validate results ---
if ! echo "$BATCH_OUTPUT" | grep -q '"total":3'; then
    echo "❌ Expected total: 3"
    exit 1
fi

if ! echo "$BATCH_OUTPUT" | grep -q '"passed":3'; then
    echo "❌ Expected passed: 3"
    exit 1
fi

if ! echo "$BATCH_OUTPUT" | grep -q '"failed":0'; then
    echo "❌ Expected failed: 0"
    exit 1
fi

echo "✅ Batch Runner Test Passed Successfully!"
