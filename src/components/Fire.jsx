// components/Fire.js
import { motion } from "framer-motion";

export const Fire = ({ size = 24 }) => {
  const flameVariants = {
    animate: {
      y: [0, -5, 0],
      scale: [1, 1.2, 1],
      rotate: [0, 5, -5, 0],
    },
  };

  return (
    <motion.div
      className="inline-block text-orange-400"
      style={{ fontSize: size }}
      animate={flameVariants.animate}
      transition={{ repeat: Infinity, duration: 0.6 }}
    >
      🔥
    </motion.div>
  );
};
