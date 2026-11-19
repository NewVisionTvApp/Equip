# Project Brief: Monthly Church Programme Registration

## 1. Overview & Objectives
A dedicated, lightweight, and robust registration system for a monthly recurring church gathering. It allows new participants to register, returning participants to easily register for upcoming monthly events using a persistent profile, and administrators to view registrations, look up lost IDs, and manage session attendance.

## 2. Event Structure & Expected Volume
- **Frequency:** Monthly.
- **Duration & Sessions:** 3 days spanning 5 distinct sessions:
  - Day 1 (Monday): Morning Session, Evening Session
  - Day 2 (Tuesday): Morning Session, Evening Session
  - Day 3 (Wednesday): Afternoon Session
- **Expected Volume:** Approximately 150 – 200 participants per monthly event.
- **Breakdown:** ~50–90 pastors, ~20–50 general members, plus visitors.
- **Capacity:** Open-ended (no hard cap constraint for registration).

## 3. Data Specification
### Participant Profile (Persistent)
- **Unique Participant ID:** Stable human-readable identifier (e.g., `EQ-XXXXX`) assigned upon first registration.
- **Full Name:** Required.
- **Phone Number:** Required (primary lookup key for returning participants).
- **Email Address:** Optional / Required (secondary lookup key).
- **Home Church:** Church attended (host church vs. visiting church).
- **Office / Role:** Pastor, Elder, Minister, Member, Guest.
- **Location:** City, state/region, or branch.

### Event Registration (Per Event Instance)
- Linked to `Participant Profile`.
- Targeted Event ID (e.g., `2026-12-EQUIP`).
- Registration Timestamp.
- Status (Registered, Cancelled).

### Attendance / Check-in (Per Session)
- 5 sessions per event:
  1. Mon Morning
  2. Mon Evening
  3. Tue Morning
  4. Tue Evening
  5. Wed Afternoon
- Check-in status per session (checked-in timestamp, checked-in by admin/volunteer).

## 4. Participant Recognition & Experience
- No mandatory password or account creation required for participants.
- First-time registration generates their persistent profile and provides their Unique Participant ID.
- Returning participants can register for a new monthly event simply by entering their Unique ID or Phone Number to confirm their details.
- Admin directory allows searching participants by name/phone/email to retrieve a forgotten Unique ID.

## 5. Admin Requirements (First Phase)
- Secure admin access.
- Participant lookup (search by Name, Phone, Email, Unique ID).
- Event registration roster (filter by Pastors / Members / Church / Location).
- Session check-in tracker (quick toggle for each of the 5 sessions).
- Exportable list (CSV) for event reporting.
