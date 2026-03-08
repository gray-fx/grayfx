import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ScrollSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

const ScrollSection = ({ children, className = "", delay = 0 }: ScrollSectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.section>
  );
};

export default ScrollSection;
