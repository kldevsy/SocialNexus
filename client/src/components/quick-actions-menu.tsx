import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Mic, 
  Paperclip, 
  AtSign, 
  FileImage,
  X 
} from "lucide-react";

interface QuickActionsMenuProps {
  onMicrophoneSelect: () => void;
  onFileSelect: () => void;
  onMentionSelect: () => void;
  onEmbedSelect: () => void;
}

export function QuickActionsMenu({ 
  onMicrophoneSelect, 
  onFileSelect, 
  onMentionSelect, 
  onEmbedSelect 
}: QuickActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const menuItems = [
    {
      id: 'microphone',
      icon: Mic,
      label: 'Gravar áudio',
      color: 'bg-red-500 hover:bg-red-600',
      action: onMicrophoneSelect,
    },
    {
      id: 'file',
      icon: Paperclip,
      label: 'Enviar arquivo',
      color: 'bg-blue-500 hover:bg-blue-600',
      action: onFileSelect,
    },
    {
      id: 'mention',
      icon: AtSign,
      label: 'Mencionar alguém',
      color: 'bg-green-500 hover:bg-green-600',
      action: onMentionSelect,
    },
    {
      id: 'embed',
      icon: FileImage,
      label: 'Criar embed',
      color: 'bg-purple-500 hover:bg-purple-600',
      action: onEmbedSelect,
    },
  ];

  const handleItemClick = (action: () => void) => {
    action();
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative">
      {/* Trigger Button */}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className={`h-11 px-3 transition-all duration-200 ${
          isOpen ? 'bg-gray-100 border-gray-300' : ''
        }`}
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <Plus className="h-4 w-4" />
        </motion.div>
      </Button>

      {/* Menu Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute bottom-full mb-2 left-0 bg-white rounded-lg shadow-lg border border-gray-200 p-3 min-w-[200px] z-50 backdrop-blur-sm"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700">Ações Rápidas</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-6 w-6 p-0 hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            {/* Menu Items */}
            <div className="grid grid-cols-2 gap-2">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.15 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleItemClick(item.action)}
                  className="flex flex-col items-center p-3 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center mb-2 text-white shadow-sm group-hover:shadow-md transition-shadow duration-200`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-medium text-gray-600 text-center leading-tight">
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </div>

            {/* Tooltip Arrow */}
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-200"></div>
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white transform translate-y-[-1px]"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}