#!/bin/bash
set -e
echo "🔬 Starting Advanced LLM-Web-Pilot Feature Test..."

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
    rm -f "$SESSION_FILE" "advanced_test_screenshot.png"
}
trap cleanup EXIT

# --- 2. Run Advanced Test ---
# Test advanced commands like mobile emulation, performance metrics, etc.
COMMAND="goto file://$TEST_PAGE_PATH;
mobile setViewport 375 667;
mobile getUserAgent;
performance metrics;
performance timing;
setOffline true;
setOffline false"

echo "👉 Executing advanced command sequence..."

if ! AGENT_OUTPUT=$(node "$BROWSER_AGENT_DIR/web-pilot.js" "$COMMAND"); then
    echo "❌ Advanced Test Execution Failed."
    # Take error screenshot
    ERROR_SCREENSHOT_CMD="screenshot agent_error.png"
    node "$BROWSER_AGENT_DIR/web-pilot.js" "$ERROR_SCREENSHOT_CMD" 2>/dev/null || true
    echo "Error screenshot saved as agent_error.png"
    echo "Agent Output: $AGENT_OUTPUT"
    exit 1
fi

echo "Agent Output: $AGENT_OUTPUT"

# Basic validation - check for multiple success indicators
SUCCESS_COUNT=$(echo "$AGENT_OUTPUT" | grep -o '"status":"success"' | wc -l)
if [ $SUCCESS_COUNT -lt 5 ]; then
    echo "❌ Validation Failed - Expected at least 5 successful operations, got $SUCCESS_COUNT"
    exit 1
fi

echo "✅ Advanced Test Passed Successfully ($SUCCESS_COUNT operations verified)!"