import heroBg1 from "@/assets/hero-bg-1.jpg";
import heroBg2 from "@/assets/hero-bg-2.jpg";
import heroBg3 from "@/assets/hero-bg-3.jpg";
import collage4 from "@/assets/collage-4.jpg";
import collage5 from "@/assets/collage-5.jpg";
import collage6 from "@/assets/collage-6.jpg";
import grid7 from "@/assets/grid-7.jpg";
import grid8 from "@/assets/grid-8.jpg";
import grid9 from "@/assets/grid-9.jpg";
import grid10 from "@/assets/grid-10.jpg";
import grid11 from "@/assets/grid-11.jpg";
import grid12 from "@/assets/grid-12.jpg";
import grid13 from "@/assets/grid-13.jpg";
import grid14 from "@/assets/grid-14.jpg";

const images = [
  heroBg1, grid7, collage4, grid10, collage6,
  grid9, heroBg2, grid12, grid14, heroBg3,
  grid8, collage5, grid11, grid13, heroBg1,
  grid10, grid7, collage4, grid9, grid12,
];

const PhotoCollage = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-[-15%] grid grid-cols-5 gap-2 p-2"
        style={{ transform: "rotate(-3deg) scale(1.2)" }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-[2px] aspect-[4/5]"
            style={{
              filter: "blur(1.5px) brightness(0.3) saturate(0.7)",
            }}
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-background/55" />
    </div>
  );
};

export default PhotoCollage;
