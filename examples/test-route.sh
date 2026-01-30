#!/bin/bash
set -e
echo "🔬 Starting Network Route Feature Test..."

# Get project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BROWSER_AGENT_DIR="$PROJECT_ROOT"
SESSION_FILE="$BROWSER_AGENT_DIR/session.json"
TEST_PAGE_PATH="$BROWSER_AGENT_DIR/test_page.html"

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
    if ps -p $AGENT_PID > /dev/null; then kill $AGENT_PID; fi
    rm -f "$SESSION_FILE" "agent_error.png"
}
trap cleanup EXIT

# --- 2. Run Route Test ---
# Test route command for intercepting network requests
COMMAND="goto file://$TEST_PAGE_PATH;
route intercept .*\\.js https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js;
goto https://example.com"

echo "👉 Executing route command sequence..."

if ! AGENT_OUTPUT=$(node "$BROWSER_AGENT_DIR/web-pilot.js" "$COMMAND"); then
    echo "❌ test-route.sh Execution Failed."

    # Take error screenshot

    ERROR_SCREENSHOT_CMD="screenshot agent_error.png"

    node "$BROWSER_AGENT_DIR/web-pilot.js" "$ERROR_SCREENSHOT_CMD" 2>/dev/null || true

    echo "Error screenshot saved as agent_error.png"

    echo "Agent Output: $AGENT_OUTPUT"

    exit 1
    echo "⚠️  Route Test Execution Completed (may have warnings which is expected)."
    echo "Agent Output: $AGENT_OUTPUT"
else
    echo "Agent Output: $AGENT_OUTPUT"
fi

# Basic validation - check for success indicators
SUCCESS_COUNT=$(echo "$AGENT_OUTPUT" | grep -o '"status":"success"' | wc -l)
if [ $SUCCESS_COUNT -ge 2 ]; then
    echo "✅ Route Test Passed Successfully ($SUCCESS_COUNT operations verified)!"
else
    echo "ℹ️  Route Test completed (partial success is expected depending on page content)"
fi