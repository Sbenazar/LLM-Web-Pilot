#!/bin/bash
set -e
echo "🔎 Starting saveState/restoreState Test..."

# Get project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BROWSER_AGENT_DIR="$PROJECT_ROOT"
SESSION_FILE="$BROWSER_AGENT_DIR/session.json"
TEST_PAGE_PATH="$BROWSER_AGENT_DIR/test_page.html"
STATES_DIR="$BROWSER_AGENT_DIR/states"

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
    rm -f "$SESSION_FILE"
    rm -rf "$STATES_DIR"
}
trap cleanup EXIT

# --- 2. Set up state and save in one chain ---
echo "👉 Step 1: Setting up browser state and saving..."
SETUP_CMD="goto file://$TEST_PAGE_PATH; localStorage set myKey myValue; cookies set testCookie cookieVal; saveState teststate"
SETUP_OUTPUT=$(node "$BROWSER_AGENT_DIR/web-pilot.js" "$SETUP_CMD")
echo "Setup Output: $SETUP_OUTPUT"

if ! echo "$SETUP_OUTPUT" | grep -q '"action":"saveState"'; then
    echo "❌ saveState failed."
    exit 1
fi

if [ ! -f "$STATES_DIR/teststate.json" ]; then
    echo "❌ State file not created."
    exit 1
fi
echo "✅ State saved."

# --- 3. Restore state and verify in one chain ---
echo "👉 Step 2: Restoring state and verifying..."
VERIFY_CMD="restoreState teststate; localStorage myKey; cookies get testCookie"
VERIFY_OUTPUT=$(node "$BROWSER_AGENT_DIR/web-pilot.js" "$VERIFY_CMD")
echo "Verify Output: $VERIFY_OUTPUT"

if ! echo "$VERIFY_OUTPUT" | grep -q '"action":"restoreState"'; then
    echo "❌ restoreState failed."
    exit 1
fi

if ! echo "$VERIFY_OUTPUT" | grep -q '"value":"myValue"'; then
    echo "❌ localStorage not restored."
    exit 1
fi

if ! echo "$VERIFY_OUTPUT" | grep -q '"value":"cookieVal"'; then
    echo "❌ Cookie not restored."
    exit 1
fi

echo "✅ saveState/restoreState Test Passed Successfully!"
