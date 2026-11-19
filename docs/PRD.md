# Product Requirements Document (PRD)

## 1. Product Overview
**Equip Registration & Attendance System** is an independent, lightweight, high-performance web platform designed for a monthly recurring 3-day church programme.
It enables seamless registration for new attendees, instant re-registration for returning attendees via a persistent profile ID, and an administrative hub for participant lookups, roster management, and multi-session attendance tracking.

## 2. Target Users
1. **Public Attendees:**
   - **Pastors & Ministers (~50–90 per month):** Both from the host ministry and visiting external churches.
   - **Church Members (~20–50 per month):** Both host church members and visiting believers.
   - Total expected volume: **150 – 200 participants per monthly event**.
2. **Event Administrators & Ushers:**
   - Church administrators verifying registrations.
   - Help-desk volunteers looking up forgotten participant IDs by phone/name.
   - Session coordinators taking attendance across 5 specific sessions.

## 3. Event Schedule & Session Structure
The programme runs monthly over 3 consecutive days with **5 distinct sessions**:
- **Day 1 (Monday):**
  - Session 1: Monday Morning
  - Session 2: Monday Evening
- **Day 2 (Tuesday):**
  - Session 3: Tuesday Morning
  - Session 4: Tuesday Evening
- **Day 3 (Wednesday):**
  - Session 5: Wednesday Afternoon

## 4. Core Features & User Stories
### A. Public Registration (New Participant)
- **Story:** A first-time attendee visits the registration portal, fills out their details, receives a confirmed registration for the current month, and gets a clear, memorable **Unique Participant ID** (e.g., `EQ-74829`).
- **Required Fields:**
  - Full Name (text, required)
  - Phone Number (tel, required, validated format)
  - Email Address (email, optional / required for confirmation)
  - Church Name (text, required — host church vs. external church)
  - Office / Role (select: Pastor, Minister, Elder, Worker, Member, Guest)
  - Location (text, required — City / Branch / Region)
- **Output:** Immediate confirmation screen showing their Unique Participant ID and current event confirmation.

### B. Quick Re-Registration (Returning Participant)
- **Story:** A returning attendee enters their Unique ID or registered Phone Number. The system retrieves their profile, confirms their details with one click, and registers them for the upcoming monthly event without re-typing their details.
- **Duplicate Prevention:** Prevents registering twice for the same monthly event while preserving their single master profile.

### C. Admin Participant Directory & ID Lookup
- **Story:** An attendee arrives without their ID. The admin searches by Name, Phone Number, or Email to retrieve the participant’s profile, view their Unique ID, and check their event status.

### D. Multi-Session Attendance Tracker
- **Story:** During each of the 5 sessions, administrators or ushers can rapidly mark attendance per attendee (or filter by session) with real-time feedback.

### E. Reporting & Export
- **Story:** Administrators can export the registration and attendance roster to CSV filtered by role (Pastors vs. Members), church affiliation, or session attendance.

## 5. Scope & Non-Goals (MVP)
- **In Scope (MVP):**
  - Public registration form with validation and responsive UI.
  - Unique ID assignment (`EQ-XXXXX`).
  - Returning attendee instant registration flow.
  - Admin participant directory with search and filtering.
  - Event attendance check-in across the 5 sessions.
  - Local SQLite / Cloudflare D1 integration.
- **Out of Scope (MVP):**
  - Participant passwords or mandatory account logins.
  - Native mobile application (responsive mobile web is standard).
  - Payment processing or ticket fees (event is free).
  - Automated SMS/WhatsApp broadcast gateways (deferred to later slice).
  - Integration with New Vision TV app (strict separation maintained).

## 6. Success Criteria
1. An attendee can complete registration in under 60 seconds on a mobile browser.
2. Returning attendees can register in under 15 seconds using phone number or ID.
3. Zero duplicate registrations for the same event per participant.
4. Admins can locate any participant's ID in under 5 seconds.
