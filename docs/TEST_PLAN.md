# Test Plan & Verification Matrix (TEST_PLAN.md)

## 1. Overview
This test plan defines verification criteria for the Equip Registration & Attendance system across unit, integration, and manual end-to-end checks.

## 2. Test Cases

### A. First-Time Registration Flow
- **TC-01:** Submit form with all valid fields (Name, Phone, Email, Church, Office, Location).
  - *Expected:* Profile created in `participants`, registration created in `registrations`, unique ID (format `EQ-XXXXX`) returned and displayed clearly on confirmation screen.
- **TC-02:** Submit form with missing required fields (e.g. empty Name or empty Phone).
  - *Expected:* Client-side and server-side validation error displayed inline, no record created.
- **TC-03:** Submit registration with an already registered phone number for the *same* monthly event.
  - *Expected:* Graceful notification stating the participant is already registered for this event, showing their existing registration details and unique ID without creating duplicate rows.

### B. Returning Participant Re-Registration
- **TC-04:** Returning participant enters their Unique ID (e.g., `EQ-12345`) or registered phone number.
  - *Expected:* Master profile details loaded, confirmed registration created for current monthly event.
- **TC-05:** Returning participant updates their Church or Location during re-registration.
  - *Expected:* Master profile updated with latest details, registration linked successfully.

### C. Admin Directory & ID Lookup
- **TC-06:** Admin searches by full or partial Name.
  - *Expected:* Matching participants returned with their unique ID, phone, role, and current registration status.
- **TC-07:** Admin searches by Phone Number or Unique ID.
  - *Expected:* Exact match returned instantaneously.

### D. Multi-Session Attendance Check-in
- **TC-08:** Admin marks attendance for Session 1 (Mon Morning).
  - *Expected:* Record saved to `session_attendance`, status toggles to "Checked In" with timestamp.
- **TC-09:** Admin toggles attendance off (undo check-in).
  - *Expected:* Attendance record cleanly removed or updated.
- **TC-10:** Verify attendance across all 5 sessions independently (Mon AM, Mon PM, Tue AM, Tue PM, Wed AM).

### E. Responsive & Viewport Checks
- **TC-11:** Test on mobile viewport (375px - iPhone SE).
- **TC-12:** Test on standard mobile (390px / 414px).
- **TC-13:** Test on desktop (1280px / 1440px).
