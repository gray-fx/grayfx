import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Paste the same image imports / URLs your PhotoCollage uses
const SLIDES: string[] = [
  // e.g. img1, img2, img3...
];

const INTERVAL = 5000; // ms per slide

const HeroSlideshow = () => {
  const [index, setIndex] = useState(0);

  // Preload so slides never pop in
  useEffect(() => {
    SLIDES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  useEffect(() => {
    if (SLIDES.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(id);
  }, [index]); // resets the timer if you click a dot

  return (
    <div className="absolute inset-0 overflow-hidden bg-background">
      <AnimatePresence initial={false}>
        <motion.img
          key={index}
          src={SLIDES[index]}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1.2 },
            scale: { duration: INTERVAL / 1000 + 1.2, ease: "linear" }, // slow zoom-out
          }}
        />
      </AnimatePresence>

      {SLIDES.length > 1 && (
        <div className="absolute bottom-6 right-6 z-10 flex gap-2">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-primary" : "w-1.5 bg-foreground/40 hover:bg-foreground/70"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlideshow;
