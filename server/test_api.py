#!/usr/bin/env python3
import subprocess, json, sys

BASE = "http://localhost:3000/api/v1"
OK, FAIL = 0, 0

def req(method, path, data=None, token=None, raw=False):
    cmd = ["curl", "-s"]
    if method != "GET": cmd += ["-X", method]
    if data:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(data)]
    if token:
        cmd += ["-H", f"Authorization: Bearer {token}"]
    if raw: cmd += ["-w", "\nHTTP:%{http_code}"]
    cmd.append(f"{BASE}{path}")
    r = subprocess.run(cmd, capture_output=True, text=True)
    return r.stdout.strip()

def t(name, result, expected=None):
    global OK, FAIL
    status = "PASS" if (expected is None and result) or (expected is not None and expected in str(result)) else "FAIL"
    if status == "FAIL": FAIL += 1
    else: OK += 1
    print(f"  [{status}] {name}: {str(result)[:80]}")

print("=" * 60)
print("  ASTRO SHINE - COMPLETE API VALIDATION")
print("=" * 60)

# Auth
print("\n>>> AUTH")
reg = json.loads(req("POST", "/auth/register", {"name":"Test User","email":"t@t.com","password":"pass123","phone":"1111"}))
t("Register", "token" in reg)
t("No password leak", "password" not in reg.get("user",{}))

login = json.loads(req("POST", "/auth/login", {"email":"t@t.com","password":"pass123"}))
TOKEN = login.get("token","")
t("Login", bool(TOKEN))

bad = json.loads(req("POST", "/auth/login", {"email":"t@t.com","password":"wrong"}))
t("Bad password = 401", bad.get("statusCode") == 401)

dup = json.loads(req("POST", "/auth/register", {"name":"D","email":"t@t.com","password":"x"}))
t("Duplicate email = 401", dup.get("statusCode") == 401)

otp = json.loads(req("POST", "/auth/send-otp", {"phone":"2222"}))
t("Send OTP", "otp" in otp)

verify = json.loads(req("POST", "/auth/verify-otp", {"phone":"2222","otp":"123456"}))
t("Verify OTP", verify.get("user",{}).get("phone") == "2222")

verify_bad = json.loads(req("POST", "/auth/verify-otp", {"phone":"2222","otp":"999999"}))
t("Invalid OTP = 401", verify_bad.get("statusCode") == 401)

# Users
print("\n>>> USERS")
users = json.loads(req("GET", "/users"))
UID = users[0]["id"]
t("List users", len(users) > 0)

u = json.loads(req("GET", f"/users/{UID}"))
t("Get user", u["name"] == "Test User")

u2 = json.loads(req("PUT", f"/users/{UID}", {"name":"Updated"}))
t("Update user", u2["name"] == "Updated")

# Astrologers
print("\n>>> ASTROLOGERS")
astro = json.loads(req("POST", "/astrologers", {"name":"Guru Ji","email":"guru@t.com","password":"p","phone":"3333"}))
AID = astro["id"]
t("Create astrologer", bool(AID))

astros = json.loads(req("GET", "/astrologers"))
t("List astrologers", len(astros) >= 1)

av = json.loads(req("POST", f"/astrologers/{AID}/verify", {"status":"approved"}))
t("Verify astrologer", av.get("verificationStatus") == "approved")

os = json.loads(req("PUT", f"/astrologers/{AID}/online-status", {"status":"online"}))
t("Online status", os.get("onlineStatus") == "online")

# Admins
print("\n>>> ADMINS")
admin = json.loads(req("POST", "/admins", {"name":"Admin","email":"a@t.com","password":"admin123","role":"super_admin"}))
ADMIN_ID = admin["id"]
t("Create admin", bool(ADMIN_ID))
t("Admin list", len(json.loads(req("GET", "/admins"))) >= 1)

# Kundli
print("\n>>> KUNDLI")
k = json.loads(req("POST", "/kundli", {"userId":UID,"name":"My Kundli","gender":"male","dateOfBirth":"1990-01-01","timeOfBirth":"10:30:00","placeOfBirth":"Mumbai"}))
KID = k["id"]
t("Create kundli", bool(KID))
t("List by user", len(json.loads(req("GET", f"/kundli?userId={UID}"))) >= 1)

# Matchmaking
print("\n>>> MATCHMAKING")
m = json.loads(req("POST", "/matchmaking", {"userId":UID,"person1Name":"A","person1Dob":"1990-01-01","person1Tob":"10:00:00","person1Place":"Mumbai","person2Name":"B","person2Dob":"1992-06-15","person2Tob":"14:00:00","person2Place":"Delhi"}))
t("Create matchmaking", bool(m["id"]))
t("List by user", len(json.loads(req("GET", f"/matchmaking?userId={UID}"))) >= 1)

# Horoscope
print("\n>>> HOROSCOPE")
h = json.loads(req("POST", "/horoscope", {"zodiacSign":"aries","date":"2026-07-02","prediction":"Great day!","luckyNumber":7,"luckyColor":"red","mood":"energetic"}))
t("Create horoscope", h["zodiacSign"] == "aries")
t("By sign", len(json.loads(req("GET", "/horoscope?sign=aries"))) >= 1)

# Panchang
print("\n>>> PANCHANG")
p = json.loads(req("POST", "/panchang", {"date":"2026-07-02","tithi":"Shukla Paksha","nakshatra":"Rohini","sunrise":"05:45:00","sunset":"19:15:00"}))
t("Create panchang", p.get("tithi") == "Shukla Paksha")
t("By date", json.loads(req("GET", "/panchang?date=2026-07-02"))["nakshatra"] == "Rohini")

# Wallet
print("\n>>> WALLET")
w = json.loads(req("GET", "/wallet", token=TOKEN))
WID = w["id"]
t("Get wallet (auto-create)", w["balance"] == "0.00")

w2 = json.loads(req("POST", "/wallet/add-funds", {"amount":"1000"}, token=TOKEN))
t("Add funds", w2["balance"] == "1000.00")

noauth = json.loads(req("GET", "/wallet"))
t("Wallet no auth = 401", noauth.get("statusCode") == 401)

# Transactions
print("\n>>> TRANSACTIONS")
tx = json.loads(req("POST", "/transactions", {"walletId":WID,"userId":UID,"type":"credit","category":"add_funds","amount":"1000","fee":"0","netAmount":"1000","status":"success"}))
TXID = tx["id"]
t("Create transaction", bool(TXID))
t("List by wallet", len(json.loads(req("GET", f"/transactions?walletId={WID}"))) >= 1)

tx_upd = json.loads(req("PUT", f"/transactions/{TXID}/status", {"status":"failed"}))
t("Update status", tx_upd.get("status") == "failed")

# Withdrawals
print("\n>>> WITHDRAWALS")
wdr = json.loads(req("POST", "/withdrawals", {"astrologerId":AID,"amount":"200","bankAccount":{"bank":"HDFC","acct":"123"}}))
WDID = wdr["id"]
t("Create withdrawal", bool(WDID))
wdr_app = json.loads(req("PUT", f"/withdrawals/{WDID}/approve", {"adminId":ADMIN_ID}))
t("Approve withdrawal", wdr_app.get("status") == "approved")

# Commission
print("\n>>> COMMISSION")
comm = json.loads(req("POST", "/commissions", {"astrologerId":AID,"type":"percentage","value":"20"}))
CID = comm["id"]
t("Create commission", bool(CID))
t("List commissions", len(json.loads(req("GET", "/commissions"))) >= 1)

# Calls
print("\n>>> CALLS")
call = json.loads(req("POST", "/calls", {"astrologerId":AID,"userId":UID,"type":"audio","status":"completed","duration":300,"cost":"50"}))
CALL_ID = call["id"]
t("Create call", bool(CALL_ID))
t("By astrologer", len(json.loads(req("GET", f"/calls?astrologerId={AID}"))) >= 1)

call_upd = json.loads(req("PUT", f"/calls/{CALL_ID}/status", {"status":"completed"}))
t("Update call status", call_upd.get("status") == "completed")

# Chat
print("\n>>> CHAT")
msg = json.loads(req("POST", "/chat", {"callId":CALL_ID,"senderId":UID,"senderRole":"user","type":"text","content":"Hello Guru Ji"}))
MID = msg["id"]
t("Create message", msg["content"] == "Hello Guru Ji")
t("By call", len(json.loads(req("GET", f"/chat?callId={CALL_ID}"))) >= 1)

msg_read = json.loads(req("PUT", f"/chat/{MID}/read"))
t("Mark read", msg_read.get("isRead") == True)

# Gifts
print("\n>>> GIFTS")
gift = json.loads(req("POST", "/gifts", {"name":"Diamond Ring","price":"199"}))
GID = gift["id"]
t("Create gift", bool(GID))

gt = json.loads(req("POST", "/gifts/send", {"giftId":GID,"senderId":UID,"receiverId":AID}))
GTID = gt["id"]
t("Send gift", bool(GTID))

redeemed = json.loads(req("PUT", f"/gifts/transactions/{GTID}/redeem"))
t("Redeem gift", redeemed.get("isRedeemed") == True)

# Donations
print("\n>>> DONATIONS")
don = json.loads(req("POST", "/donations", {"userId":UID,"amount":"101","message":"Om Namah Shivaya"}))
t("Create donation", don["amount"] == "101.00")
t("By user", len(json.loads(req("GET", f"/donations?userId={UID}"))) >= 1)

# Shop
print("\n>>> SHOP")
prod = json.loads(req("POST", "/shop", {"name":"Rudraksha Mala","price":"499","category":"spiritual","stock":50}))
PID = prod["id"]
t("Create product", bool(PID))
t("By category", len(json.loads(req("GET", "/shop?category=spiritual"))) >= 1)

prod_upd = json.loads(req("PUT", f"/shop/{PID}", {"price":"599"}))
t("Update product price", prod_upd.get("price") == "599.00")

# Orders
print("\n>>> ORDERS")
ord = json.loads(req("POST", "/orders", {"userId":UID,"totalAmount":"499"}))
OID = ord["id"]
t("Create order", bool(OID))

oi = json.loads(req("POST", f"/orders/{OID}/items", {"productId":PID,"quantity":2,"unitPrice":"499","totalPrice":"998"}))
t("Add order item", oi["quantity"] == 2)

ord_upd = json.loads(req("PUT", f"/orders/{OID}/status", {"status":"confirmed"}))
t("Update order status", ord_upd.get("status") == "confirmed")

t("By user", len(json.loads(req("GET", f"/orders?userId={UID}"))) >= 1)

# Blogs
print("\n>>> BLOGS")
blog = json.loads(req("POST", "/blogs", {"title":"Vedic Guide","slug":"vedic-guide","content":"Full content","status":"published"}))
BID = blog["id"]
t("Create blog", bool(BID))
t("By slug", json.loads(req("GET", "/blogs/slug/vedic-guide"))["title"] == "Vedic Guide")

blog_upd = json.loads(req("PUT", f"/blogs/{BID}", {"title":"Updated Vedic Guide"}))
t("Update blog", blog_upd.get("title") == "Updated Vedic Guide")

# News
print("\n>>> NEWS")
news = json.loads(req("POST", "/news", {"title":"Mercury Retrograde","content":"Mercury goes retrograde in July..."}))
NID = news["id"]
t("Create news", bool(NID))
t("List news active", len(json.loads(req("GET", "/news"))) >= 1)

# Reviews
print("\n>>> REVIEWS")
rev = json.loads(req("POST", "/reviews", {"userId":UID,"astrologerId":AID,"rating":5,"comment":"Amazing!"}))
RID = rev["id"]
t("Create review", rev["rating"] == 5)
t("By astrologer", len(json.loads(req("GET", f"/reviews?astrologerId={AID}"))) >= 1)

vis = json.loads(req("PUT", f"/reviews/{RID}/visibility", {"isVisible":False}))
t("Toggle visibility", vis.get("isVisible") == False)

# Reports
print("\n>>> REPORTS")
rep = json.loads(req("POST", "/reports", {"reporterId":UID,"reporterRole":"user","reportedAstrologerId":AID,"reason":"fake_profile"}))
REPID = rep["id"]
t("Create report", bool(REPID))
rep_res = json.loads(req("PUT", f"/reports/{REPID}/resolve", {"adminId":ADMIN_ID}))
t("Resolve report", rep_res.get("status") == "reviewed")

# Notifications
print("\n>>> NOTIFICATIONS")
notif = json.loads(req("POST", "/notifications", {"userId":UID,"type":"transactional","title":"Credited","body":"1000 INR"}))
NFID = notif["id"]
t("Create notification", bool(NFID))
t("By user", len(json.loads(req("GET", f"/notifications?userId={UID}"))) >= 1)

nf_read = json.loads(req("PUT", f"/notifications/{NFID}/read"))
t("Mark read", nf_read.get("isRead") == True)

# Settings
print("\n>>> SETTINGS")
s = json.loads(req("POST", "/settings/app_name", {"value":"Astro Shine"}))
t("Set setting", s["key"] == "app_name")
t("Get setting", json.loads(req("GET", "/settings/app_name"))["value"] == "Astro Shine")

# API Keys
print("\n>>> API KEYS")
ak = json.loads(req("POST", "/api-keys", {"provider":"stripe","keyName":"Live","apiKey":"sk_live"}))
AKID = ak["id"]
t("Create API key", bool(AKID))
t("By provider", len(json.loads(req("GET", "/api-keys?provider=stripe"))) >= 1)

# Dynamic Links
print("\n>>> DYNAMIC LINKS")
dl = json.loads(req("POST", "/dynamic-links", {"pageName":"terms","url":"https://astroshine.com/terms"}))
t("Create link", dl.get("pageName") == "terms")
t("By page", json.loads(req("GET", "/dynamic-links/page/terms"))["url"] == "https://astroshine.com/terms")

# Website Content
print("\n>>> WEBSITE CONTENT")
wc = json.loads(req("POST", "/website-content/section/hero", {"content":{"title":"Discover"}}))
t("Upsert content", wc["section"] == "hero")
t("Read content", json.loads(req("GET", "/website-content/section/hero"))["content"]["title"] == "Discover")

# Live Sessions
print("\n>>> LIVE SESSIONS")
ls = json.loads(req("POST", "/live-sessions", {"astrologerId":AID,"title":"Weekly Live","status":"live"}))
LSID = ls["id"]
t("Create session", bool(LSID))
t("Live now", len(json.loads(req("GET", "/live-sessions/live"))) >= 1)

ls_upd = json.loads(req("PUT", f"/live-sessions/{LSID}/status", {"status":"ended"}))
t("End session", ls_upd.get("status") == "ended")

# Mandir Pooja
print("\n>>> MANDIR POOJA")
mp = json.loads(req("POST", "/mandir-pooja", {"name":"Satyanarayan Pooja","price":"1100"}))
MPID = mp["id"]
t("Create pooja", bool(MPID))

book = json.loads(req("POST", "/mandir-pooja/bookings", {"userId":UID,"poojaId":MPID,"bookingDate":"2026-07-15","amount":"1100"}))
BOOKID = book["id"]
t("Create booking", bool(BOOKID))

bk_upd = json.loads(req("PUT", f"/mandir-pooja/bookings/{BOOKID}/status", {"status":"confirmed"}))
t("Confirm booking", bk_upd.get("status") == "confirmed")

# Support Tickets
print("\n>>> SUPPORT TICKETS")
tk = json.loads(req("POST", "/support/tickets", {"userId":UID,"subject":"Payment Issue","message":"Stuck"}))
TKID = tk["id"]
t("Create ticket", bool(TKID))

tr = json.loads(req("POST", f"/support/tickets/{TKID}/replies", {"senderId":ADMIN_ID,"senderRole":"admin","message":"We are on it"}))
t("Add reply", tr["message"] == "We are on it")
t("List replies", len(json.loads(req("GET", f"/support/tickets/{TKID}/replies"))) >= 1)

# App Releases
print("\n>>> APP RELEASES")
ar = json.loads(req("POST", "/releases", {"appName":"user","platform":"android","version":"1.0.0","buildNumber":1}))
t("Create release", ar["version"] == "1.0.0")
t("List releases", len(json.loads(req("GET", "/releases"))) >= 1)

# Videos
print("\n>>> VIDEOS")
vid = json.loads(req("POST", "/videos", {"title":"Kundli Guide","description":"Full guide","url":"https://youtube.com/x","category":"education","duration":1200}))
VID = vid["id"]
t("Create video", bool(VID))
t("List videos", len(json.loads(req("GET", "/videos"))) >= 1)
t("By category", len(json.loads(req("GET", "/videos?category=education"))) >= 1)

# Delete & 404
print("\n>>> MISC")
del_resp = req("DELETE", f"/users/{UID}", raw=True)
t("Soft delete = 204", "204" in del_resp)

e404 = req("GET", "/nonexistent", raw=True)
t("404 route", "404" in e404)

print(f"\n{'='*60}")
print(f"  RESULTS: {OK} PASS, {FAIL} FAIL ({(OK/(OK+FAIL)*100):.0f}%)")
print(f"{'='*60}")
