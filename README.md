# Smart College Canteen: AI-Powered Food Pre-Booking, Queue Optimization & Quick Pickup Platform 🚀

Transforming the basic university canteen ordering experience into a fully optimized, predictive, and intelligent food operations ecosystem for campuses.

---

## 🏆 Project Position & Core USP
* **Recommended Project Positioning:** The project is positioned as an **AI-powered campus food operations platform** that predicts demand, optimizes kitchen preparation, dynamically controls queues and pickup capacity, reduces food waste, and enables students to collect meals within very short breaks (rather than a simple food ordering application).
* **Core USP:** **Predict → Plan → Pre-Book → Prepare → Optimize → Notify → Scan → Pickup → Analyze → Learn**

---

## 📖 1. Project Overview & Problem Statement

### 1.1 Overview
Smart College Canteen is a digital campus food operations platform designed to solve the major problems students and canteen staff face during short college breaks. Students can pre-book food, select an intelligent pickup slot, pay digitally, receive a QR/order token, and collect prepared food through a dedicated fast-pickup counter. The platform goes beyond basic food ordering by using demand prediction, queue intelligence, inventory management, kitchen optimization, analytics, sustainability tracking, and personalized recommendations.

The long-term vision is to create an intelligent food ecosystem that can predict demand before the rush, prepare food at the right time, distribute orders efficiently, reduce food waste, and continuously improve operations using data.

### 1.2 Problem Statement
* Long queues during 10–15 minute college breaks.
* Students lose valuable break time waiting to order and pay.
* Food items may become unavailable before students reach the counter.
* Large numbers of simultaneous orders create kitchen and counter delays.
* Fixed pickup slots may become overloaded.
* Canteen staff often lack accurate demand forecasts.
* Manual stock management can result in shortages or excess preparation.
* Food waste is difficult to measure and control.
* Students do not have visibility into order status or expected waiting time.
* College management lacks centralized analytics for canteen performance.

### 1.3 Proposed Solution
The system allows students to order before their break, choose or receive a recommended pickup slot, make payment, and collect food using a QR code or order number. Canteen staff receive orders in advance through a kitchen dashboard and prepare them according to pickup time and kitchen workload. Administrators receive operational, financial, inventory, demand, and sustainability analytics.

**Core flow:** Student → Food Selection → Smart Slot → Confirmation → Payment → Kitchen Preparation → Ready → QR Verification → Quick Pickup → Analytics

### 1.4 Main Objectives
* Reduce student waiting and pickup time.
* Prevent overcrowding at the canteen.
* Improve kitchen planning and order preparation.
* Provide real-time food availability.
* Optimize pickup capacity dynamically.
* Reduce food waste and unnecessary preparation.
* Improve inventory accuracy.
* Provide secure digital payments.
* Give management actionable analytics.
* Create a scalable multi-canteen campus platform.

---

## 🧭 2. Phase-Wise Implementation Roadmap & Status

Below is the complete requirements breakdown sorted into implementation phases with their status markers:

### 🟢 Phase 1: Core Authentication, Ordering & Multi-Canteen (95% Complete)
*Secure login, multi-canteen switching, menu browsing, ordering, and real-time order tracking.*

- **[x] Secure Authentication & User Roles (Section 5.1 & 6)**
  - OTP simulation and JWT token generation based on mobile numbers ([auth.py](file:///c:/abhivorn/food_app/backend-fastapi/routers/auth.py)).
  - Frontend login and automatic role-based landing redirection ([LoginOTP.jsx](file:///c:/abhivorn/food_app/frontend/src/LoginOTP.jsx)).
- **[x] Multi-Canteen Switcher (Section 16)**
  - Support for multiple canteens (Main Cafeteria, hostel, food court) ([MultiCanteen.jsx](file:///c:/abhivorn/food_app/frontend/src/MultiCanteen.jsx)).
- **[x] Menu Browsing (Section 6)**
  - Real-time stock quantity counts, categorizations, and availability badges (Available / Sold Out).
- **[x] Pre-Booking Order Placement (Section 6)**
  - Cart item aggregation, simulated card details submission, checkout, and 6-digit code generation ([Menu.jsx](file:///c:/abhivorn/food_app/frontend/src/Menu.jsx)).
- **[x] Real-time Order Tracking (Section 6)**
  - Live tracking layout showing `pending` / `preparing` / `ready` statuses listening to socket triggers ([OrderTracker.jsx](file:///c:/abhivorn/food_app/frontend/src/OrderTracker.jsx)).

---

### 🟡 Phase 2: Kitchen Display (KDS), Notifications & Verification (95% Complete)
*Kitchen workflow optimizations, staff counters, notifications, and secure pickup validation.*

- **[x] Kitchen Display System - KDS (Section 10)**
  - Active incoming orders queue, list of ordered items, and preparation status update controls (Accept → Prepare → Ready) ([KitchenDashboard.jsx](file:///c:/abhivorn/food_app/frontend/src/KitchenDashboard.jsx)).
- **[x] QR/Code Pickup Verification (Section 7)**
  - Verification of 6-digit code tokens at counter, duplicate pickup checks, and actual pickup time logging ([pickup.py](file:///c:/abhivorn/food_app/backend-fastapi/routers/pickup.py#L84-L133)).
- **[x] Notification Dispatch System (Section 15)**
  - WebSocket event relays notifying status updates, low-stock notifications, and preparation milestones ([UserLayout.jsx](file:///c:/abhivorn/food_app/frontend/src/UserLayout.jsx)).
- **[x] Digital Refunds (Section 13)**
  - Cancellation-to-refund logic list view allowing admins to trigger digital order refunds ([AdminRefunds.jsx](file:///c:/abhivorn/food_app/frontend/src/AdminRefunds.jsx)).

---

### 🟡 Phase 3: Smart Pre-Booking, Slots & Campus Wallet (60% Complete)
*Working slot allocations, campus wallet adjustments, and loyalty streaks.*

- **[x] Predefined Pickup Slots & Capacities (Backend) (Section 7)**
  - Retrieving active slots and dynamically recalculating capacity limits depending on live kitchen workloads ([pickup.py](file:///c:/abhivorn/food_app/backend-fastapi/routers/pickup.py)).
- **[ ] Predefined Pickup Slots Selection (Frontend UI) (Section 7)**
  - *Pending:* Integrate the pickup slot selector element into the menu checkout process.
- **[x] Wallet & Streaks DB Schemas (Section 13 & 14)**
  - Schemas defining transactions, wallets, loyalty streaks, and coupon codes ([migrate_advanced.py](file:///c:/abhivorn/food_app/backend-fastapi/migrate_advanced.py)).
- **[/] Campus Wallet & Streaks UI (Mocked) (Section 13 & 14)**
  - Wallet top-up cards, recent transaction tables, and points/streaks display exist but are unrouted ([WalletAndLoyalty.jsx](file:///c:/abhivorn/food_app/frontend/src/WalletAndLoyalty.jsx)).
- **[ ] Parent/Guardian top-up linkage (Section 13)**
  - *Pending:* Interface to simulate parent allowance allocations.

---

### 🔵 Phase 4: Smart Break Optimizer & AI Intelligence Layer (70% Complete)
*Predictive wait times, break-matching optimizer recommendations, and comparative loads.*

- **[x] Smart Break Optimizer (Backend) (Section 8)**
  - Endpoint `/optimize` calculates preparation delays, active workloads, and campus walking times to align orders to break times ([optimizer.py](file:///c:/abhivorn/food_app/backend-fastapi/routers/optimizer.py)).
- **[ ] Smart Break Optimizer UI (Frontend) (Section 8)**
  - *Pending:* Let students specify break start/end times and display optimal dining itineraries during checkout.
- **[x] AI demand forecasting microservice (Section 9)**
  - Independent FastAPI service in [ai-engine/main.py](file:///c:/abhivorn/food_app/ai-engine/main.py) predicting demand (by time/weather), wait times, ingredient metrics, and comparative canteen loads.
- **[x] AI wait-time checkout link (Section 9)**
  - Orders dynamically fetch wait-time predictions from the AI service before finalizing order creation.

---

### 🟢 Phase 5: Stock, Expiry & Sustainability Analytics (75% Complete)
*Recipe item reductions, daily waste tracking, and eco-friendly features.*

- **[x] Ingredient-level auto stock deduction (Section 11)**
  - Automatic deduction of stock values based on order recipes when preparation begins ([orders.py](file:///c:/abhivorn/food_app/backend-fastapi/routers/orders.py#L148-L168)).
- **[x] Expiry & Waste Logs (Backend & Admin UI) (Section 12)**
  - Logger inputs for unsold items, waste trend graphs, cost summaries, and overproduction suggestions ([AdminSupplierWaste.jsx](file:///c:/abhivorn/food_app/frontend/src/AdminSupplierWaste.jsx)).
- **[/] Sustainability Analytics Dashboard (Mocked) (Section 12)**
  - Dashboard tracking carbon emissions, water footprints, and happy-hour recommendations exists but is unrouted ([SustainabilityDashboard.jsx](file:///c:/abhivorn/food_app/frontend/src/SustainabilityDashboard.jsx)).
- **[ ] Near-closing discount push (Happy Hour) (Section 12)**
  - *Pending:* Logic pushing discounts for unsold food items close to canteen closing time.

---

### 🔴 Phase 6: Advanced Staff, Security & Next-Gen (10% Complete)
*Rosters, attendance, complex policy controls, and future hardware links.*

- **[ ] Advanced Staff Scheduling & Roster (Section 19)**
  - *Pending:* Shifts panel, counter assignment management, and attendance cards.
- **[ ] Dietary preferences & allergen filters (Section 6)**
  - *Pending:* Menu page controls to filter out items containing specific allergens.
- **[x] Security & Reliability basics (Section 20)**
  - Role-based route blocks, state validations on backend, database transaction safety.
- **[ ] Experimental integrations (Section 21)**
  - RFID, computer-vision-assisted counter pickups, IoT refrigerators, and voice ordering.

---

## 📋 3. Recommended Application Modules & Status
* **1. Authentication & User Management:** **[x] Implemented** (Mock OTP + JWT).
* **2. Student Application:** **[x] Implemented** (Menu selection & tracking).
* **3. Menu Management:** **[x] Implemented** (CRUD operations on Admin side).
* **4. Food Pre-Booking:** **[x] Implemented** (Simulated checkout flow).
* **5. Smart Break Optimizer:** **[/] Partially Implemented** (Backend complete, Frontend pending).
* **6. Pickup Slot Management:** **[/] Partially Implemented** (Backend complete, Frontend pending).
* **7. Order Management:** **[x] Implemented** (State transitions & WebSockets).
* **8. Kitchen Display System:** **[x] Implemented** (Status updating + verification).
* **9. Inventory Management:** **[x] Implemented** (Auto deductions & limits).
* **10. Ingredient Management:** **[x] Implemented** (Recipe links).
* **11. Payment & Wallet:** **[/] Partially Implemented** (Refunds active, Wallet mocked).
* **12. QR Verification:** **[x] Implemented** (6-digit token code verify).
* **13. Notification System:** **[x] Implemented** (Socket.IO indicators).
* **14. Loyalty & Rewards:** **[/] Partially Implemented** (Mocked).
* **15. Feedback & Complaint Management:** **[ ] Pending**.
* **16. Canteen/Counter Management:** **[x] Implemented** (Multi-canteen view).
* **17. Staff Management:** **[ ] Pending**.
* **18. AI Demand Prediction:** **[x] Implemented** (AI microservice).
* **19. Queue Prediction:** **[x] Implemented** (AI Microservice).
* **20. Waste Prediction:** **[x] Implemented** (Waste dashboard calculations).
* **21. Analytics & Reporting:** **[x] Implemented** (Metrics page).
* **22. Admin Dashboard:** **[x] Implemented** (Popular items + peak times).
* **23. Security & Audit:** **[x] Implemented** (Database constraints & state guards).
* **24. Campus/Event Management:** **[x] Implemented** (Events schema & router).

---

## 📖 4. Real-world Scenarios & Workflows

### 4.1 Example End-to-End Workflow
1. Student logs in.
2. Student selects a canteen.
3. System displays available menu and live stock.
4. Student selects food items.
5. System calculates estimated preparation time.
6. Student enters/selects break period.
7. Smart Break Optimizer recommends the best pickup slot.
8. System checks slot and kitchen capacity.
9. Student confirms order.
10. Student pays using UPI, card, wallet, or supported method.
11. Order number and QR code are generated.
12. Kitchen Display System receives the order.
13. Kitchen accepts and prioritizes the order.
14. Inventory is automatically updated.
15. Kitchen prepares the food.
16. System marks the order Ready.
17. Student receives a notification.
18. Student reaches the assigned pickup counter.
19. QR/order token is verified.
20. Order is marked Collected.
21. Transaction and operational data are stored.
22. Analytics and AI models use the data for future optimization.

### 4.2 Example Student Scenario
A student has a 15-minute break from 10:30 AM to 10:45 AM. Before class, the student selects a vegetable sandwich and juice. The Smart Break Optimizer checks preparation time, current kitchen workload, available slots, and the student's selected/known location. It recommends a 10:38 AM pickup. The kitchen begins preparation at the correct time, the student receives a ready notification, reaches the dedicated pickup counter, scans the QR code, and collects the order in approximately one minute.

### 4.3 Example AI Operational Insight
The analytics engine can generate insights such as: *'Tomorrow's 10:30–10:45 demand is expected to increase by 18%. Prepare approximately 120 sandwiches. Juice wastage increased 23% this week; consider reducing initial preparation quantity and using a late-slot promotion.'*

---

## 📊 5. Suggested Admin Dashboard KPIs
* **Today's Orders:** Live counts of processed tickets (e.g. Target: 1,248).
* **Revenue:** Total daily sales display (e.g. Target: ₹48,650).
* **Average Pickup Time:** Clock timers tracking counter delays (e.g. Target: 2.4 minutes).
* **Active Kitchen Load:** Kitchen capacity meters (e.g. Target: 37 pending).
* **Food Waste Percentage:** Live sustainability loss tracking (e.g. Target: 4.2%).
* **Peak Hour Congestion:** Identifies high-density time slots (e.g. Target: 10:30–10:45 AM).
* **Slot Utilization:** Percent of allocated slots occupied (e.g. Target: 87%).

---

## 🛠️ 6. Verification & Running Instructions

### 1. Start Backend API (FastAPI)
```powershell
cd .\backend-fastapi
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

### 2. Start AI Engine
```powershell
cd .\ai-engine
uvicorn main:app --reload --port 8001
```

### 3. Start Frontend App (Vite + React)
```powershell
cd .\frontend
npm run dev
```

---

## 📝 7. Future Enhancements & Conclusion
* Full AI demand forecasting using machine learning.
* IoT-connected inventory, smart refrigerators, and storage sensors.
* Autonomous pickup lockers and advanced computer vision checks.
* Voice-based ordering and campus-wide food subscription plans.
* Integration with college ERP/ID systems.

**Conclusion:** Smart College Canteen combines student convenience with intelligent canteen operations. It addresses queue congestion, short breaks, food availability, kitchen overload, inventory uncertainty, food waste, and lack of operational visibility. With AI forecasting, smart break optimization, dynamic pickup slots, QR pickup, kitchen management, inventory intelligence, payments, rewards, sustainability analytics, and multi-canteen support, the system can evolve from a basic ordering application into a complete smart campus food ecosystem.
