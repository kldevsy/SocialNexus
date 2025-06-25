import { motion } from "framer-motion";

interface TypingDotsProps {
  size?: "small" | "medium" | "large";
  color?: string;
}

export function TypingDots({ size = "medium", color = "rgb(107, 114, 128)" }: TypingDotsProps) {
  const dotSizes = {
    small: "w-1 h-1",
    medium: "w-1.5 h-1.5", 
    large: "w-2 h-2"
  };
  
  const containerSizes = {
    small: "w-6 h-6",
    medium: "w-8 h-8",
    large: "w-10 h-10"
  };

  const dotVariants = {
    initial: { scale: 1, opacity: 0.5 },
    animate: { 
      scale: [1, 1.3, 1], 
      opacity: [0.5, 1, 0.5] 
    }
  };

  return (
    <div className={`${containerSizes[size]} bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center`}>
      <div className="flex space-x-1">
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className={`${dotSizes[size]} rounded-full`}
            style={{ backgroundColor: color }}
            variants={dotVariants}
            initial="initial"
            animate="animate"
            transition={{
              duration: 1.4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: index * 0.2
            }}
          />
        ))}
      </div>
    </div>
  );
}