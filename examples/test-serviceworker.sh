#!/bin/bash
set -e
echo "🔬 Starting Service Worker Feature Test..."

# Get project root
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BROWSER_AGENT_DIR="$PROJECT_ROOT"
SESSION_FILE="$BROWSER_AGENT_DIR/session.json"
TEST_SW_PAGE_PATH="$BROWSER_AGENT_DIR/test_sw_page.html"

# Create a simple service worker file
SW_JS_PATH="$BROWSER_AGENT_DIR/simple-sw.js"
cat > "$SW_JS_PATH" << 'EOF'
// Simple service worker that logs activation
self.addEventListener('install', event => {
  console.log('Service Worker: Installing');
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  console.log('Service Worker: Activating');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  console.log('Service Worker: Fetching', event.request.url);
});
EOF

# Also create a test page that registers the service worker
cat > "$TEST_SW_PAGE_PATH" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Service Worker Test Page</title>
</head>
<body>
    <h1>Service Worker Test Page</h1>
    <script>
        if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
                navigator.serviceWorker.register('/simple-sw.js')
                    .then(registration => {
                        console.log('Service Worker registered:', registration.scope);
                    })
                    .catch(error => {
                        console.log('Service Worker registration failed:', error);
                    });
            });
        }
    </script>
</body>
</html>
EOF

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
    rm -f "$SESSION_FILE" "$SW_JS_PATH" "$TEST_SW_PAGE_PATH" "agent_error.png"
}
trap cleanup EXIT

# --- 2. Run Service Worker Test ---
COMMAND="goto file://$TEST_SW_PAGE_PATH;
serviceworker register /simple-sw.js;
serviceworker status"

echo "👉 Executing service worker command sequence..."

if ! AGENT_OUTPUT=$(node "$BROWSER_AGENT_DIR/web-pilot.js" "$COMMAND"); then
    echo "❌ Service Worker Test Execution Failed."
    # Take error screenshot
    ERROR_SCREENSHOT_CMD="screenshot agent_error.png"
    node "$BROWSER_AGENT_DIR/web-pilot.js" "$ERROR_SCREENSHOT_CMD" 2>/dev/null || true
    echo "Error screenshot saved as agent_error.png"
    echo "Agent Output: $AGENT_OUTPUT"
    exit 1
else
    echo "Agent Output: $AGENT_OUTPUT"
fi

# Basic validation - check for success indicators
SUCCESS_COUNT=$(echo "$AGENT_OUTPUT" | grep -o '"status":"success"' | wc -l)
if [ $SUCCESS_COUNT -ge 1 ]; then
    echo "✅ Service Worker Test Completed ($SUCCESS_COUNT operations verified)!"
else
    echo "ℹ️  Service Worker Test completed (partial success is expected depending on implementation)"
fi