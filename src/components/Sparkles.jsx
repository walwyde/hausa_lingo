// components/Sparkles.js
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const SPARKLE_EMOJIS = ["✨", "🌟", "💫", "⭐"];

export const Sparkles = ({ count = 6, size = 20, style = {} }) => {
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    const generateSparkles = () => {
      const newSparkles = Array.from({ length: count }).map((_, i) => ({
        id: i,
        emoji: SPARKLE_EMOJIS[Math.floor(Math.random() * SPARKLE_EMOJIS.length)],
        x: Math.random() * 100,
        y: Math.random() * 100,
        scale: 0.5 + Math.random(),
        duration: 0.8 + Math.random() * 0.8,
        delay: Math.random() * 2,
      }));
      setSparkles(newSparkles);
    };
    generateSparkles();
    const interval = setInterval(generateSparkles, 3000);
    return () => clearInterval(interval);
  }, [count]);

  return (
    <div className="absolute pointer-events-none overflow-visible" style={style}>
      {sparkles.map((s) => (
        <motion.span
          key={s.id}
          className="absolute"
          style={{ left: `${s.x}%`, top: `${s.y}%`, fontSize: size }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, s.scale, 0] }}
          transition={{ duration: s.duration, repeat: Infinity, delay: s.delay }}
        >
          {s.emoji}
        </motion.span>
      ))}
    </div>
  );
};
