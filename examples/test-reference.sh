#!/bin/bash
set -e
echo "🔎 Starting LLM-Web-Pilot Reference Test..."

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

# --- 2. Run Test ---
# Test Sequence:
# 1. Clear LocalStorage
# 2. Goto page
# 3. Wait/Click Button (triggers localStorage set)
# 4. Wait for input & checkbox
# 5. Type 'hello'
# 6. Check Checkbox
# 7. VERIFY: Text result, LocalStorage value, Attribute value, Checkbox state

COMMAND="goto file://$TEST_PAGE_PATH;localStorage clear;waitElement #test-button;click #test-button;waitElement #test-input;type #test-input hello;click #test-checkbox;text #input-result;localStorage test_state;getAttribute #test-checkbox data-custom;isChecked #test-checkbox"
echo "👉 Executing: $COMMAND"

if ! AGENT_OUTPUT=$(node "$BROWSER_AGENT_DIR/web-pilot.js" "$COMMAND"); then
    echo "❌ Reference Test Execution Failed."
    # Take error screenshot
    ERROR_SCREENSHOT_CMD="screenshot agent_error.png"
    node "$BROWSER_AGENT_DIR/web-pilot.js" "$ERROR_SCREENSHOT_CMD" 2>/dev/null || true
    echo "Error screenshot saved as agent_error.png"
    echo "Agent Output: $AGENT_OUTPUT"
    exit 1
fi

echo "Agent Output: $AGENT_OUTPUT"

# Validation
# We check for multiple success indicators in the JSON output
if ! echo "$AGENT_OUTPUT" | grep -q '"status":"success"' || \
   ! echo "$AGENT_OUTPUT" | grep -q '"data":"Input Matched!"' || \
   ! echo "$AGENT_OUTPUT" | grep -q '"value":"clicked"' || \
   ! echo "$AGENT_OUTPUT" | grep -q '"value":"value-123"' || \
   ! echo "$AGENT_OUTPUT" | grep -q '"value":true'; then
    echo "❌ Validation Failed."
    echo "Expected: Input Matched!, localStorage:clicked, attr:value-123, checked:true"
    exit 1
fi

echo "✅ Reference Test Passed Successfully (All Features Verified)!"