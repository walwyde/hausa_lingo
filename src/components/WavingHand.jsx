// components/WavingHand.js
import { motion } from "framer-motion";

export const WavingHand = ({ size = 24 }) => {
  return (
    <motion.span
      className="inline-block"
      style={{ fontSize: size }}
      animate={{ rotate: [0, 20, -10, 20, 0] }}
      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
    >
      👋
    </motion.span>
  );
};
