#!/bin/bash
# Comprehensive API test for astro-shine
BASE="http://localhost:3067/api/v1"
MD_FILE="/home/teja/Desktop/projects/astro-shine/api-test-results.md"
GREEN='\033[0;32m'; RED='\033[0;31m'; NC='\033[0m'
PASS=0; FAIL=0; TOTAL=0

cat > "$MD_FILE" << 'MDHEAD'
# Astro-Shine API Test Results

Generated: $(date)

## Summary

| Category | Pass | Fail | Total |
|----------|------|------|-------|
MDHEAD

echo "============================================"
echo "  Astro-Shine API Test Suite"
echo "============================================"

# ============================================================
# STEP 1: Register & Login
# ============================================================
echo "--- Step 1: Auth Setup ---"

USER_REG=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"testuser@example.com","phone":"9999999901","password":"Test@123","role":"user"}')
USER_ID=$(echo "$USER_REG" | jq -r '.user.id')
USER_TOKEN=$(echo "$USER_REG" | jq -r '.token')
echo "  User: $USER_ID"

ASTRO_REG=$(curl -s -X POST "$BASE/auth/register-astrologer" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Astrologer","email":"testastro@example.com","phone":"9999999902","password":"Test@123","specialization":["Vedic","Tarot"],"experience":10}')
ASTRO_ID=$(echo "$ASTRO_REG" | jq -r '.astrologer.id // .astrologer.userId')
ASTRO_TOKEN=$(echo "$ASTRO_REG" | jq -r '.token')
echo "  Astrologer: $ASTRO_ID"

ADMIN_REG=$(curl -s -X POST "$BASE/auth/register-admin" \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@example.com","phone":"9999999903","password":"Test@123"}')
ADMIN_ID=$(echo "$ADMIN_REG" | jq -r '.admin.id')
ADMIN_TOKEN=$(echo "$ADMIN_REG" | jq -r '.token')
echo "  Admin: $ADMIN_ID"

# If any registration failed, try login
if [ -z "$USER_TOKEN" ] || [ "$USER_TOKEN" = "null" ]; then
  USER_LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"testuser@example.com","password":"Test@123"}')
  USER_TOKEN=$(echo "$USER_LOGIN" | jq -r '.token')
  USER_ID=$(echo "$USER_LOGIN" | jq -r '.user.id')
fi
if [ -z "$ASTRO_TOKEN" ] || [ "$ASTRO_TOKEN" = "null" ]; then
  ASTRO_LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"testastro@example.com","password":"Test@123"}')
  ASTRO_TOKEN=$(echo "$ASTRO_LOGIN" | jq -r '.token')
  ASTRO_ID=$(echo "$ASTRO_LOGIN" | jq -r '.user.id')
fi
if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
  ADMIN_LOGIN=$(curl -s -X POST "$BASE/auth/login" -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"Admin@123"}')
  ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | jq -r '.token')
  ADMIN_ID=$(echo "$ADMIN_LOGIN" | jq -r '.user.id')
fi

echo "  Tokens obtained: user=$([ -n "$USER_TOKEN" ] && echo yes || echo no), astro=$([ -n "$ASTRO_TOKEN" ] && echo yes || echo no), admin=$([ -n "$ADMIN_TOKEN" ] && echo yes || echo no)"
echo ""

# ============================================================
# Helper
# ============================================================
test_endpoint() {
    local method=$1 path=$2 token=$3 body=$4 desc=$5
    TOTAL=$((TOTAL+1))
    local url="${BASE}${path}"
    local curl_cmd="curl -s -w '\n%{http_code}' -X $method '$url' -H 'Content-Type: application/json'"
    [ -n "$token" ] && curl_cmd="$curl_cmd -H 'Authorization: Bearer $token'"
    [ -n "$body" ] && curl_cmd="$curl_cmd -d '$body'"
    local result=$(eval "$curl_cmd" 2>/dev/null)
    local http_code=$(echo "$result" | tail -1)
    local response=$(echo "$result" | sed '$d')
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ] || [ "$http_code" = "204" ]; then
        PASS=$((PASS+1)); echo -e "  ${GREEN}✓${NC} $method $path"
    else
        FAIL=$((FAIL+1)); echo -e "  ${RED}✗${NC} $method $path ($http_code)"
    fi
    cat >> "$MD_FILE" << MDEOF

### $method \`$path\`
**Description:** $desc  
**Auth:** ${token:+Yes}${token:-No}  
**Request:**
\`\`\`json
${body:-<no body>}
\`\`\`
**Response ($http_code):**
\`\`\`json
$(echo "$response" | jq . 2>/dev/null || echo "$response")
\`\`\`
**Status:** $([ "$http_code" = "200" ] || [ "$http_code" = "201" ] || [ "$http_code" = "204" ] && echo "PASS" || echo "FAIL")

MDEOF
}

# ============================================================
# STEP 2: Test all endpoints
# ============================================================
echo "--- Testing All Endpoints ---"

# ---- AUTH ----
echo "  [Auth]"
test_endpoint "POST" "/auth/send-email-otp" "" '{"email":"testuser@example.com"}' "Send email OTP"
test_endpoint "POST" "/auth/check-phone" "" '{"phone":"9999999901"}' "Check phone"
test_endpoint "POST" "/auth/send-phone-otp" "" '{"phone":"9999999901"}' "Send phone OTP"
test_endpoint "POST" "/auth/logout" "$USER_TOKEN" '{}' "Logout"

# ---- USERS ----
echo "  [Users]"
test_endpoint "GET" "/users/profile" "$USER_TOKEN" "" "Get profile"
test_endpoint "PUT" "/users/profile" "$USER_TOKEN" '{"name":"Updated User"}' "Update profile"
test_endpoint "POST" "/users/change-password" "$USER_TOKEN" '{"currentPassword":"Test@123","newPassword":"Test@1234"}' "Change pw"
test_endpoint "POST" "/users/change-password" "$USER_TOKEN" '{"currentPassword":"Test@1234","newPassword":"Test@123"}' "Revert pw"
test_endpoint "GET" "/users" "$ADMIN_TOKEN" "" "List users (admin)"
test_endpoint "GET" "/users/$USER_ID" "$USER_TOKEN" "" "Get user by ID"
test_endpoint "PUT" "/users/$USER_ID" "$ADMIN_TOKEN" '{"name":"Admin Updated"}' "Admin update user"

# ---- ASTROLOGERS ----
echo "  [Astrologers]"
test_endpoint "GET" "/astrologers" "$USER_TOKEN" "" "List astrologers"
test_endpoint "GET" "/astrologers/$ASTRO_ID" "$USER_TOKEN" "" "Get astrologer"
test_endpoint "PUT" "/astrologers/$ASTRO_ID" "$ASTRO_TOKEN" '{"bio":"Updated bio"}' "Update astrologer"
test_endpoint "PUT" "/astrologers/$ASTRO_ID/online-status" "$ASTRO_TOKEN" '{"isOnline":true}' "Online status"
test_endpoint "POST" "/astrologers/$ASTRO_ID/verify" "$ADMIN_TOKEN" '{"verified":true}' "Verify (admin)"
test_endpoint "POST" "/astrologers/$ASTRO_ID/feedback" "$USER_TOKEN" '{"ratings":5,"comment":"Great!"}' "Submit feedback"
test_endpoint "GET" "/astrologers/$ASTRO_ID/feedback" "$USER_TOKEN" "" "Get feedback"

# ---- ADMINS ----
echo "  [Admins]"
test_endpoint "GET" "/admins" "$ADMIN_TOKEN" "" "List admins"
test_endpoint "GET" "/admins/dashboard-stats" "$ADMIN_TOKEN" "" "Dashboard stats"
test_endpoint "GET" "/admins/revenue-chart" "$ADMIN_TOKEN" "" "Revenue chart"
test_endpoint "GET" "/admins/revenue/transactions" "$ADMIN_TOKEN" "" "Revenue transactions"
test_endpoint "GET" "/admins/revenue/summary" "$ADMIN_TOKEN" "" "Revenue summary"
test_endpoint "GET" "/admins/$ADMIN_ID" "$ADMIN_TOKEN" "" "Get admin"

# ---- WALLET ----
echo "  [Wallet]"
test_endpoint "GET" "/wallet" "$USER_TOKEN" "" "Get wallet"
test_endpoint "POST" "/wallet/add-funds" "$USER_TOKEN" '{"amount":1000}' "Add funds"
test_endpoint "GET" "/wallet/all" "$ADMIN_TOKEN" "" "All wallets (admin)"

# ---- TRANSACTIONS ----
echo "  [Transactions]"
test_endpoint "GET" "/transactions/my" "$USER_TOKEN" "" "My transactions"
test_endpoint "GET" "/transactions" "$ADMIN_TOKEN" "" "All transactions (admin)"

# ---- KUNDLI ----
echo "  [Kundli]"
test_endpoint "GET" "/kundli?userId=$USER_ID" "$USER_TOKEN" "" "Get kundli"
test_endpoint "POST" "/kundli" "$USER_TOKEN" '{"name":"Test","gender":"male","dateOfBirth":"1990-01-15","timeOfBirth":"10:30","placeOfBirth":"Mumbai"}' "Create kundli"

# ---- MATCHMAKING ----
echo "  [Matchmaking]"
test_endpoint "GET" "/matchmaking?userId=$USER_ID" "$USER_TOKEN" "" "Get matchmaking"
test_endpoint "POST" "/matchmaking" "$USER_TOKEN" '{"userId":"'$USER_ID'","person1Name":"A","person1Dob":"1990-01-15","person1Tob":"10:30","person1Pob":"Mumbai","person2Name":"B","person2Dob":"1992-06-20","person2Tob":"14:00","person2Pob":"Delhi"}' "Create matchmaking"

# ---- HOROSCOPE ----
echo "  [Horoscope]"
test_endpoint "GET" "/horoscope" "" "" "List horoscopes"
test_endpoint "POST" "/horoscope" "" '{"zodiacSign":"Aries","date":"2026-07-25","prediction":"Great day","luckyNumber":7,"luckyColor":"Red","mood":"Energetic"}' "Create horoscope"

# ---- PANCHANG ----
echo "  [Panchang]"
test_endpoint "GET" "/panchang" "" "" "List panchang"
test_endpoint "POST" "/panchang" "" '{"date":"2026-07-25","tithi":"Shukla","nakshatra":"Ashwini","yoga":"Vishkumbha","karana":"Bava","sunrise":"06:00","sunset":"18:30","rahuKaal":"07:30-09:00"}' "Create panchang"

# ---- BLOGS ----
echo "  [Blogs]"
test_endpoint "GET" "/blogs" "" "" "List blogs"
test_endpoint "POST" "/blogs" "$ADMIN_TOKEN" '{"title":"Test Blog","slug":"test-blog","content":"Test content","author":"Admin","tags":["test"],"image":"https://example.com/img.jpg"}' "Create blog"

# ---- NEWS ----
echo "  [News]"
test_endpoint "GET" "/news" "" "" "List news"
test_endpoint "GET" "/news/admin" "" "" "List news admin"
test_endpoint "POST" "/news" "$ADMIN_TOKEN" '{"title":"Test News","content":"Test","category":"General"}' "Create news"

# ---- REVIEWS ----
echo "  [Reviews]"
test_endpoint "GET" "/reviews?astrologerId=$ASTRO_ID" "$USER_TOKEN" "" "List reviews"
test_endpoint "POST" "/reviews" "$USER_TOKEN" '{"astrologerId":"'$ASTRO_ID'","rating":4,"comment":"Good"}' "Create review"

# ---- REPORTS ----
echo "  [Reports]"
test_endpoint "GET" "/reports" "$ADMIN_TOKEN" "" "List reports"
test_endpoint "POST" "/reports" "$USER_TOKEN" '{"targetType":"astrologer","targetId":"'$ASTRO_ID'","reason":"Test","description":"Test report"}' "Create report"

# ---- NOTIFICATIONS ----
echo "  [Notifications]"
test_endpoint "GET" "/notifications?userId=$USER_ID" "$USER_TOKEN" "" "List notifications"
test_endpoint "POST" "/notifications" "$ADMIN_TOKEN" '{"userId":"'$USER_ID'","title":"Test","message":"Test","type":"general"}' "Create notification"
test_endpoint "POST" "/notifications/read-all" "$USER_TOKEN" '{"userId":"'$USER_ID'"}' "Mark all read"

# ---- SETTINGS ----
echo "  [Settings]"
test_endpoint "GET" "/settings" "" "" "List settings"
test_endpoint "GET" "/settings/app_name" "" "" "Get setting"
test_endpoint "POST" "/settings/app_name" "$ADMIN_TOKEN" '{"value":"Astro Shine Pro"}' "Set setting"

# ---- API KEYS ----
echo "  [API Keys]"
test_endpoint "GET" "/api-keys" "$ADMIN_TOKEN" "" "List API keys"
test_endpoint "POST" "/api-keys" "$ADMIN_TOKEN" '{"provider":"razorpay","key":"test_key","value":"test_value"}' "Create API key"

# ---- DYNAMIC LINKS ----
echo "  [Dynamic Links]"
test_endpoint "GET" "/dynamic-links" "" "" "List (public)"
test_endpoint "GET" "/dynamic-links/admin" "" "" "List (admin)"
test_endpoint "GET" "/dynamic-links/page/home" "" "" "By page"
test_endpoint "POST" "/dynamic-links" "" '{"pageName":"home","title":"Home","url":"https://example.com","order":1}' "Create"

# ---- WEBSITE CONTENT ----
echo "  [Website Content]"
test_endpoint "GET" "/website-content" "" "" "List (public)"
test_endpoint "GET" "/website-content/admin" "" "" "List (admin)"
test_endpoint "GET" "/website-content/section/hero" "" "" "By section"
test_endpoint "POST" "/website-content/section/hero" "" '{"title":"Welcome","subtitle":"To Astro Shine","content":"Best platform"}' "Upsert"

# ---- COMMISSIONS ----
echo "  [Commissions]"
test_endpoint "GET" "/commissions" "$ADMIN_TOKEN" "" "List commissions"
test_endpoint "GET" "/commissions/logs?astrologerId=$ASTRO_ID" "$ADMIN_TOKEN" "" "Commission logs"
test_endpoint "GET" "/commissions/stats/$ASTRO_ID" "$ADMIN_TOKEN" "" "Astrologer stats"
test_endpoint "GET" "/commissions/by-astrologer/$ASTRO_ID" "$ADMIN_TOKEN" "" "By astrologer"

# ---- CALLS ----
echo "  [Calls]"
test_endpoint "GET" "/calls?userId=$USER_ID" "$USER_TOKEN" "" "List calls"
CALL_ID=$(curl -s -X POST "$BASE/calls" -H "Content-Type: application/json" -H "Authorization: Bearer $USER_TOKEN" -d '{"astrologerId":"'$ASTRO_ID'","type":"audio"}' | jq -r '.id // ""')
if [ -n "$CALL_ID" ] && [ "$CALL_ID" != "null" ]; then
  test_endpoint "PUT" "/calls/$CALL_ID/status" "$USER_TOKEN" '{"status":"completed","duration":300}' "Update call status"
fi

# ---- GIFTS ----
echo "  [Gifts]"
test_endpoint "GET" "/gifts" "$USER_TOKEN" "" "List gifts"
test_endpoint "POST" "/gifts" "$ADMIN_TOKEN" '{"name":"Test Gift","price":99,"image":"https://example.com/gift.jpg","isActive":true}' "Create gift"
GIFT_ID=$(curl -s -X GET "$BASE/gifts" -H "Authorization: Bearer $USER_TOKEN" | jq -r '.[0].id // ""')
if [ -n "$GIFT_ID" ] && [ "$GIFT_ID" != "null" ]; then
  test_endpoint "GET" "/gifts/$GIFT_ID" "$USER_TOKEN" "" "Get gift"
  test_endpoint "PUT" "/gifts/$GIFT_ID" "$ADMIN_TOKEN" '{"name":"Updated Gift","price":149}' "Update gift"
  test_endpoint "POST" "/gifts/send" "$USER_TOKEN" '{"giftId":"'$GIFT_ID'","receiverId":"'$ASTRO_ID'"}' "Send gift"
fi
test_endpoint "GET" "/gifts/transactions" "$USER_TOKEN" "" "Transactions"

# ---- DONATIONS ----
echo "  [Donations]"
test_endpoint "GET" "/donations?userId=$USER_ID" "$USER_TOKEN" "" "List donations"
test_endpoint "POST" "/donations" "$USER_TOKEN" '{"amount":500,"userId":"'$USER_ID'"}' "Create donation"
test_endpoint "GET" "/donations/stats" "$ADMIN_TOKEN" "" "Stats (admin)"
test_endpoint "GET" "/donations/logs" "$ADMIN_TOKEN" "" "Logs (admin)"

# ---- SHOP ----
echo "  [Shop]"
test_endpoint "GET" "/shop" "" "" "List products"
test_endpoint "POST" "/shop" "$ADMIN_TOKEN" '{"name":"Test Product","description":"Test","price":299,"category":"Books","stock":10,"image":"https://example.com/p.jpg"}' "Create product"
PROD_ID=$(curl -s -X GET "$BASE/shop" | jq -r '.[0].id // ""')
if [ -n "$PROD_ID" ] && [ "$PROD_ID" != "null" ]; then
  test_endpoint "GET" "/shop/$PROD_ID" "" "" "Get product"
  test_endpoint "PUT" "/shop/$PROD_ID" "$ADMIN_TOKEN" '{"price":249}' "Update product"
  test_endpoint "DELETE" "/shop/$PROD_ID" "$ADMIN_TOKEN" "" "Delete product"
fi

# ---- ORDERS ----
echo "  [Orders]"
test_endpoint "GET" "/orders/my" "$USER_TOKEN" "" "My orders"
test_endpoint "GET" "/orders" "$ADMIN_TOKEN" "" "All orders"
test_endpoint "POST" "/orders" "$USER_TOKEN" '{"userId":"'$USER_ID'","totalAmount":299,"status":"pending"}' "Create order"
ORDER_ID=$(curl -s -X GET "$BASE/orders/my" -H "Authorization: Bearer $USER_TOKEN" | jq -r '.[0].id // ""')
if [ -n "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
  test_endpoint "GET" "/orders/$ORDER_ID" "$USER_TOKEN" "" "Get order"
  test_endpoint "GET" "/orders/$ORDER_ID/items" "$USER_TOKEN" "" "Get items"
  test_endpoint "POST" "/orders/$ORDER_ID/items" "$USER_TOKEN" '{"productId":"'$PROD_ID'","quantity":1,"price":299}' "Add item"
  test_endpoint "PUT" "/orders/$ORDER_ID/status" "$ADMIN_TOKEN" '{"status":"confirmed"}' "Update status"
fi

# ---- VIDEOS ----
echo "  [Videos]"
test_endpoint "GET" "/videos" "" "" "List videos"
test_endpoint "GET" "/videos/admin" "" "" "List admin"
test_endpoint "POST" "/videos" "$ADMIN_TOKEN" '{"title":"Test Video","url":"https://example.com/v.mp4","category":"Educational","duration":300}' "Create video"

# ---- LIVE SESSIONS ----
echo "  [Live Sessions]"
test_endpoint "GET" "/live-sessions" "" "" "List (public)"
test_endpoint "GET" "/live-sessions/live" "" "" "Live now"
test_endpoint "GET" "/live-sessions/astrologer/$ASTRO_ID" "$ASTRO_TOKEN" "" "By astrologer"
test_endpoint "POST" "/live-sessions" "$ASTRO_TOKEN" '{"title":"Test Live","description":"Test"}' "Create session"
LS_ID=$(curl -s -X POST "$BASE/live-sessions" -H "Content-Type: application/json" -H "Authorization: Bearer $ASTRO_TOKEN" -d '{"title":"Test Live","description":"Test"}' | jq -r '.id // ""')
if [ -n "$LS_ID" ] && [ "$LS_ID" != "null" ]; then
  test_endpoint "GET" "/live-sessions/$LS_ID" "$ASTRO_TOKEN" "" "Get session"
  test_endpoint "PUT" "/live-sessions/$LS_ID/status" "$ASTRO_TOKEN" '{"status":"live"}' "Update status"
fi

# ---- MANDIR POOJA ----
echo "  [Mandir Pooja]"
test_endpoint "GET" "/mandir-pooja" "" "" "List poojas"
test_endpoint "GET" "/mandir-pooja/admin" "$ADMIN_TOKEN" "" "List admin"
test_endpoint "POST" "/mandir-pooja" "$ADMIN_TOKEN" '{"name":"Satyanarayan Pooja","description":"Sacred","price":1100,"category":"General","duration":120}' "Create pooja"
POOJA_ID=$(curl -s -X GET "$BASE/mandir-pooja" | jq -r '.[0].id // ""')
if [ -n "$POOJA_ID" ] && [ "$POOJA_ID" != "null" ]; then
  test_endpoint "GET" "/mandir-pooja/$POOJA_ID" "" "" "Get pooja"
  test_endpoint "PUT" "/mandir-pooja/$POOJA_ID" "$ADMIN_TOKEN" '{"price":1500}' "Update pooja"
  test_endpoint "POST" "/mandir-pooja/bookings" "$USER_TOKEN" '{"poojaId":"'$POOJA_ID'","bookingDate":"2026-08-01","amount":1500}' "Create booking"
  test_endpoint "GET" "/mandir-pooja/bookings/list" "$USER_TOKEN" "" "List bookings"
fi

# ---- SUPPORT TICKETS ----
echo "  [Support]"
test_endpoint "GET" "/support/tickets?userId=$USER_ID" "$USER_TOKEN" "" "List tickets"
test_endpoint "POST" "/support/tickets" "$USER_TOKEN" '{"userId":"'$USER_ID'","subject":"Test Issue","message":"Having a problem","priority":"medium"}' "Create ticket"
TICKET_ID=$(curl -s -X POST "$BASE/support/tickets" -H "Content-Type: application/json" -H "Authorization: Bearer $USER_TOKEN" -d '{"userId":"'$USER_ID'","subject":"Test Issue","message":"Having a problem","priority":"medium"}' | jq -r '.id // ""')
if [ -n "$TICKET_ID" ] && [ "$TICKET_ID" != "null" ]; then
  test_endpoint "GET" "/support/tickets/$TICKET_ID" "$USER_TOKEN" "" "Get ticket"
  test_endpoint "PUT" "/support/tickets/$TICKET_ID/assign" "$ADMIN_TOKEN" '{"assignedTo":"'$ADMIN_ID'"}' "Assign"
  test_endpoint "PUT" "/support/tickets/$TICKET_ID/resolve" "$ADMIN_TOKEN" '{}' "Resolve"
  test_endpoint "GET" "/support/tickets/$TICKET_ID/replies" "$USER_TOKEN" "" "Get replies"
  test_endpoint "POST" "/support/tickets/$TICKET_ID/replies" "$ADMIN_TOKEN" '{"message":"Working on it"}' "Add reply"
fi

# ---- RELEASES ----
echo "  [Releases]"
test_endpoint "GET" "/releases" "" "" "List releases"
test_endpoint "POST" "/releases" "$ADMIN_TOKEN" '{"appName":"astro-shine","platform":"android","version":"1.0.0","buildNumber":1,"releaseNotes":"Initial","downloadUrl":"https://example.com/app.apk","isMandatory":false}' "Create release"

# ---- SCHEDULE ----
echo "  [Schedule]"
test_endpoint "GET" "/schedule/$ASTRO_ID" "$ASTRO_TOKEN" "" "Get schedule"
test_endpoint "POST" "/schedule/$ASTRO_ID" "$ASTRO_TOKEN" '{"dayOfWeek":1,"startTime":"09:00","endTime":"17:00","isAvailable":true}' "Upsert slot"
test_endpoint "PUT" "/schedule/$ASTRO_ID/bulk" "$ASTRO_TOKEN" '{"slots":[{"dayOfWeek":1,"startTime":"09:00","endTime":"13:00","isAvailable":true},{"dayOfWeek":2,"startTime":"10:00","endTime":"14:00","isAvailable":true}]}' "Bulk upsert"

# ---- CONVERSATIONS ----
echo "  [Conversations]"
test_endpoint "GET" "/conversations" "$USER_TOKEN" "" "List conversations"
test_endpoint "POST" "/conversations" "$USER_TOKEN" '{"participantId":"'$ASTRO_ID'","participantRole":"astrologer"}' "Create conversation"
CONV_ID=$(curl -s -X POST "$BASE/conversations" -H "Content-Type: application/json" -H "Authorization: Bearer $USER_TOKEN" -d '{"participantId":"'$ASTRO_ID'","participantRole":"astrologer"}' | jq -r '.id // ""')
if [ -n "$CONV_ID" ] && [ "$CONV_ID" != "null" ]; then
  test_endpoint "GET" "/conversations/$CONV_ID" "$USER_TOKEN" "" "Get conversation"
  test_endpoint "GET" "/conversations/$CONV_ID/messages" "$USER_TOKEN" "" "Get messages"
  test_endpoint "POST" "/conversations/$CONV_ID/messages" "$USER_TOKEN" '{"content":"Hello!"}' "Send message"
  test_endpoint "PUT" "/conversations/$CONV_ID/read" "$USER_TOKEN" '{"userId":"'$USER_ID'"}' "Mark read"
fi

# ---- MUHURAT CATEGORIES ----
echo "  [Muhurat Categories]"
test_endpoint "GET" "/muhurat-categories" "" "" "List (public)"
test_endpoint "GET" "/muhurat-categories/admin" "$ADMIN_TOKEN" "" "List (admin)"
test_endpoint "POST" "/muhurat-categories" "$ADMIN_TOKEN" '{"name":"TestCat'$RANDOM'","description":"Auspicious","icon":"heart"}' "Create category"
MC_ID=$(curl -s -X GET "$BASE/muhurat-categories" | jq -r '.[0].id // ""')
if [ -n "$MC_ID" ] && [ "$MC_ID" != "null" ]; then
  test_endpoint "GET" "/muhurat-categories/$MC_ID" "" "" "Get category"
  test_endpoint "PUT" "/muhurat-categories/$MC_ID" "$ADMIN_TOKEN" '{"name":"Marriage"}' "Update category"
fi

# ---- MUHURAT ----
echo "  [Muhurat]"
test_endpoint "GET" "/muhurat" "" "" "List (public)"
test_endpoint "GET" "/muhurat/admin" "$ADMIN_TOKEN" "" "List (admin)"
test_endpoint "POST" "/muhurat" "$ADMIN_TOKEN" '{"categoryId":"'$MC_ID'","name":"Auspicious Time","date":"2026-08-15","time":"06:00","description":"Good time"}' "Create muhurat"

# ---- PAYMENTS ----
echo "  [Payments]"
test_endpoint "POST" "/payments/create-order" "$USER_TOKEN" '{"amount":500,"purpose":"wallet_recharge","receipt":"test-receipt-1"}' "Create order"

# ---- WITHDRAWALS ----
echo "  [Withdrawals]"
test_endpoint "GET" "/withdrawals" "$ADMIN_TOKEN" "" "List withdrawals"
test_endpoint "POST" "/withdrawals" "$ASTRO_TOKEN" '{"amount":1,"accountDetails":"UPI: test@upi"}' "Create withdrawal"

# ---- CHAT ----
echo "  [Chat]"
if [ -n "$CALL_ID" ] && [ "$CALL_ID" != "null" ] && [ "$CALL_ID" != "" ]; then
  test_endpoint "GET" "/chat?callId=$CALL_ID" "$USER_TOKEN" "" "Get chat by call"
  test_endpoint "POST" "/chat" "$USER_TOKEN" '{"callId":"'$CALL_ID'","senderId":"'$USER_ID'","senderRole":"user","message":"Test message"}' "Send chat"
fi

# ---- MUHURAT MY ----
echo "  [Muhurat My]"
test_endpoint "GET" "/muhurat/my" "$ASTRO_TOKEN" "" "My muhurat entries"

# ---- FILE UPLOAD ----
echo "  [File Upload]"
echo "test" > /tmp/test-upload.txt
UPLOAD_RESULT=$(curl -s -w '\n%{http_code}' -X POST "$BASE/upload" -H "Authorization: Bearer $USER_TOKEN" -F "file=@/tmp/test-upload.txt" 2>/dev/null)
UPLOAD_CODE=$(echo "$UPLOAD_RESULT" | tail -1)
if [ "$UPLOAD_CODE" = "200" ] || [ "$UPLOAD_CODE" = "201" ]; then
  PASS=$((PASS+1)); TOTAL=$((TOTAL+1)); echo -e "  ${GREEN}✓${NC} POST /upload"
else
  FAIL=$((FAIL+1)); TOTAL=$((TOTAL+1)); echo -e "  ${RED}✗${NC} POST /upload ($UPLOAD_CODE)"
fi

# ============================================================
# SUMMARY
# ============================================================
echo ""
echo "============================================"
echo -e "  Results: ${GREEN}$PASS passed${NC}, ${RED}$FAIL failed${NC}, $TOTAL total"
echo "============================================"

sed -i "s/|.*|.*|.*|.*|/| All Endpoints | $PASS | $FAIL | $TOTAL |/" "$MD_FILE"
echo "" >> "$MD_FILE"
echo "**Total: $PASS passed, $FAIL failed, $TOTAL endpoints tested**" >> "$MD_FILE"
echo "Results saved to: $MD_FILE"
