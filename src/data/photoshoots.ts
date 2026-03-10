export type ShootStatus = "Upcoming" | "Awaiting Edits" | "Editing" | "Completed";

export interface Photoshoot {
  name: string;
  status: ShootStatus;
  date?: string;
  link?: string;
}

export const photoshoots: Photoshoot[] = [
  {
    name: "Saint Mark's Baseball",
    status: "Upcoming",
    date: "Mar 13, 2026"
  },
  {
    name: "Delaware Blue Coats",
    status: "Not Shot",
    date: "Mar 12, 2026"
  },
  {
    name: "DEFC Soccer",
    status: "Completed",
    date: "Feb 26, 2026",
    link: "https://photos.grayfx.cam/defcsoccer/"
  },
  {
    name: "DIAA Swimming Finals",
    status: "Completed",
    date: "Feb 25, 2026",
    link: "https://photos.grayfx.cam/saintmarksswimming/"
  },
  {
    name: "SJB Intermediate Gray",
    status: "Completed",
    date: "Feb 24, 2026",
    link: "https://photos.grayfx.cam/sjbhoopsgraysmm/227atsmos/"
  },
  {
    name: "SJB Varsity Y",
    status: "Completed",
    date: "Feb 14, 2026",
    link: "https://photos.grayfx.cam/stjohnsy/"
  },
  {
    name: "Saint Mark's Basketball",
    status: "Completed",
    date: "Feb 14, 2026",
    link: "https://photos.grayfx.cam/saintmarksvsstesbball/"
  }
];

export default photoshoots;
