/**
 * Synthetic Test Seed Data
 * Generates 10 realistic synthetic profiles (pastors, elders, workers, members)
 * and an initial monthly event with sample registrations and session attendance.
 */

export interface SyntheticParticipantSeed {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  churchName: string;
  isHostChurch: boolean;
  roleOffice: string;
  location: string;
}

export const SEED_CURRENT_EVENT = {
  id: "2026-11-EQUIP",
  title: "Equip November 2026: Apostolic Mantles & Spiritual Leadership",
  monthYear: "November 2026",
  startDate: "2026-11-23",
  endDate: "2026-11-25",
  status: "active",
};

export const SEED_PARTICIPANTS: SyntheticParticipantSeed[] = [
  {
    id: "EQ-82914",
    fullName: "Pastor David Adeleke",
    phone: "+2348031234567",
    email: "david.adeleke.synth@example.com",
    churchName: "Charismatic Renaissance International Church",
    isHostChurch: true,
    roleOffice: "Pastor",
    location: "Yenagoa, Bayelsa State",
  },
  {
    id: "EQ-47291",
    fullName: "Pastor Grace Okon",
    phone: "+2348029876543",
    email: "grace.okon.synth@example.com",
    churchName: "Charismatic Renaissance International Church",
    isHostChurch: true,
    roleOffice: "Pastor",
    location: "Yenagoa, Bayelsa State",
  },
  {
    id: "EQ-63820",
    fullName: "Elder Samuel Mensah",
    phone: "+2348145551234",
    email: "samuel.mensah.synth@example.com",
    churchName: "Charismatic Renaissance International Church",
    isHostChurch: true,
    roleOffice: "Elder",
    location: "Yenagoa, Bayelsa State",
  },
  {
    id: "EQ-91048",
    fullName: "Minister Hannah Eze",
    phone: "+2348057778899",
    email: "hannah.eze.synth@example.com",
    churchName: "Charismatic Renaissance International Church",
    isHostChurch: true,
    roleOffice: "Minister",
    location: "Yenagoa, Bayelsa State",
  },
  {
    id: "EQ-35812",
    fullName: "Pastor Joshua Danladi",
    phone: "+2348092223344",
    email: "joshua.danladi.synth@example.com",
    churchName: "Charismatic Renaissance International Church",
    isHostChurch: true,
    roleOffice: "Pastor",
    location: "Yenagoa, Bayelsa State",
  },
  {
    id: "EQ-72945",
    fullName: "Deacon Emmanuel Obi",
    phone: "+2348184445566",
    email: "emmanuel.obi.synth@example.com",
    churchName: "Charismatic Renaissance International Church",
    isHostChurch: true,
    roleOffice: "Worker",
    location: "Yenagoa, Bayelsa State",
  },
  {
    id: "EQ-19384",
    fullName: "Sister Deborah Alabi",
    phone: "+2348061112233",
    email: "deborah.alabi.synth@example.com",
    churchName: "Charismatic Renaissance International Church",
    isHostChurch: true,
    roleOffice: "Member",
    location: "Yenagoa, Bayelsa State",
  },
  {
    id: "EQ-54821",
    fullName: "Brother Michael Kwesi",
    phone: "+2348128889900",
    email: "michael.kwesi.synth@example.com",
    churchName: "Charismatic Renaissance International Church",
    isHostChurch: true,
    roleOffice: "Member",
    location: "Yenagoa, Bayelsa State",
  },
  {
    id: "EQ-88371",
    fullName: "Pastor Sarah Boateng",
    phone: "+2348073334455",
    email: "sarah.boateng.synth@example.com",
    churchName: "Charismatic Renaissance International Church",
    isHostChurch: true,
    roleOffice: "Pastor",
    location: "Yenagoa, Bayelsa State",
  },
  {
    id: "EQ-24903",
    fullName: "Brother Timothy Nwachukwu",
    phone: "+2348156667788",
    email: "timothy.nwachukwu.synth@example.com",
    churchName: "Charismatic Renaissance International Church",
    isHostChurch: true,
    roleOffice: "Worker",
    location: "Yenagoa, Bayelsa State",
  },
];
