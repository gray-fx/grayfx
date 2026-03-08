import heroBg1 from "@/assets/hero-bg-1.jpg";
import heroBg2 from "@/assets/hero-bg-2.jpg";
import heroBg3 from "@/assets/hero-bg-3.jpg";
import collage4 from "@/assets/collage-4.jpg";
import collage5 from "@/assets/collage-5.jpg";
import collage6 from "@/assets/collage-6.jpg";

const collageItems = [
  { src: heroBg1, rotate: -6, top: "5%", left: "2%", width: "35%", delay: 0 },
  { src: heroBg2, rotate: 4, top: "8%", right: "3%", width: "30%", delay: 0.1 },
  { src: collage4, rotate: -3, top: "30%", left: "15%", width: "25%", delay: 0.2 },
  { src: heroBg3, rotate: 7, top: "45%", right: "8%", width: "28%", delay: 0.3 },
  { src: collage5, rotate: -5, top: "55%", left: "5%", width: "30%", delay: 0.4 },
  { src: collage6, rotate: 3, top: "70%", right: "12%", width: "32%", delay: 0.5 },
];

const PhotoCollage = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {collageItems.map((item, i) => (
        <div
          key={i}
          className="absolute shadow-2xl shadow-black/40 border-2 border-border/20 overflow-hidden"
          style={{
            transform: `rotate(${item.rotate}deg)`,
            top: item.top,
            left: item.left,
            right: item.right,
            width: item.width,
            filter: "blur(2px) brightness(0.4)",
            opacity: 0.7,
          }}
        >
          <img
            src={item.src}
            alt=""
            className="w-full h-auto object-cover"
            loading="lazy"
          />
        </div>
      ))}
      {/* Overall dark overlay */}
      <div className="absolute inset-0 bg-background/70" />
    </div>
  );
};

export default PhotoCollage;
