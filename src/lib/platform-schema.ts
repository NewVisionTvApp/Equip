import { z } from "zod";

export const roleSchema = z.enum(["admin", "usher", "attendee"]);
export type UserRole = z.infer<typeof roleSchema>;
export const sessionKeySchema = z.enum(["mon_am", "mon_pm", "tue_am", "tue_pm", "wed_am"]);
const text = z.string().trim().min(1).max(200);
const phone = z.string().trim().min(7).max(30).regex(/^[+\d\s()\-]+$/, "Enter a valid phone number");
const email = z.union([z.string().trim().email().max(254), z.literal("")]).optional();
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
export const sessionSchema = z.object({
  key: sessionKeySchema, name: text, short: text, day: text, time: text,
  speaker: text, hall: text, capacity: z.number().int().positive().optional(),
});
export const eventSchema = z.object({
  id: text, title: text, theme: text, monthYear: text, startDate: date, endDate: date,
  status: z.enum(["active", "open", "draft", "completed"]), sessions: z.array(sessionSchema).max(5).optional(),
});
export const profileInputSchema = z.object({
  fullName: text, phone, email, churchName: text, roleOffice: text, location: text,
  isOrdained: z.boolean(),
});
export const registrationInputSchema = profileInputSchema.extend({ eventId: text });
export const claimSchema = z.object({ id: z.string().trim().toUpperCase().regex(/^EQ-[23456789ABCDEFGHJKMNPQRSTUVWXYZ]{5}$/), phone });
export const returningSchema = claimSchema.extend({ eventId: text });
export const storedParticipantSchema = profileInputSchema.extend({
  id: text, email: z.string().max(254), isHostChurch: z.boolean(), createdAt: z.string(), userId: text.optional(),
});
export const platformStateSchema = z.object({
  events: z.array(eventSchema).min(1).max(120), activeEventId: text,
  participants: z.record(storedParticipantSchema),
  registrations: z.array(z.object({ id: text, participantId: text, eventId: text, registeredAt: z.string() })),
  attendance: z.record(z.object({ attended: z.boolean(), timestamp: z.string().nullable() })),
  churches: z.array(text).optional(),
});
export const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("attendance.set"), participantId: text, eventId: text, sessionKey: sessionKeySchema, attended: z.boolean() }),
  z.object({ type: z.literal("participant.register"), data: registrationInputSchema }),
  z.object({ type: z.literal("participant.update"), participantId: text, data: profileInputSchema.partial() }),
  z.object({ type: z.literal("event.create"), data: eventSchema }),
  z.object({ type: z.literal("event.select"), eventId: text }),
  z.object({ type: z.literal("event.update"), eventId: text, data: eventSchema.omit({ id: true }).partial() }),
  z.object({ type: z.literal("session.update"), eventId: text, sessionKey: sessionKeySchema, data: sessionSchema.omit({ key: true }).partial() }),
  z.object({ type: z.literal("state.import"), data: platformStateSchema, revision: z.number().int().nonnegative() }),
]);
export type PlatformAction = z.infer<typeof actionSchema>;
export type RegistrationInput = z.infer<typeof registrationInputSchema>;
