// =============================================
// Edit this file to update photoshoot statuses!
// =============================================

export type ShootStatus = "Not Shot" | "Awaiting Edits" | "Editing" | "Completed";

export interface Photoshoot {
  name: string;
  status: ShootStatus;
  date?: string;
  link?: string;
}

const photoshoots: Photoshoot[] = [
  { name: "Delaware Blue Coats", status: "Not Shot", date: "Mar 13, 2026" },
  { name: "DEFC Soccer", status: "Completed", date: "Mar 1, 2026", link: "https://photos.grayfx.cam/defcsoccer/" },
  { name: "DIAA Swimming Finals", status: "Completed", date: "Feb 28, 2026", link: "https://photos.grayfx.cam/saintmarksswimming/" },
  { name: "SJB Intermediate Gray", status: "Completed", date: "Feb 27, 2026", link: "https://photos.grayfx.cam/sjbhoopsgraysmm/227atsmos/" },
  { name: "SJB Varsity Y", status: "Completed", date: "Feb 17, 2026", link: "https://photos.grayfx.cam/stjohnsy/" },
];

export default photoshoots;
