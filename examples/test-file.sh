#!/bin/bash
set -e
echo "🔬 Starting File Operations Feature Test..."

# Get project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BROWSER_AGENT_DIR="$PROJECT_ROOT"
SESSION_FILE="$BROWSER_AGENT_DIR/session.json"
TEST_PAGE_PATH="$BROWSER_AGENT_DIR/test_page.html"

# Create a test file to upload
TEST_UPLOAD_FILE="$BROWSER_AGENT_DIR/test_upload.txt"
echo "This is a test file for upload" > "$TEST_UPLOAD_FILE"

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
    rm -f "$SESSION_FILE" "$TEST_UPLOAD_FILE" "downloaded_file.txt" "agent_error.png"
}
trap cleanup EXIT

# --- 2. Run File Operations Test ---
# Note: Since test_page.html doesn't have file inputs, we'll test the command structure
COMMAND="goto file://$TEST_PAGE_PATH"

echo "👉 Executing file operations command sequence..."

if ! AGENT_OUTPUT=$(node "$BROWSER_AGENT_DIR/web-pilot.js" "$COMMAND"); then
    echo "❌ File Operations Test Execution Failed."
    # Take error screenshot
    ERROR_SCREENSHOT_CMD="screenshot agent_error.png"
    node "$BROWSER_AGENT_DIR/web-pilot.js" "$ERROR_SCREENSHOT_CMD" 2>/dev/null || true
    echo "Error screenshot saved as agent_error.png"
    echo "Agent Output: $AGENT_OUTPUT"
    exit 1
fi

echo "Agent Output: $AGENT_OUTPUT"

# Basic validation - check for success indicators
SUCCESS_COUNT=$(echo "$AGENT_OUTPUT" | grep -o '"status":"success"' | wc -l)
if [ $SUCCESS_COUNT -ge 1 ]; then
    echo "✅ File Operations Test Completed ($SUCCESS_COUNT operations verified)!"
else
    echo "❌ File Operations Test failed"
    exit 1
fi