import heroBg1 from "@/assets/hero-bg-1.jpg";
import heroBg2 from "@/assets/hero-bg-2.jpg";
import heroBg3 from "@/assets/hero-bg-3.jpg";
import collage4 from "@/assets/collage-4.jpg";
import collage5 from "@/assets/collage-5.jpg";
import collage6 from "@/assets/collage-6.jpg";

const images = [heroBg1, heroBg2, collage4, collage5, heroBg3, collage6];

const rotations = [-3, 2, -2, 4, -4, 3];

const PhotoCollage = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-[-10%] grid grid-cols-3 grid-rows-2 gap-3 p-4"
        style={{ transform: "rotate(-4deg) scale(1.15)" }}
      >
        {images.map((src, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-sm"
            style={{
              transform: `rotate(${rotations[i]}deg)`,
              filter: "blur(2px) brightness(0.35)",
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
      <div className="absolute inset-0 bg-background/60" />
    </div>
  );
};

export default PhotoCollage;
