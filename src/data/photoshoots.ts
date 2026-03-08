// =============================================
// Edit this file to update photoshoot statuses!
// =============================================

export type ShootStatus = "Not Shot" | "Awaiting Edits" | "Editing" | "Completed";

export interface Photoshoot {
  name: string;
  status: ShootStatus;
  date?: string;
}

const photoshoots: Photoshoot[] = [
  { name: "Senior Portraits – Alyssa", status: "Completed", date: "Mar 1, 2026" },
  { name: "Basketball Playoffs", status: "Editing", date: "Mar 5, 2026" },
  { name: "Spring Dance Promo", status: "Awaiting Edits", date: "Mar 7, 2026" },
  { name: "Track & Field Meet", status: "Not Shot", date: "Mar 12, 2026" },
  { name: "Graduation Headshots", status: "Not Shot", date: "Mar 15, 2026" },
];

export default photoshoots;
