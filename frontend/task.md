# Tasks

- `[ ]` 1. Technical Fixes & Architecture
  - `[ ]` Install packages (`expo-av`, `react-native-confetti-cannon`, `react-native-view-shot`)
  - `[ ]` Update `frontend/src/sound.ts` to use `expo-av` and set up dummy assets
  - `[ ]` Update `frontend/src/api.ts` to precache daily puzzles into `AsyncStorage`
  - `[ ]` Update `frontend/app/wordle.tsx` and `andazebi.tsx` to support Offline Daily Mode
  - `[ ]` Update `backend/src/socket.js` to emit `equippedItems` in `chat-message` and `game-start`

- `[ ]` 2. Gamification & Social Expansion
  - `[ ]` Update `backend/src/models/User.js` with `friends` and `friendRequests`
  - `[ ]` Update `backend/src/controllers/socialController.js` and `socialRoutes.js` (Friend system)
  - `[ ]` Update `frontend/app/stats.tsx` (Guess Distribution Bar Chart)
  - `[ ]` Update `frontend/app/lobby.tsx` (Tap avatar to view profile & add friend)
  - `[ ]` Update `frontend/app/multiplayer.tsx` (Floating quick-emotes)

- `[ ]` 3. UX Polish & Visuals
  - `[ ]` Update `frontend/app/shop.tsx` (Preview Modal)
  - `[ ]` Add `<ConfettiCannon>` to games on win state
  - `[ ]` Add `<ViewShot>` to `wordle.tsx` for branded sharing
