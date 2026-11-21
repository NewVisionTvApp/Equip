import type { EquipEvent, StoredParticipant, StoredRegistration } from "./store";

export interface Programme {
  events: EquipEvent[];
  activeEventId?: string;
  churches: string[];
}
export interface OwnRecords extends Programme {
  participant: StoredParticipant | null;
  registrations: StoredRegistration[];
  attendance: Record<string, { attended: boolean; timestamp: string | null }>;
}

export async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    headers: { ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data && typeof data === "object" && "error" in data && typeof data.error === "string" ? data.error : "The request failed. Please try again.");
  return data as T;
}
