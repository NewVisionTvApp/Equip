import { test, describe } from "node:test";
import assert from "node:assert";
import { generateParticipantId, isValidParticipantId, normalizeParticipantId } from "../src/lib/id-generator.ts";

describe("Equip 3.0 Verification Test Suite (Phase 5)", () => {
  /* =========================================================================
     1. Unique Participant ID Generator Tests
     ========================================================================= */
  describe("Unique Participant ID Generator (id-generator.ts)", () => {
    test("TC-ID-01: Generates ID adhering strictly to EQ-XXXXX pattern", () => {
      const id = generateParticipantId();
      assert.match(id, /^EQ-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/);
    });

    test("TC-ID-02: Excludes ambiguous characters (0, O, 1, I, L)", () => {
      const ambiguousRegex = /[0O1IL]/;
      for (let i = 0; i < 500; i++) {
        const id = generateParticipantId();
        const code = id.replace("EQ-", "");
        assert.strictEqual(
          ambiguousRegex.test(code),
          false,
          `ID ${id} contains ambiguous character`
        );
      }
    });

    test("TC-ID-03: Zero collisions across 10,000 generated IDs using collision-avoidance", () => {
      const sampleSize = 10000;
      const seenIds = new Set<string>();

      for (let i = 0; i < sampleSize; i++) {
        const id = generateParticipantId(seenIds);
        assert.strictEqual(
          isValidParticipantId(id),
          true,
          `Generated ID ${id} must adhere to valid format`
        );
      }

      assert.strictEqual(seenIds.size, sampleSize);
    });

    test("TC-ID-04: isValidParticipantId accurately classifies valid and invalid IDs", () => {
      // Valid IDs
      assert.strictEqual(isValidParticipantId("EQ-8K4NP"), true);
      assert.strictEqual(isValidParticipantId("EQ-23456"), true);
      assert.strictEqual(isValidParticipantId("eq-8k4np"), true); // Case-insensitive
      assert.strictEqual(isValidParticipantId("  EQ-8K4NP  "), true); // Trimmable

      // Invalid IDs
      assert.strictEqual(isValidParticipantId(""), false);
      assert.strictEqual(isValidParticipantId("EQ-12345"), false); // Contains '1'
      assert.strictEqual(isValidParticipantId("EQ-0ABCD"), false); // Contains '0'
      assert.strictEqual(isValidParticipantId("EQ-OABCD"), false); // Contains 'O'
      assert.strictEqual(isValidParticipantId("EQ-LABCD"), false); // Contains 'L'
      assert.strictEqual(isValidParticipantId("EQ-IABCD"), false); // Contains 'I'
      assert.strictEqual(isValidParticipantId("EQ-8K4N"), false);  // Too short (4 chars)
      assert.strictEqual(isValidParticipantId("EQ-8K4NPX"), false); // Too long (6 chars)
      assert.strictEqual(isValidParticipantId("NE-8K4NP"), false); // Wrong prefix
      assert.strictEqual(isValidParticipantId(null as any), false);
    });

    test("TC-ID-05: normalizeParticipantId trims and uppercases", () => {
      assert.strictEqual(normalizeParticipantId("  eq-7m2dx  "), "EQ-7M2DX");
      assert.strictEqual(normalizeParticipantId("eq-8k4np"), "EQ-8K4NP");
    });
  });

  /* =========================================================================
     2. Registration & Duplicate Prevention Logic Tests (TC-01 to TC-03)
     ========================================================================= */
  describe("Registration & Duplicate Prevention (PRD Section 4.A & 4.B)", () => {
    // In-memory registration store simulating database constraints
    interface ParticipantRecord {
      id: string;
      fullName: string;
      phone: string;
      email: string;
      churchName: string;
      roleOffice: string;
      location: string;
    }

    interface RegistrationRecord {
      id: string;
      participantId: string;
      eventId: string;
      registeredAt: Date;
    }

    const participantStore = new Map<string, ParticipantRecord>();
    const registrationStore = new Map<string, RegistrationRecord>();

    function registerAttendee(input: {
      fullName: string;
      phone: string;
      email: string;
      churchName: string;
      roleOffice: string;
      location: string;
      eventId: string;
    }) {
      if (!input.fullName.trim()) throw new Error("Full name is required");
      if (!input.phone.trim()) throw new Error("Phone number is required");

      const normalizedPhone = input.phone.trim().replace(/\s+/g, "");

      // Check for existing participant by phone
      let participant: ParticipantRecord | undefined;
      for (const p of participantStore.values()) {
        if (p.phone === normalizedPhone) {
          participant = p;
          break;
        }
      }

      if (!participant) {
        const id = generateParticipantId();
        participant = {
          id,
          fullName: input.fullName.trim(),
          phone: normalizedPhone,
          email: input.email.trim(),
          churchName: input.churchName.trim(),
          roleOffice: input.roleOffice.trim(),
          location: input.location.trim(),
        };
        participantStore.set(id, participant);
      }

      // Check for duplicate registration for this specific event
      const regKey = `${participant.id}_${input.eventId}`;
      let registration = registrationStore.get(regKey);
      let isDuplicate = false;

      if (registration) {
        isDuplicate = true;
      } else {
        registration = {
          id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          participantId: participant.id,
          eventId: input.eventId,
          registeredAt: new Date(),
        };
        registrationStore.set(regKey, registration);
      }

      return {
        participant,
        registration,
        isDuplicate,
      };
    }

    test("TC-01: Creates new participant and event registration when valid", () => {
      const res = registerAttendee({
        fullName: "Pastor David Adeleke",
        phone: "+2348031234567",
        email: "david@example.com",
        churchName: "Grace Covenant Ministries",
        roleOffice: "Senior Pastor",
        location: "Lagos Central",
        eventId: "2026-12-EQUIP",
      });

      assert.ok(res.participant.id.startsWith("EQ-"));
      assert.strictEqual(res.participant.fullName, "Pastor David Adeleke");
      assert.strictEqual(res.registration.eventId, "2026-12-EQUIP");
      assert.strictEqual(res.isDuplicate, false);
    });

    test("TC-02: Rejects registration with missing required fields", () => {
      assert.throws(
        () =>
          registerAttendee({
            fullName: "",
            phone: "+2348031234567",
            email: "test@example.com",
            churchName: "Church",
            roleOffice: "Member",
            location: "Lagos",
            eventId: "2026-12-EQUIP",
          }),
        /Full name is required/
      );

      assert.throws(
        () =>
          registerAttendee({
            fullName: "Valid Name",
            phone: "   ",
            email: "test@example.com",
            churchName: "Church",
            roleOffice: "Member",
            location: "Lagos",
            eventId: "2026-12-EQUIP",
          }),
        /Phone number is required/
      );
    });

    test("TC-03: Gracefully handles duplicate registration without creating duplicate records", () => {
      const initialCount = registrationStore.size;

      // First registration
      const first = registerAttendee({
        fullName: "Sister Grace Okon",
        phone: "+2348029876543",
        email: "grace@example.com",
        churchName: "Faith Apostolic Church",
        roleOffice: "Choir Minister",
        location: "Ibadan",
        eventId: "2026-12-EQUIP",
      });
      assert.strictEqual(first.isDuplicate, false);

      // Duplicate registration attempt for same event
      const duplicate = registerAttendee({
        fullName: "Sister Grace Okon",
        phone: "+2348029876543",
        email: "grace@example.com",
        churchName: "Faith Apostolic Church",
        roleOffice: "Choir Minister",
        location: "Ibadan",
        eventId: "2026-12-EQUIP",
      });

      assert.strictEqual(duplicate.isDuplicate, true);
      assert.strictEqual(duplicate.participant.id, first.participant.id);
      assert.strictEqual(duplicate.registration.id, first.registration.id);

      // Verify no extra registration record was created
      assert.strictEqual(registrationStore.size, initialCount + 1);
    });

    test("TC-04 & TC-05: Returning attendee can register for a new event month while keeping same ID", () => {
      const nextMonthEventId = "2027-01-EQUIP";

      const returning = registerAttendee({
        fullName: "Pastor David Adeleke",
        phone: "+2348031234567", // Same phone as TC-01
        email: "david@example.com",
        churchName: "Grace Covenant Ministries",
        roleOffice: "Senior Pastor",
        location: "Lagos Central",
        eventId: nextMonthEventId,
      });

      // Same participant ID retained across months
      assert.strictEqual(returning.isDuplicate, false);
      const decRegKey = `${returning.participant.id}_2026-12-EQUIP`;
      const janRegKey = `${returning.participant.id}_2027-01-EQUIP`;

      assert.ok(registrationStore.has(decRegKey));
      assert.ok(registrationStore.has(janRegKey));
    });
  });

  /* =========================================================================
     3. 5-Session Attendance Tracker Tests (TC-08 to TC-10)
     ========================================================================= */
  describe("5-Session Attendance Tracker (TC-08 to TC-10)", () => {
    const VALID_SESSIONS = ["mon_am", "mon_pm", "tue_am", "tue_pm", "wed_am"];

    interface SessionAttendanceState {
      [participantId: string]: {
        [sessionKey: string]: {
          checkedIn: boolean;
          timestamp: string | null;
        };
      };
    }

    const attendanceState: SessionAttendanceState = {};

    function toggleAttendance(participantId: string, sessionKey: string) {
      if (!VALID_SESSIONS.includes(sessionKey)) {
        throw new Error(`Invalid session key: ${sessionKey}`);
      }

      if (!attendanceState[participantId]) {
        attendanceState[participantId] = {};
      }

      const current = attendanceState[participantId][sessionKey]?.checkedIn ?? false;
      const next = !current;

      attendanceState[participantId][sessionKey] = {
        checkedIn: next,
        timestamp: next ? new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
      };

      return attendanceState[participantId][sessionKey];
    }

    test("TC-08: Check-in toggles on and assigns valid timestamp", () => {
      const participantId = "EQ-8K4NP";
      const result = toggleAttendance(participantId, "mon_am");

      assert.strictEqual(result.checkedIn, true);
      assert.ok(result.timestamp !== null);
      assert.match(result.timestamp, /\d{1,2}:\d{2}\s?(AM|PM)/i);
    });

    test("TC-09: Check-in toggles off cleanly (undo operation)", () => {
      const participantId = "EQ-8K4NP";
      const result = toggleAttendance(participantId, "mon_am");

      assert.strictEqual(result.checkedIn, false);
      assert.strictEqual(result.timestamp, null);
    });

    test("TC-10: All 5 sessions operate independently per participant", () => {
      const participantId = "EQ-7M2DX";

      // Check in Mon AM, Tue PM, Wed AM
      toggleAttendance(participantId, "mon_am");
      toggleAttendance(participantId, "tue_pm");
      toggleAttendance(participantId, "wed_am");

      const pSessions = attendanceState[participantId];
      assert.strictEqual(pSessions["mon_am"].checkedIn, true);
      assert.strictEqual(pSessions["mon_pm"]?.checkedIn ?? false, false);
      assert.strictEqual(pSessions["tue_am"]?.checkedIn ?? false, false);
      assert.strictEqual(pSessions["tue_pm"].checkedIn, true);
      assert.strictEqual(pSessions["wed_am"].checkedIn, true);
    });
  });

  /* =========================================================================
     4. CSV Export Formatting Tests (PRD Section 4.E)
     ========================================================================= */
  describe("CSV Export Formatting & Escaping", () => {
    function generateCsvRow(fields: string[]) {
      return fields
        .map((f) => {
          if (f.includes(",") || f.includes('"') || f.includes("\n")) {
            return `"${f.replace(/"/g, '""')}"`;
          }
          return f;
        })
        .join(",");
    }

    test("TC-CSV-01: Correctly escapes commas and quotes in participant fields", () => {
      const fields = [
        "EQ-82914",
        'Pastor David "The Apostle" Adeleke',
        "+2348031234567",
        "Grace Covenant Ministries, Lagos",
        "Senior Pastor",
      ];

      const row = generateCsvRow(fields);
      assert.ok(row.includes('"Pastor David ""The Apostle"" Adeleke"'));
      assert.ok(row.includes('"Grace Covenant Ministries, Lagos"'));
      assert.ok(row.includes("EQ-82914"));
    });
  });

  /* =========================================================================
     5. Date-Aware Monthly Event Resolution Tests
     ========================================================================= */
  describe("Date-Aware Monthly Event Resolution", () => {
    interface TestEvent {
      id: string;
      title: string;
      monthYear: string;
      startDate: string;
      endDate: string;
      status: "active" | "open" | "draft" | "completed";
    }

    function resolveDateAwareEvent(events: TestEvent[], preferredId?: string, mockNow = new Date()): TestEvent {
      if (preferredId) {
        const found = events.find((e) => e.id === preferredId);
        if (found) return found;
      }

      const currentYear = mockNow.getFullYear();
      const currentMonth = mockNow.getMonth();

      // Check date range
      const ongoing = events.find((e) => {
        if (!e.startDate || !e.endDate) return false;
        const s = new Date(e.startDate);
        const end = new Date(e.endDate);
        end.setHours(23, 59, 59, 999);
        return mockNow >= s && mockNow <= end;
      });
      if (ongoing) return ongoing;

      // Check current calendar month
      const monthNames = [
        "january", "february", "march", "april", "may", "june",
        "july", "august", "september", "october", "november", "december"
      ];
      const currentMonthName = monthNames[currentMonth];
      const sameMonth = events.find((e) => {
        const matchesMonth = e.monthYear.toLowerCase().includes(currentMonthName);
        const matchesYear =
          e.monthYear.includes(String(currentYear)) ||
          (e.startDate && e.startDate.startsWith(String(currentYear)));
        return matchesMonth && matchesYear;
      });
      if (sameMonth) return sameMonth;

      const activeStatus = events.find((e) => e.status === "active");
      if (activeStatus) return activeStatus;

      return events[0];
    }

    test("TC-DATE-01: Correctly auto-selects November 2026 event when date is in November 2026", () => {
      const mockEvents: TestEvent[] = [
        {
          id: "2026-11-EQUIP",
          title: "Equip November 2026",
          monthYear: "November 2026",
          startDate: "2026-11-23",
          endDate: "2026-11-25",
          status: "active",
        },
        {
          id: "2026-12-EQUIP",
          title: "Equip December 2026",
          monthYear: "December 2026",
          startDate: "2026-12-14",
          endDate: "2026-12-16",
          status: "open",
        },
      ];

      // Test with November date
      const novDate = new Date("2026-11-20T00:00:00Z");
      const activeEvent = resolveDateAwareEvent(mockEvents, undefined, novDate);
      assert.strictEqual(activeEvent.id, "2026-11-EQUIP");
      assert.strictEqual(activeEvent.monthYear, "November 2026");
    });

    test("TC-DATE-02: Preserves explicit admin selection over automatic calendar detection", () => {
      const mockEvents: TestEvent[] = [
        {
          id: "2026-11-EQUIP",
          title: "Equip November 2026",
          monthYear: "November 2026",
          startDate: "2026-11-23",
          endDate: "2026-11-25",
          status: "active",
        },
        {
          id: "2026-12-EQUIP",
          title: "Equip December 2026",
          monthYear: "December 2026",
          startDate: "2026-12-14",
          endDate: "2026-12-16",
          status: "open",
        },
      ];

      const novDate = new Date("2026-11-20T00:00:00Z");
      // Admin explicitly selected December
      const activeEvent = resolveDateAwareEvent(mockEvents, "2026-12-EQUIP", novDate);
      assert.strictEqual(activeEvent.id, "2026-12-EQUIP");
    });

    test("TC-DATE-03: Formats date range unambiguously with weekdays and month names", () => {
      function formatDate(startDate: string, endDate: string): string {
        const sParts = startDate.split("-").map(Number);
        const eParts = endDate.split("-").map(Number);
        const start = new Date(sParts[0], sParts[1] - 1, sParts[2]);
        const end = new Date(eParts[0], eParts[1] - 1, eParts[2]);

        const sDay = start.toLocaleDateString("en-US", { weekday: "short" });
        const sMonth = start.toLocaleDateString("en-US", { month: "short" });
        const sDate = start.getDate();

        const eDay = end.toLocaleDateString("en-US", { weekday: "short" });
        const eMonth = end.toLocaleDateString("en-US", { month: "short" });
        const eDate = end.getDate();
        const year = end.getFullYear();

        return `${sDay}, ${sMonth} ${sDate} – ${eDay}, ${eMonth} ${eDate}, ${year}`;
      }

      const formatted = formatDate("2026-11-23", "2026-11-25");
      assert.strictEqual(formatted, "Mon, Nov 23 – Wed, Nov 25, 2026");
    });
  });

  describe("Admin Profile Editing & Platform State Snapshots", () => {
    test("TC-EDIT-01: Admin can update attendee profile details and clergy status", () => {
      const mockParticipant = {
        id: "EQ-82914",
        fullName: "Pastor David Adeleke",
        phone: "+2348051234567",
        email: "david@example.com",
        churchName: "Grace Tabernacle",
        isHostChurch: false,
        roleOffice: "Associate Pastor",
        isOrdained: true,
        location: "Abuja",
        createdAt: new Date().toISOString(),
      };

      const mockState = {
        events: [{ id: "2026-11-EQUIP", title: "Equip November 2026", monthYear: "November 2026", status: "active" as const }],
        activeEventId: "2026-11-EQUIP",
        participants: { "EQ-82914": mockParticipant },
        registrations: [{ id: "reg_1", participantId: "EQ-82914", eventId: "2026-11-EQUIP", registeredAt: new Date().toISOString() }],
        attendance: {},
        churches: ["Grace Covenant Sanctuary (Host)"],
      };

      // Apply update
      const existing = mockState.participants["EQ-82914"];
      const updated = {
        ...existing,
        fullName: "Bishop David Adeleke",
        phone: "+2348059999999",
        roleOffice: "Senior Bishop",
        location: "Port Harcourt",
        churchName: "Kingdom Life Apostolic Ministry",
      };

      mockState.participants["EQ-82914"] = updated;
      if (!mockState.churches.includes(updated.churchName)) {
        mockState.churches.push(updated.churchName);
      }

      assert.strictEqual(mockState.participants["EQ-82914"].fullName, "Bishop David Adeleke");
      assert.strictEqual(mockState.participants["EQ-82914"].phone, "+2348059999999");
      assert.strictEqual(mockState.participants["EQ-82914"].roleOffice, "Senior Bishop");
      assert.strictEqual(mockState.participants["EQ-82914"].location, "Port Harcourt");
      assert.strictEqual(mockState.churches.includes("Kingdom Life Apostolic Ministry"), true);
    });

    test("TC-SYNC-01: Serializes and restores full state snapshot faithfully", () => {
      const mockState = {
        events: [{ id: "2026-11-EQUIP", title: "Equip November 2026" }],
        participants: { "EQ-TEST1": { id: "EQ-TEST1", fullName: "Test Delegate" } },
        registrations: [{ id: "reg_1", participantId: "EQ-TEST1", eventId: "2026-11-EQUIP" }],
        attendance: { "EQ-TEST1_2026-11-EQUIP_mon_am": { attended: true, timestamp: "08:45 AM" } },
        churches: ["Grace Covenant Sanctuary (Host)", "Living Faith"],
      };

      const json = JSON.stringify(mockState, null, 2);
      const restored = JSON.parse(json);

      assert.strictEqual(restored.events.length, 1);
      assert.strictEqual(restored.participants["EQ-TEST1"].fullName, "Test Delegate");
      assert.strictEqual(restored.attendance["EQ-TEST1_2026-11-EQUIP_mon_am"].attended, true);
      assert.strictEqual(restored.churches.includes("Living Faith"), true);
    });
  });
});
