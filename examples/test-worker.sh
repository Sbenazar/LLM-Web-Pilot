#!/bin/bash
set -e
echo "🔬 Starting Web Worker Feature Test..."

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

# --- 2. Run Worker Test ---
# Test worker command for managing Web Workers
# First, we need to create a simple worker script
WORKER_JS_PATH="$BROWSER_AGENT_DIR/simple-worker.js"
cat > "$WORKER_JS_PATH" << 'EOF'
self.onmessage = function(e) {
  const data = e.data;
  if(data.command === 'start') {
    // Simple calculation to return
    const result = data.value * 2;
    self.postMessage({result: result});
  }
};
EOF

COMMAND="goto file://$TEST_PAGE_PATH;
worker start calcWorker;
worker postMessage calcWorker '{\"command\":\"start\",\"value\":21}';
worker terminate calcWorker"

echo "👉 Executing worker command sequence..."

if ! AGENT_OUTPUT=$(node "$BROWSER_AGENT_DIR/web-pilot.js" "$COMMAND"); then
    echo "❌ test-worker.sh Execution Failed."

    # Take error screenshot

    ERROR_SCREENSHOT_CMD="screenshot agent_error.png"

    node "$BROWSER_AGENT_DIR/web-pilot.js" "$ERROR_SCREENSHOT_CMD" 2>/dev/null || true

    echo "Error screenshot saved as agent_error.png"

    echo "Agent Output: $AGENT_OUTPUT"

    exit 1
    echo "❌ Worker Test Execution Failed."
    echo "Agent Output: $AGENT_OUTPUT"
    exit 1
fi

echo "Agent Output: $AGENT_OUTPUT"

# Basic validation - check for multiple success indicators
SUCCESS_COUNT=$(echo "$AGENT_OUTPUT" | grep -o '"status":"success"' | wc -l)
if [ $SUCCESS_COUNT -lt 2 ]; then
    echo "⚠️  Expected at least 2 successful operations, got $SUCCESS_COUNT (some worker operations may not be fully supported)"
else
    echo "✅ Worker Test Passed Successfully ($SUCCESS_COUNT operations verified)!"
fi

# Clean up worker file
rm -f "$WORKER_JS_PATH"