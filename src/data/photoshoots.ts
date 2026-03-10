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
    date: "Mar 11, 2026"
  },
  {
    name: "Delaware Blue Coats",
    status: "Upcoming",
    date: "Mar 10, 2026"
  },
  {
    name: "DEFC Soccer",
    status: "Completed",
    date: "Feb 24, 2026",
    link: "https://photos.grayfx.cam/defcsoccer/"
  },
  {
    name: "DIAA Swimming Finals",
    status: "Completed",
    date: "Feb 23, 2026",
    link: "https://photos.grayfx.cam/saintmarksswimming/"
  },
  {
    name: "SJB Intermediate Gray",
    status: "Completed",
    date: "Feb 22, 2026",
    link: "https://photos.grayfx.cam/sjbhoopsgraysmm/227atsmos/"
  },
  {
    name: "SJB Varsity Y",
    status: "Completed",
    date: "Feb 12, 2026",
    link: "https://photos.grayfx.cam/stjohnsy/"
  },
  {
    name: "Saint Mark's Basketball",
    status: "Completed",
    date: "Feb 12, 2026",
    link: "https://photos.grayfx.cam/saintmarksvsstesbball/"
  }
];

export default photoshoots;
