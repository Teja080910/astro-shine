# LiveKit Video/Audio Calls — Setup, Issues & Troubleshooting

Working reference for the calling feature (mobile app ↔ web ↔ astrologer app).
Last verified: 2026-09-18.

## 1. Stack & Quick Facts

| Piece | Where | Notes |
|---|---|---|
| Mobile app | `app/` (Expo SDK 54, RN 0.81.5, Hermes) | Needs a **dev build** (never Expo Go) |
| Web app | `web/` (browser) | Uses `livekit-client` UMD |
| Backend | `server/` (NestJS, port 3067) | REST prefix `/api/v1`, socket path `/ws` |
| LiveKit server | VPS `31.97.222.250:7880` | Docker container `livekit-server`, currently **v1.13.7** |

**Ports** (from `/tmp/livekit.yaml` on VPS):
- `7880` TCP — signaling (WebSocket)
- `7881` TCP — WebRTC over TCP
- `7881–7882` — ICE/UDP range (`use_external_ip: true`)

**Client package versions (mobile) — do not change casually:**

| Package | Version | Constraint |
|---|---|---|
| `@livekit/react-native` | 2.12.0 | peer wants `livekit-client ^2.19.0`, webrtc `^144.1.2` |
| `@livekit/react-native-webrtc` | **144.1.2 exact** | 144.2.0 renames Java package to `livekit.org.webrtc` → Kotlin compile errors in react-native 2.12.0 |
| `livekit-client` | 2.21.0 | Requires **LiveKit server ≥ 1.9.0** |

To use webrtc `144.2.x` you must upgrade `@livekit/react-native` to `3.0.0` at the same time.

**Test accounts (dev only):**

| Role | Email | Password | Phone |
|---|---|---|---|
| User | `demo.user@astroshine.com` | `Demo@1234` | 9000000001 |
| Astrologer (approved) | `demo.astro@astroshine.com` | `Demo@1234` | 9000000002 |
| User (synthetic caller) | `test.caller@astroshine.com` | `Test@1234` | 9000000003 |

LiveKit API key/secret live in `server/.env` (`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_HOST`).

## 2. Required Mobile Setup (one-time)

- `app/package.json`: `"main": "index.js"`
- `app/index.js`: `registerGlobals()` from `@livekit/react-native` **before** rendering, native only:
  ```js
  if (Platform.OS !== 'web') {
    require('@livekit/react-native').registerGlobals();
  }
  registerRootComponent(App);
  ```
- `app/app.json` plugins: `@livekit/react-native-expo-plugin` and `@config-plugins/react-native-webrtc` (13.x for Expo 54) with camera/microphone permission strings.
- After changing native deps or plugins: `npx expo prebuild --no-install`, then rebuild (`./gradlew assembleDebug` for Android).
- `src/shared/useLiveKit.ts` essentials:
  - `VideoTrack` needs a **TrackReference** `{participant, publication, source}`, not a raw track.
  - `AudioSession.startAudioSession()` on join, `stopAudioSession()` on leave.
  - Camera flip: `track.mediaStreamTrack._switchCamera()`.
  - Remote output: iOS `selectAudioOutput('force_speaker'|'default')`, Android `'speaker'|'earpiece'`.

## 3. Call Flow (context)

1. Caller (socket.IO at `/ws`, auth via handshake token) emits `call:initiate {astrologerId, type}`.
2. `chat.gateway.ts` creates room `call_<userId>_<astrologerId>_<ts>` and two access tokens (caller + callee), emits `call:incoming` to the astrologer and `call:initiated {callId, channel, token}` to the caller.
3. `call:accepted` is what flips the caller's UI to the active call screen (delivered to all of the caller's sockets, so a logged-in web tab auto-joins too).
4. Both sides join the same LiveKit room. Billing is deducted **at call end** (`walletService.deductFundsAtomic`); insufficient balance marks the call failed.

## 4. Known Issues

### 4.1 `NegotiationError: negotiation timed out` + reconnect loop
**Symptoms:** logcat repeats every ~15s:
`negotiation disconnected` → `[NegotiationError: negotiation timed out]` → `reconnecting` →
`/rtc/v1` returns `404` → `v1 RTC path not found. Consider upgrading your LiveKit server version`,
or the server reports `version: 1.8.1, protocol: 15`.

**Cause:** LiveKit server too old for `livekit-client` ≥ 2.19 (single-peer-connection mode on `/rtc/v1`). Room shows participants with **zero published tracks** (zombie states), and the client's `negotiate()` never gets acknowledged.

**Fix:** upgrade the server to **≥ 1.9.0** (we run 1.13.7):
```bash
ssh root@31.97.222.250
docker pull livekit/livekit-server:v1.13.7
docker rm -f livekit-server
docker run -d --name livekit-server --restart unless-stopped --network host \
  -v /tmp/livekit.yaml:/etc/livekit.yaml \
  livekit/livekit-server:v1.13.7 \
  --config /etc/livekit.yaml --node-ip 31.97.222.250
```
No app change or rebuild is needed after the server upgrade.

**Check the server is new enough:**
```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -H "Connection: Upgrade" -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Key: x" -H "Sec-WebSocket-Version: 13" \
  "http://31.97.222.250:7880/rtc/v1?access_token=x"
# 401 => route exists (server OK)   404 => server too old, upgrade it
```

### 4.2 Local self-preview is blank (Android)
**Symptoms:** remote video renders, but your own small preview box is a solid color. Native log says
`First frame rendered.` anyway.

**Cause:** both videos are Android `SurfaceView`s. The full-screen remote view is created *after* the small local view and, at equal z-order, composites **on top**, hiding the preview.

**Fix** (`src/screens/shared/ActiveCallScreen.tsx`): render the local track with
`zOrder={1}` (media-overlay layer) and `style={{ width: '100%', height: '100%' }}`:
```tsx
<VideoTrackComponent trackRef={track} style={style} mirror zOrder={1} />
```
**Confirm occlusion** if it ever regresses:
```bash
adb shell dumpsys SurfaceFlinger --list | grep -i -E "rtcview|webrtc"
# local layer should NOT be under the full-screen remote layer
```

### 4.3 Remote video missing when the other side joined first
**Symptoms:** the call connects, audio works, `[LiveKit] Track subscribed: video ...` appears, but the remote area shows the placeholder (person icon + name). No `Remote participant connected` log.

**Cause:** `livekit-client` deliberately does **not** emit `RoomEvent.ParticipantConnected` for participants already in the room at join time. If `remoteUid` is only set in that handler, the UI gate `remoteUid && !muted && remoteVideoTrack` never opens.

**Fix** (`src/shared/useLiveKit.ts`):
- In `TrackSubscribed`, set `setRemoteUid(1)`.
- Right after `room.connect(...)`, seed from room state:
  ```ts
  room.remoteParticipants?.forEach((p) => {
    remoteParticipantRef.current = p;
    setRemoteUid(1);
  });
  ```
This was verified by publishing from a headless Chrome caller *before* the phone joined.

### 4.4 Other gotchas seen
- `VideoTrack` with a raw `LocalVideoTrack`/`RemoteVideoTrack` renders nothing — always pass a TrackReference.
- `localParticipant.switchCamera` does not exist; use `mediaStreamTrack._switchCamera()`.
- Speaker toggle must use LiveKit `AudioSession` APIs, not `expo-audio` route overrides.
- `livekit-client` emits a benign `An event listener wasn't added because it has been added already: bubble` warning from `setMediaStreamTrack` — ignore.
- Web camera/mic capture requires `http://localhost` or HTTPS. Serving the web app over a LAN IP on plain HTTP blocks `getUserMedia`.

## 5. Diagnostic Toolkit

**Rooms / participants / tracks** (run from `server/`; the SDK lives in the monorepo root):
```bash
node -e '
const fs=require("fs");
const env=fs.readFileSync(".env","utf8");
const get=k=>{const m=env.match(new RegExp("^\\s*"+k+"\\s*=\\s*\"?([^\"\\n]*)\"?","m"));return m?m[1].trim():null};
const {RoomServiceClient}=require("../node_modules/livekit-server-sdk");
const svc=new RoomServiceClient("http://31.97.222.250:7880",get("LIVEKIT_API_KEY"),get("LIVEKIT_API_SECRET"));
svc.listRooms().then(async rs=>{
  for(const r of rs){const ps=await svc.listParticipants(r.name);
    console.log(r.name, ps.map(p=>`${p.identity}:state${p.state}:${p.tracks.length}tracks`).join(", "));}
  console.log("rooms:",rs.length);}).catch(e=>console.error(e.message));
'
```

**Phone logs** (watch in one terminal):
```bash
adb logcat -c
adb logcat -v time | grep -E "LiveKit|Negotiation|rn-webrtc|WebRTCView|First frame"
```
Healthy join looks like:
```
[LiveKit] Connected to room: call_...
[LiveKit] Track subscribed: audio <identity>
[LiveKit] Track subscribed: video <identity>
```
`Remote participant connected` only fires for people who join *after* you.

**Server logs:** `ssh root@31.97.222.250 'docker logs --tail 200 livekit-server'`

**Screenshots:** `adb exec-out screencap -p > /tmp/shot.png`

**Networking:** phone must reach the backend (`EXPO_PUBLIC_API_URL` in `app/.env`) and the VPS must expose 7880/TCP + 7881/TCP + 7881-7882 UDP. Changing `.env` requires `npx expo start -c`.

## 6. VPS LiveKit Maintenance

- Container: `livekit-server` (`--network host`, restart `unless-stopped`), config at `/tmp/livekit.yaml`, backup at `/root/livekit-restored.yaml`.
- **Warning:** `/tmp` is not reboot-persistent. Moving the config to `/root/livekit.yaml` (and updating the container mount) is recommended.
- Check version: `docker exec livekit-server /livekit-server --version`
- **Rollback:**
  ```bash
  docker rm -f livekit-server
  docker run -d --name livekit-server --restart unless-stopped --network host \
    -v /tmp/livekit.yaml:/etc/livekit.yaml \
    livekit/livekit-server:v1.8.1 \
    --config /etc/livekit.yaml --node-ip 31.97.222.250
  ```

## 7. Triage Checklist (call not working)

1. Server reachable and on ≥ 1.9.0? (§4.1 curl check)
2. Phone reaching backend? `curl http://<LAN-IP>:3067/api/v1/...` from the phone's network.
3. Tokens issued? Check NestJS logs for `call:initiate` / errors.
4. Device logs: did the room connect, did tracks publish, did `TrackSubscribed` fire?
5. Room inspector: do participants have tracks in `live` state?
6. Remote area placeholder despite subscription → `remoteUid` not set (§4.3).
7. Video invisible but `First frame rendered.` in logs → SurfaceView z-order (§4.2).
8. Both sides silent → audio session/route handling (§2).
