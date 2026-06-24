# Backend API Specification — Dashboard & Linked Pages

> **ThaliCloud Vendor Portal**  
> Generated: 2026-06-20  
> Updated: 2026-06-20 — API Gateway (Spring Cloud Gateway) added  
> Status: Specification only — no implementation done

---

## Scope

| Page | Route | Entry Point |
|---|---|---|
| Dashboard | `/dashboard` | Primary page |
| Today's Orders | `/orders` | Sidebar link + Dashboard "View all →" |
| Meal Plans | `/meal-plans` | Sidebar link + Dashboard "Manage Meal Plans →" |
| Create Meal Plan | `/meal-plans/create` | Meal Plans "+ New Plan" button |
| Manage Days | `/meal-plans/:planId/manage` | Meal Plans plan card "Manage Days" button |

> **Note:** `/orders` has no page component yet but is linked from both the Sidebar ("Today's Orders") and the Dashboard Recent Orders card ("View all →"). APIs for it are derived from the order data already displayed in the Dashboard widget.

---

## Global Conventions

| Convention | Detail |
|---|---|
| **Base URL** | All paths are relative. Vite dev server proxies `/api/*` → `http://localhost:8080` (API Gateway). The gateway routes internally to downstream services. |
| **Authentication** | All endpoints require `Authorization: Bearer <accessToken>`. On 401 the client retries once via `/api/auth/refresh`. |
| **Vendor Scope** | Every endpoint implicitly filters to the authenticated vendor. Vendor ID is always derived from the JWT — never passed as a request parameter. |
| **Dates** | ISO 8601 — date only: `YYYY-MM-DD`, timestamp: `YYYY-MM-DDTHH:mm:ssZ` |
| **Currency** | Monetary values in paise (integer) unless stated otherwise |

**Success envelope:**
```json
{ "data": { ... } }
```

**Error envelope:**
```json
{ "error": { "code": "PLAN_NOT_FOUND", "message": "Meal plan not found." } }
```

---

## Architecture — API Gateway

### Overview

All client requests must pass through the **API Gateway** (Spring Cloud Gateway, port `8080`). Internal microservices are not directly accessible from the frontend.

```
Browser / Frontend (port 3000)
       │
       │  All /api/* requests
       ▼
┌─────────────────────────────────┐
│       gateway-service           │  port 8080
│  Spring Cloud Gateway           │
│  ─ CORS (centralized)           │
│  ─ JWT pre-validation           │
│  ─ Path-based routing           │
└─────────┬───────────────────────┘
          │
   ┌──────┴──────┐
   │             │
   ▼             ▼
auth-service   vendor-service
  (8081)          (8082)
Spring MVC     Spring MVC
```

### Responsibilities

| Responsibility | Implemented |
|---|---|
| Single entry point for all APIs | ✅ Port 8080 |
| Path-based routing to downstream services | ✅ `application.yml` routes |
| Centralized CORS configuration | ✅ `globalcors` in YAML |
| JWT pre-validation (401 before hitting downstream) | ✅ `JwtAuthGatewayFilter` |
| CORS stripped from downstream services | ✅ |
| Future: rate limiting | Planned |
| Future: distributed tracing | Planned |
| Future: request/response logging | Planned |

### Route Table

| Route Prefix | Downstream Service | Port | Notes |
|---|---|---|---|
| `/api/auth/**` | auth-service | 8081 | Login, register, refresh, logout — no JWT check at gateway |
| `/api/vendors/**` | auth-service | 8081 | Legacy vendor profile endpoint in auth-service |
| `/api/vendor/**` | vendor-service | 8082 | New vendor profile + kitchen endpoints (spec Module 1) |

### JWT Pre-Validation Logic

```
Request arrives at gateway
        │
        ├── Method == OPTIONS?  ──────────────────────► Pass through (CORS preflight)
        │
        ├── Path starts with /api/auth/ ?  ──────────► Pass through (auth-service handles auth)
        │
        ├── Path in OPEN_PATHS (/actuator/health)?  ► Pass through
        │
        └── All other paths:
              Authorization header present?
                ├── No  → 401  {"error":{"code":"MISSING_TOKEN",...}}
                └── Yes → token valid + not expired?
                      ├── No  → 401  {"error":{"code":"TOKEN_EXPIRED",...}}
                      └── Yes → forward request to downstream service
```

> **Defense in depth:** Downstream services keep their own Spring Security JWT filter. The gateway is the first check; the service-level check is the second. This allows services to be tested independently with a valid token.

### Gateway Service Structure

```
gateway-service/
├── pom.xml                               Spring Boot 3.2.5 + Spring Cloud 2023.0.3
└── src/main/
    ├── java/com/thalicloud/gateway/
    │   ├── GatewayApplication.java
    │   ├── filter/
    │   │   └── JwtAuthGatewayFilter.java   GlobalFilter, Ordered(-100)
    │   └── service/
    │       ├── JwtService.java
    │       └── impl/JwtServiceImpl.java    isTokenValid(token) — validates signature + expiry
    └── resources/
        └── application.yml               Port 8080, globalcors, routes, jwt.secret
```

### Startup Order

Services must start in this order (shared H2 file database):

1. **auth-service** (port 8081) — creates the shared H2 schema (`ddl-auto: create`)
2. **vendor-service** (port 8082) — reads the schema (`ddl-auto: none`)
3. **gateway-service** (port 8080) — no database, starts anytime after step 1 and 2

### CORS Configuration (Gateway)

| Setting | Value |
|---|---|
| Allowed Origins | `http://localhost:3000`, `http://localhost:5173` |
| Allowed Methods | `GET POST PUT PATCH DELETE OPTIONS` |
| Allowed Headers | `*` |
| Allow Credentials | `true` |
| Max Age | `3600` seconds |

---

## Module 1 — Vendor Profile

### API 1.1 — Get Current Vendor Profile

| Field | Value |
|---|---|
| **Module** | Vendor |
| **Feature** | Profile |
| **Purpose** | Provides the authenticated vendor's name, email, and avatar initial displayed in the Sidebar user section and in all page top-bar labels ("Neelam", "N" avatar). |
| **Method** | `GET` |
| **Endpoint** | `/api/vendor/me` |
| **Auth** | Required — vendor-scoped |

**Request Parameters:** None  
**Request Body:** None

**Response:**
```json
{
  "data": {
    "vendorId": "vendor-123",
    "name": "Neelam",
    "email": "vendor@example.com",
    "avatarInitial": "N"
  }
}
```

| Requirement | Detail |
|---|---|
| Pagination | No |
| Sorting | No |
| Filtering | No |
| Search | No |

---

### API 1.2 — Get Kitchen Details

| Field | Value |
|---|---|
| **Module** | Vendor |
| **Feature** | Kitchen Profile |
| **Purpose** | Powers the "Kitchen Details" card on the Dashboard (kitchen name, owner, phone, address, hours) and the kitchen name + hours in the Sidebar kitchen card. |
| **Method** | `GET` |
| **Endpoint** | `/api/vendor/kitchen` |
| **Auth** | Required — vendor-scoped |

**Request Parameters:** None  
**Request Body:** None

**Response:**
```json
{
  "data": {
    "kitchenName": "Amma's Kitchen",
    "ownerName": "Neelam",
    "phone": "8362382393",
    "address": "Gaikwad Nagar, Pune",
    "city": "Pune",
    "operatingHours": {
      "open": "09:00",
      "close": "21:00"
    }
  }
}
```

| Requirement | Detail |
|---|---|
| Pagination | No |
| Sorting | No |
| Filtering | No |
| Search | No |

---

## Module 2 — Dashboard

### API 2.1 — Get Dashboard Summary Stats

| Field | Value |
|---|---|
| **Module** | Dashboard |
| **Feature** | Summary Statistics |
| **Purpose** | Powers the four stat cards on the Dashboard: Orders Today (count + delta from yesterday), Revenue Today (total amount + order count), Active Meal Plan (name + days remaining), and Avg. Rating (value + review count). |
| **Method** | `GET` |
| **Endpoint** | `/api/dashboard/summary` |
| **Auth** | Required — vendor-scoped |

**Request Parameters:** None  
**Request Body:** None

**Response:**
```json
{
  "data": {
    "ordersToday": {
      "count": 28,
      "deltaFromYesterday": 4
    },
    "revenueToday": {
      "amountInPaise": 384000,
      "orderCount": 28
    },
    "activeMealPlan": {
      "planId": "plan-1",
      "name": "June Plan",
      "daysRemaining": 21
    },
    "avgRating": {
      "value": 4.7,
      "reviewCount": 124
    }
  }
}
```

> - `activeMealPlan` is `null` if no plan is currently active.
> - "Today" is evaluated server-side using the vendor's registered timezone.
> - `deltaFromYesterday` is positive when today's count exceeds yesterday's.

| Requirement | Detail |
|---|---|
| Pagination | No |
| Sorting | No |
| Filtering | No |
| Search | No |

---

## Module 3 — Orders

### API 3.1 — Get Recent Orders (Dashboard Widget)

| Field | Value |
|---|---|
| **Module** | Orders |
| **Feature** | Recent Orders Widget |
| **Purpose** | Populates the "Recent Orders" card on the Dashboard. Columns shown: Order ID, Customer, Meal Type, Amount, Status. Fixed to the most recent N orders. |
| **Method** | `GET` |
| **Endpoint** | `/api/orders/recent` |
| **Auth** | Required — vendor-scoped |

**Request Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | integer | `5` | Number of orders to return. Max `10`. |

**Request Body:** None

**Response:**
```json
{
  "data": [
    {
      "orderId": "ORD-008",
      "customerName": "Priya Desai",
      "mealType": "Standard Veg",
      "amountInPaise": 29000,
      "status": "Delivered",
      "createdAt": "2026-06-20T08:30:00Z"
    },
    {
      "orderId": "ORD-007",
      "customerName": "Amit Kulkarni",
      "mealType": "Mini Veg",
      "amountInPaise": 13000,
      "status": "Ready",
      "createdAt": "2026-06-20T08:15:00Z"
    }
  ]
}
```

**Status Enum:** `Pending` | `Preparing` | `Ready` | `Delivered`

| Requirement | Detail |
|---|---|
| Pagination | No — fixed limit, not paginated |
| Sorting | Fixed — descending by `createdAt` |
| Filtering | None |
| Search | None |

---

### API 3.2 — List Orders (Today's Orders Page)

| Field | Value |
|---|---|
| **Module** | Orders |
| **Feature** | Today's Orders Full List |
| **Purpose** | Powers the `/orders` page (linked from Sidebar "Today's Orders" and Dashboard "View all →"). Displays the complete paginated orders list for a given date with status filtering and search. |
| **Method** | `GET` |
| **Endpoint** | `/api/orders` |
| **Auth** | Required — vendor-scoped |

**Request Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `date` | string `YYYY-MM-DD` | today | Filter by delivery/order date |
| `status` | string (enum, optional) | all | Filter by order status |
| `search` | string (optional) | — | Full-text search on customer name or order ID |
| `page` | integer | `1` | Page number (1-based) |
| `pageSize` | integer | `20` | Items per page. Max `100`. |
| `sortBy` | string | `createdAt` | `createdAt` \| `amount` \| `status` \| `customerName` |
| `sortOrder` | string | `desc` | `asc` \| `desc` |

**Request Body:** None

**Response:**
```json
{
  "data": {
    "orders": [
      {
        "orderId": "ORD-008",
        "customerName": "Priya Desai",
        "mealType": "Standard Veg",
        "amountInPaise": 29000,
        "status": "Delivered",
        "createdAt": "2026-06-20T08:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "totalCount": 28,
      "totalPages": 2
    }
  }
}
```

**Status Enum:** `Pending` | `Preparing` | `Ready` | `Delivered`

| Requirement | Detail |
|---|---|
| Pagination | Required — `page` + `pageSize` |
| Sorting | Required — `sortBy` + `sortOrder` |
| Filtering | By `date`, by `status` |
| Search | By customer name or order ID via `search` param |

---

### API 3.3 — Update Order Status

| Field | Value |
|---|---|
| **Module** | Orders |
| **Feature** | Order Status Update |
| **Purpose** | Allows the vendor to advance an order through its lifecycle (Pending → Preparing → Ready → Delivered) from the Orders page. The status badge on each order row implies this action. |
| **Method** | `PATCH` |
| **Endpoint** | `/api/orders/:orderId/status` |
| **Auth** | Required — vendor-scoped |

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `orderId` | string | The unique order identifier |

**Request Body:**
```json
{
  "status": "Ready"
}
```

**Response:**
```json
{
  "data": {
    "orderId": "ORD-008",
    "status": "Ready",
    "updatedAt": "2026-06-20T09:00:00Z"
  }
}
```

| Requirement | Detail |
|---|---|
| Pagination | No |
| Sorting | No |
| Filtering | No |
| Search | No |

---

## Module 4 — Meal Plans

### API 4.1 — List Meal Plans

| Field | Value |
|---|---|
| **Module** | Meal Plans |
| **Feature** | Plan List |
| **Purpose** | Populates the plan list on `MealPlansPage`. Each plan card shows: name, Active/Inactive badge, date range, total days, days completed, and progress bar. |
| **Method** | `GET` |
| **Endpoint** | `/api/meal-plans` |
| **Auth** | Required — vendor-scoped |

**Request Query Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `isActive` | boolean (optional) | all | Filter to only active or only inactive plans |

**Request Body:** None

**Response:**
```json
{
  "data": [
    {
      "planId": "plan-1",
      "name": "June Monthly Plan",
      "startDate": "2026-06-01",
      "endDate": "2026-06-30",
      "totalDays": 30,
      "daysCompleted": 8,
      "isActive": true,
      "mealTypeIds": ["standard", "mini"]
    }
  ]
}
```

| Requirement | Detail |
|---|---|
| Pagination | No — vendors expected to have a small number of plans |
| Sorting | Fixed — descending by `startDate` |
| Filtering | Optional `isActive` boolean |
| Search | No |

---

### API 4.2 — Create Meal Plan

| Field | Value |
|---|---|
| **Module** | Meal Plans |
| **Feature** | Plan Creation |
| **Purpose** | Called on form submit in `CreateMealPlanPage`. Creates a new meal plan with a name, date range, and the selected meal types that will be enabled for each day. |
| **Method** | `POST` |
| **Endpoint** | `/api/meal-plans` |
| **Auth** | Required — vendor-scoped |

**Request Body:**
```json
{
  "name": "July Monthly Plan",
  "startDate": "2026-07-01",
  "endDate": "2026-07-31",
  "mealTypeIds": ["standard", "mini"]
}
```

**Validation Rules:**

| Field | Rule |
|---|---|
| `name` | Required, non-empty string, max 100 characters |
| `startDate` | Required, ISO 8601 date, must not be in the past |
| `endDate` | Required, ISO 8601 date, must be strictly after `startDate` |
| `mealTypeIds` | Required array, minimum 1 item, all values must be valid meal type IDs |

**Response `201 Created`:**
```json
{
  "data": {
    "planId": "plan-2",
    "name": "July Monthly Plan",
    "startDate": "2026-07-01",
    "endDate": "2026-07-31",
    "totalDays": 31,
    "daysCompleted": 0,
    "isActive": false,
    "mealTypeIds": ["standard", "mini"]
  }
}
```

| Requirement | Detail |
|---|---|
| Pagination | No |
| Sorting | No |
| Filtering | No |
| Search | No |

---

### API 4.3 — Get Meal Plan Detail

| Field | Value |
|---|---|
| **Module** | Meal Plans |
| **Feature** | Plan Detail |
| **Purpose** | Loads a single plan's metadata in `ManageDaysPage`. Required to display the plan title and date range, and to generate the day accordion list client-side from `startDate`/`endDate`. |
| **Method** | `GET` |
| **Endpoint** | `/api/meal-plans/:planId` |
| **Auth** | Required — vendor-scoped |

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `planId` | string | The plan identifier |

**Request Body:** None

**Response:**
```json
{
  "data": {
    "planId": "plan-1",
    "name": "June Monthly Plan",
    "startDate": "2026-06-01",
    "endDate": "2026-06-30",
    "totalDays": 30,
    "daysCompleted": 8,
    "isActive": true,
    "mealTypeIds": ["standard", "mini"]
  }
}
```

| Requirement | Detail |
|---|---|
| Pagination | No |
| Sorting | No |
| Filtering | No |
| Search | No |

---

### API 4.4 — Toggle Meal Plan Active Status

| Field | Value |
|---|---|
| **Module** | Meal Plans |
| **Feature** | Activate / Deactivate Plan |
| **Purpose** | Called when the vendor clicks "Activate" or "Deactivate" on a plan card in `MealPlansPage`. Controls which plan is visible to customers. |
| **Method** | `PATCH` |
| **Endpoint** | `/api/meal-plans/:planId/status` |
| **Auth** | Required — vendor-scoped |

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `planId` | string | The plan identifier |

**Request Body:**
```json
{
  "isActive": true
}
```

**Response:**
```json
{
  "data": {
    "planId": "plan-1",
    "isActive": true,
    "updatedAt": "2026-06-20T10:00:00Z"
  }
}
```

> **Business Rule:** The backend must enforce a single-active-plan constraint — when activating a plan, any currently active plan for the same vendor must be automatically deactivated.

| Requirement | Detail |
|---|---|
| Pagination | No |
| Sorting | No |
| Filtering | No |
| Search | No |

---

### API 4.5 — Delete Meal Plan

| Field | Value |
|---|---|
| **Module** | Meal Plans |
| **Feature** | Plan Deletion |
| **Purpose** | Called when the vendor clicks the 🗑️ button on a plan card in `MealPlansPage`. |
| **Method** | `DELETE` |
| **Endpoint** | `/api/meal-plans/:planId` |
| **Auth** | Required — vendor-scoped |

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `planId` | string | The plan identifier |

**Request Body:** None  
**Response:** `204 No Content`

> **Business Rule:** Active plans should either be blocked from deletion or auto-deactivated before removal — backend must enforce this.

| Requirement | Detail |
|---|---|
| Pagination | No |
| Sorting | No |
| Filtering | No |
| Search | No |

---

## Module 5 — Meal Plan Day Menus

### API 5.1 — Get Day Menus for a Plan

| Field | Value |
|---|---|
| **Module** | Meal Plan Day Menus |
| **Feature** | Day Menu List |
| **Purpose** | Loads all saved lunch and dinner menus for every day in a plan on `ManageDaysPage`. The client uses this to pre-populate the slot forms with the vendor's previously saved menu instead of default values. |
| **Method** | `GET` |
| **Endpoint** | `/api/meal-plans/:planId/days` |
| **Auth** | Required — vendor-scoped |

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `planId` | string | The plan identifier |

**Request Body:** None

**Response:**
```json
{
  "data": [
    {
      "date": "2026-06-01",
      "lunch": {
        "vegetables": ["Paneer Butter Masala", "Aloo Gobi"],
        "chapatiCount": 4,
        "riceType": "Onion Rice",
        "riceCount": 1,
        "dal": "Dal Tadka"
      },
      "dinner": {
        "vegetables": ["Bhindi Masala", "Matar Paneer"],
        "chapatiCount": 3,
        "riceType": "Jeera Rice",
        "riceCount": 1,
        "dal": "Dal Makhani"
      }
    }
  ]
}
```

> - Days that have never been explicitly saved should return the system default menu values so the client has a consistent starting state.
> - Response contains one entry per calendar day in the plan's `startDate`–`endDate` range.

| Requirement | Detail |
|---|---|
| Pagination | No — all days returned together; maximum ~365 entries |
| Sorting | Fixed — ascending by `date` |
| Filtering | No |
| Search | No |

---

### API 5.2 — Save Day Slot Menu

| Field | Value |
|---|---|
| **Module** | Meal Plan Day Menus |
| **Feature** | Save Slot Menu |
| **Purpose** | Called when the vendor clicks "Save Menu" for a specific day's Lunch or Dinner slot in `ManageDaysPage`. Persists the menu for that day and slot combination. |
| **Method** | `PUT` |
| **Endpoint** | `/api/meal-plans/:planId/days/:date/slots/:slot` |
| **Auth** | Required — vendor-scoped |

**Path Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `planId` | string | The plan identifier |
| `date` | string `YYYY-MM-DD` | The specific day to save |
| `slot` | string (enum) | `lunch` \| `dinner` |

**Request Body:**
```json
{
  "vegetables": ["Paneer Butter Masala", "Aloo Gobi"],
  "chapatiCount": 4,
  "riceType": "Onion Rice",
  "riceCount": 1,
  "dal": "Dal Tadka"
}
```

**Validation Rules:**

| Field | Rule |
|---|---|
| `vegetables` | Array, 1–5 items, each value must exist in the configured vegetable options list |
| `chapatiCount` | Integer, min `1`, max `8` |
| `riceType` | String, must be a valid rice type option |
| `riceCount` | Integer, min `0`, max `4` |
| `dal` | String, must be a valid dal option |
| `date` (path) | Must fall within the plan's `startDate`–`endDate` range |

**Response `200 OK`:**
```json
{
  "data": {
    "planId": "plan-1",
    "date": "2026-06-01",
    "slot": "lunch",
    "menu": {
      "vegetables": ["Paneer Butter Masala", "Aloo Gobi"],
      "chapatiCount": 4,
      "riceType": "Onion Rice",
      "riceCount": 1,
      "dal": "Dal Tadka"
    },
    "savedAt": "2026-06-20T11:00:00Z"
  }
}
```

| Requirement | Detail |
|---|---|
| Pagination | No |
| Sorting | No |
| Filtering | No |
| Search | No |

---

## Module 6 — Meal Types (Catalog)

### API 6.1 — List Meal Types

| Field | Value |
|---|---|
| **Module** | Meal Types |
| **Feature** | Meal Type Catalog |
| **Purpose** | Provides the available meal type catalog used in two places: the informational type cards on `MealPlansPage` (name, price, description, icon) and the checkbox list on `CreateMealPlanPage` for selecting which meal types are enabled per plan. |
| **Method** | `GET` |
| **Endpoint** | `/api/mealTypes` |
| **Auth** | Required |

**Request Parameters:** None  
**Request Body:** None

**Response:**
```json
{
  "data": [
    {
      "id": "standard",
      "name": "Standard Veg Thali",
      "price": 160,
      "description": "3–4 chapatis, dry sabji, gravy sabji, dal, rice, papad, salad, sweet.",
      "icon": "🍱"
    },
    {
      "id": "mini",
      "name": "Mini Veg Thali",
      "price": 100,
      "description": "2 chapatis, 1 sabji, dal, rice, sweet.",
      "icon": "🥘"
    }
  ]
}
```

> This is a global catalog, not vendor-specific. Safe to cache on the client.

| Requirement | Detail |
|---|---|
| Pagination | No |
| Sorting | No |
| Filtering | No |
| Search | No |

---

## Module 7 — Menu Configuration / Lookups

### API 7.1 — Get Menu Configuration Options

| Field | Value |
|---|---|
| **Module** | Menu Configuration |
| **Feature** | Slot Form Dropdown Options |
| **Purpose** | Returns all dropdown option lists and numeric constraints used in the `ManageDaysPage` day slot forms: vegetable options, dal types, rice types, and the min/max bounds for chapati and rice quantities. Currently hardcoded on the frontend — serving from the backend allows admin-driven updates without frontend deploys. |
| **Method** | `GET` |
| **Endpoint** | `/api/menu-options` |
| **Auth** | Required |

**Request Parameters:** None  
**Request Body:** None

**Response:**
```json
{
  "data": {
    "vegetables": [
      "Paneer Butter Masala",
      "Aloo Gobi",
      "Palak Paneer",
      "Bhindi Masala",
      "Chana Masala",
      "Mixed Veg",
      "Matar Paneer",
      "Baingan Bharta",
      "Jeera Aloo",
      "Rajma",
      "Kadai Paneer",
      "Mushroom Masala"
    ],
    "dalOptions": [
      "Dal Tadka",
      "Dal Makhani",
      "Dal Fry",
      "Chana Dal",
      "Moong Dal"
    ],
    "riceOptions": [
      "Onion Rice",
      "Jeera Rice",
      "Plain Rice",
      "Veg Pulao"
    ],
    "constraints": {
      "maxVegetables": 5,
      "chapatiMin": 1,
      "chapatiMax": 8,
      "riceMin": 0,
      "riceMax": 4
    }
  }
}
```

> This is configuration data that rarely changes. The client may cache this response aggressively (e.g., 1 hour or until session end).

| Requirement | Detail |
|---|---|
| Pagination | No |
| Sorting | No |
| Filtering | No |
| Search | No |

---

## Dashboard Widgets — Data Source Map

| Widget / Element | Source API |
|---|---|
| Top-bar vendor name + avatar initial | `GET /api/vendor/me` |
| Sidebar kitchen name + hours | `GET /api/vendor/kitchen` |
| Sidebar user name + email | `GET /api/vendor/me` |
| Stat card — Orders Today | `GET /api/dashboard/summary` → `ordersToday` |
| Stat card — Revenue Today | `GET /api/dashboard/summary` → `revenueToday` |
| Stat card — Active Meal Plan | `GET /api/dashboard/summary` → `activeMealPlan` |
| Stat card — Avg. Rating | `GET /api/dashboard/summary` → `avgRating` |
| Recent Orders card (table) | `GET /api/orders/recent?limit=5` |
| Kitchen Details card | `GET /api/vendor/kitchen` |

---

## Status Enums

### Order Status

| Value | Meaning |
|---|---|
| `Pending` | Order received, not yet started |
| `Preparing` | Kitchen is preparing the order |
| `Ready` | Order is ready for pickup / delivery |
| `Delivered` | Order has been delivered |

### Meal Plan Status

| Value | Meaning |
|---|---|
| `isActive: true` | Plan is live and visible to customers |
| `isActive: false` | Plan is inactive / draft |

### Meal Slot

| Value | Meaning |
|---|---|
| `lunch` | Daytime meal slot ☀️ |
| `dinner` | Evening meal slot 🌙 |

---

## Relationships Between Pages

```
DashboardPage (/dashboard)
  │
  ├── stat cards              ◄── GET /api/dashboard/summary
  ├── recent orders table     ◄── GET /api/orders/recent
  ├── kitchen details card    ◄── GET /api/vendor/kitchen
  │
  ├── "View all →"            ──► /orders
  │     │
  │     └── orders list       ◄── GET /api/orders
  │           ├── filter by date, status, search
  │           └── update status ──► PATCH /api/orders/:orderId/status
  │
  └── "Manage Meal Plans →"   ──► /meal-plans
        │
        └── MealPlansPage
              │
              ├── meal type cards    ◄── GET /api/mealTypes
              ├── plans list         ◄── GET /api/meal-plans
              ├── activate plan          PATCH /api/meal-plans/:id/status
              ├── deactivate plan        PATCH /api/meal-plans/:id/status
              ├── delete plan            DELETE /api/meal-plans/:id
              │
              ├── "+ New Plan"       ──► /meal-plans/create
              │     │
              │     └── form submit      POST /api/meal-plans
              │
              └── "Manage Days"     ──► /meal-plans/:planId/manage
                    │
                    └── ManageDaysPage
                          │
                          ├── plan header    ◄── GET /api/meal-plans/:planId
                          ├── day menus      ◄── GET /api/meal-plans/:planId/days
                          ├── slot dropdowns ◄── GET /api/menu-options
                          └── save slot menu     PUT /api/meal-plans/:planId/days/:date/slots/:slot
```

---

## Reusable APIs

| API | Reused By |
|---|---|
| `GET /api/vendor/me` | Dashboard top bar, all page top bars, Sidebar user section |
| `GET /api/vendor/kitchen` | Dashboard "Kitchen Details" card, Sidebar kitchen card |
| `GET /api/mealTypes` | `MealPlansPage` (display cards), `CreateMealPlanPage` (checkboxes) |
| `GET /api/menu-options` | `ManageDaysPage` all slot forms — vegetables, dal, rice dropdowns + constraints |
| `GET /api/dashboard/summary` → `activeMealPlan` | Stat card; also useful for Sidebar if it ever shows the active plan name |

---

## Complete API Index

| # | Method | Endpoint | Module | Feature |
|---|---|---|---|---|
| 1.1 | `GET` | `/api/vendor/me` | Vendor | Current vendor profile |
| 1.2 | `GET` | `/api/vendor/kitchen` | Vendor | Kitchen details |
| 2.1 | `GET` | `/api/dashboard/summary` | Dashboard | Summary stat cards |
| 3.1 | `GET` | `/api/orders/recent` | Orders | Recent orders widget |
| 3.2 | `GET` | `/api/orders` | Orders | Today's orders full list |
| 3.3 | `PATCH` | `/api/orders/:orderId/status` | Orders | Update order status |
| 4.1 | `GET` | `/api/meal-plans` | Meal Plans | List plans |
| 4.2 | `POST` | `/api/meal-plans` | Meal Plans | Create plan |
| 4.3 | `GET` | `/api/meal-plans/:planId` | Meal Plans | Get plan detail |
| 4.4 | `PATCH` | `/api/meal-plans/:planId/status` | Meal Plans | Toggle active status |
| 4.5 | `DELETE` | `/api/meal-plans/:planId` | Meal Plans | Delete plan |
| 5.1 | `GET` | `/api/meal-plans/:planId/days` | Day Menus | Get all day menus |
| 5.2 | `PUT` | `/api/meal-plans/:planId/days/:date/slots/:slot` | Day Menus | Save slot menu |
| 6.1 | `GET` | `/api/mealTypes` | Meal Types | Meal type catalog |
| 7.1 | `GET` | `/api/menu-options` | Menu Config | Slot form dropdown options |

**Total: 15 endpoints across 7 modules**

---

> **Important:** No implementation has been done. This document only describes what the backend must provide. No controllers, services, entities, repositories, or database schema have been generated or modified. Wait for further instructions before implementing anything.
