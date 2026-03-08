import { motion } from "framer-motion";
import heroBg1 from "@/assets/hero-bg-1.jpg";
import heroBg2 from "@/assets/hero-bg-2.jpg";
import heroBg3 from "@/assets/hero-bg-3.jpg";
import collage4 from "@/assets/collage-4.jpg";
import collage5 from "@/assets/collage-5.jpg";
import collage6 from "@/assets/collage-6.jpg";

const galleryImages = [
  { src: heroBg1, title: "Golden Hour", category: "Landscape" },
  { src: heroBg2, title: "City Lights", category: "Street" },
  { src: collage4, title: "Autumn Portrait", category: "Portrait" },
  { src: collage5, title: "Lines & Shadows", category: "Architecture" },
  { src: heroBg3, title: "Morning Dew", category: "Macro" },
  { src: collage6, title: "Ocean Sunset", category: "Landscape" },
];

const GalleryGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {galleryImages.map((img, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, delay: i * 0.1 }}
          className="group relative overflow-hidden rounded-sm aspect-[4/3] cursor-pointer"
        >
          <img
            src={img.src}
            alt={img.title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-colors duration-300 flex items-end p-4">
            <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <p className="text-xs font-body uppercase tracking-widest text-primary">{img.category}</p>
              <p className="font-display text-lg text-foreground">{img.title}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default GalleryGrid;
