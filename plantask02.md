# Implementation Plan: Phase 0 & 0.5 — Code Fixes

## Overview
Fix critical backend blockers and frontend inconsistencies before infrastructure work. All tasks are independent and can be done in parallel.

---

## Phase 0 — Backend Code Fixes (5 tasks)

### 1. Add `.env` to `.dockerignore`
**File:** `backend/.dockerignore:12`
**Change:** Uncomment line 12, add `.env` and `.env.*`
```dockerignore
# Before:
#.env removed for now

# After:
.env
.env.*
```
**Why:** Prevents secrets from being baked into Docker image layers via `COPY . .`

---

### 2. Add `trust proxy` to Express app
**File:** `backend/src/app.js:25`
**Change:** Add after `const app = express();`
```javascript
app.set('trust proxy', 1);
```
**Why:** Behind Railway/nginx/proxy, all requests appear from one IP → rate limiter becomes one global bucket for all farmers + ESP32s

---

### 3. WeightStandard fallback in classificationService
**File:** `backend/src/services/classificationService.js`
**Current:** ML down → hard throw → 500 error, measurement rejected
**New:** Catch ML error → query `prisma.weightStandard.findMany()` for breed/sex/age range → compare `weight_kg` to min/max → return `{ label, confidence: 0.7 }`

**Implementation:**
```javascript
const mlClient = require('../lib/mlClient');
const prisma = require('../lib/prisma');

const classify = async (breed, sex, ageMonths, weightKg) => {
  try {
    const mlResult = await mlClient.predictWeightStatus(breed, sex, ageMonths, weightKg);
    return mlResult;
  } catch (err) {
    console.error('ML classification failed, falling back to WeightStandard:', err.message);
    
    // Fallback to WeightStandard table
    const standards = await prisma.weightStandard.findMany({
      where: {
        breed,
        sex,
        ageMinMonths: { lte: ageMonths },
        ageMaxMonths: { gte: ageMonths }
      }
    });
    
    if (standards.length === 0) {
      throw new Error('Classification failed: ML unavailable and no WeightStandard match');
    }
    
    const standard = standards[0];
    const label = weightKg < standard.minHealthyWeight ? 'underweight' 
                 : weightKg > standard.maxHealthyWeight ? 'overweight' 
                 : 'normal';
    
    return { label, confidence: 0.7 };
  }
};

module.exports = { classify };
```

---

### 4. Create ML_Train Dockerfile
**File:** `ML_Train/Dockerfile` (new)
```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install curl for healthchecks
RUN apt-get update -y && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source and train model (bakes model.pkl at build time)
COPY . .
RUN python train.py

EXPOSE 5000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "5000"]
```

---

### 5. Add ML service to docker-compose.yml
**File:** `docker-compose.yml` (root)

**Changes:**
- Add `ml_service` service
- Update backend `ML_SERVICE_URL` to `ml_service:5000`
- Add `depends_on: ml_service` to backend

```yaml
services:
  postgres:
    # ... existing config unchanged

  ml_service:
    build:
      context: ./ML_Train
      dockerfile: Dockerfile
    container_name: agro_scale_ml
    restart: always
    ports:
      - "5000:5000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5000/docs"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    # ... existing config
    environment:
      PORT: 3002
      DATABASE_URL: postgresql://agro_user:agro_password@postgres:5432/agro_scale_db?schema=public
      ML_SERVICE_URL: http://ml_service:5000    # CHANGED from host.docker.internal:5000
    depends_on:
      postgres:
        condition: service_healthy
      ml_service:
        condition: service_healthy

volumes:
  postgres_data:
```

---

## Phase 0.5 — Frontend Fixes (3 tasks)

### 6. Remove dead device polling
**File:** `frontend/src/App.tsx:81-140`
**Action:** Remove the entire `useEffect` block (lines 81-125) that polls `GET /api/devices` and the `handleRemoveDevice` function (lines 127-140) that calls `DELETE /api/devices/${id}`

**Why:** Backend exposes `/api/v1/iot/*` routes — no `/api/devices` endpoint exists. Polling silently 404s every 3s.

**Alternative (if device management needed later):** Create real `/api/v1/devices` backend endpoint with CRUD.

---

### 7. Units mismatch decision
**Files:** `frontend/src/pages/Home.tsx`, `frontend/src/pages/Devices.tsx`

**Current State:** Backend stores **kg** (`weight_kg` field). Frontend hardcodes **lbs** everywhere.

**Options:**
| Option | Description | Effort |
|--------|-------------|--------|
| **A) Display kg everywhere** | Replace all "lbs" labels with "kg", remove conversion logic | Low |
| **B) Add kg/lbs toggle** | Settings toggle + conversion utility + persist preference | Medium |

**Recommendation:** **Option A** — simpler, consistent with backend, no conversion bugs.

**Changes needed:**
- `Home.tsx`: Line 88 "1,180 lbs" → "535 kg", line 227 "lbs" → "kg", weigh-in modal "Weight (lbs)" → "Weight (kg)"
- `Devices.tsx`: Lines 96, 99, 227, 228 — split `currentReading` string, replace "lbs" with "kg"
- `i18n.ts`: Update translation keys `herd.table.weight` and `devices.currentReading` from "lbs" to "kg" in both `en` and `km`

---

### 8. Connect Home.tsx to real API
**Files:** 
- New: `frontend/src/services/dashboardService.ts`
- Modify: `frontend/src/pages/Home.tsx`

**New Service (`dashboardService.ts`):**
```typescript
import { useAuth } from '../hooks/useAuth';

const API_BASE = '/api/v1/dashboard';

export const dashboardService = {
  async getSummary() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch summary');
    return res.json();
  },

  async getTrends() {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/trends`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) throw new Error('Failed to fetch trends');
    return res.json();
  }
};
```

**Home.tsx Changes:**
- Remove all hardcoded mock data (`allWeightData`, `recentWeighIns`)
- Add `useEffect` to call `dashboardService.getSummary()` and `dashboardService.getTrends()` on mount
- Replace static values with API response data
- Handle loading/error states

---

## Decisions Required Before Phase 0.5

| # | Decision | Options | Recommended |
|---|----------|---------|-------------|
| 6 | Device polling | A) Remove entirely<br>B) Create `/api/v1/devices` backend endpoint | **A** |
| 7 | Units display | A) kg everywhere<br>B) kg/lbs toggle | **A** |
| 8 | Dashboard updates | A) 3-10s polling<br>B) SSE/WebSocket push | **A** (for now) |

---

## Execution Order

```
Phase 0 (can start immediately, no dependencies):
  ├─ 1. backend/.dockerignore
  ├─ 2. backend/src/app.js
  ├─ 3. backend/src/services/classificationService.js
  ├─ 4. ML_Train/Dockerfile (new)
  └─ 5. docker-compose.yml

Phase 0.5 (after decisions confirmed):
  ├─ 6. frontend/src/App.tsx (remove polling)
  ├─ 7. frontend/src/pages/*.tsx + i18n.ts (units)
  └─ 8. frontend/src/services/dashboardService.ts (new) + Home.tsx
```

---

## File Touch Summary

**Backend (4 files):**
- `backend/.dockerignore` — 2 lines
- `backend/src/app.js` — 1 line
- `backend/src/services/classificationService.js` — ~25 lines rewrite
- `docker-compose.yml` — +15 lines

**Frontend (4-5 files):**
- `frontend/src/App.tsx` — -60 lines
- `frontend/src/pages/Home.tsx` — major rewrite (mock → API)
- `frontend/src/pages/Devices.tsx` — ~10 lines (unit labels)
- `frontend/src/i18n.ts` — 4 translation keys (en + km)
- `frontend/src/services/dashboardService.ts` — **new** (~35 lines)

**ML/Infra (1 new file):**
- `ML_Train/Dockerfile` — ~15 lines

---

## Next Steps

1. **Confirm 3 decisions** above (polling removal, units, dashboard polling)
2. **Execute Phase 0** — all 5 backend tasks in parallel
3. **Execute Phase 0.5** — all 3 frontend tasks in parallel
4. **Verify** with `docker compose up -d` and test endpoints