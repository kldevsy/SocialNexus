import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

interface EmbedData {
  title?: string;
  description?: string;
  color?: string;
  url?: string;
  thumbnail?: string;
  image?: string;
  authorName?: string;
  authorIcon?: string;
  authorUrl?: string;
  footerText?: string;
  footerIcon?: string;
  timestamp?: boolean;
  fields?: EmbedField[];
}

interface EmbedMessageProps {
  embedData: EmbedData;
  createdAt: string;
}

export function EmbedMessage({ embedData, createdAt }: EmbedMessageProps) {
  if (!embedData) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mt-2 max-w-full"
    >
      <div 
        className="bg-white rounded-lg p-4 border-l-4 shadow-sm relative overflow-hidden"
        style={{ borderLeftColor: embedData.color || '#3b82f6' }}
      >
        {/* Background gradient effect */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{ 
            background: `linear-gradient(135deg, ${embedData.color || '#3b82f6'} 0%, transparent 50%)` 
          }}
        />
        
        <div className="relative">
          {/* Author */}
          {embedData.authorName && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-2 mb-2"
            >
              {embedData.authorIcon && (
                <img 
                  src={embedData.authorIcon} 
                  alt="" 
                  className="w-5 h-5 rounded-full ring-2 ring-white shadow-sm"
                />
              )}
              <span className="text-sm font-medium text-gray-800">
                {embedData.authorUrl ? (
                  <a 
                    href={embedData.authorUrl} 
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {embedData.authorName}
                  </a>
                ) : (
                  embedData.authorName
                )}
              </span>
            </motion.div>
          )}

          {/* Title */}
          {embedData.title && (
            <motion.h3
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="font-bold text-lg mb-2 leading-tight"
              style={{ color: embedData.color || '#3b82f6' }}
            >
              {embedData.url ? (
                <a 
                  href={embedData.url} 
                  className="hover:underline transition-all duration-200 hover:shadow-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {embedData.title}
                </a>
              ) : (
                embedData.title
              )}
            </motion.h3>
          )}

          {/* Description */}
          {embedData.description && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-700 mb-3 whitespace-pre-wrap leading-relaxed"
            >
              {embedData.description}
            </motion.p>
          )}

          {/* Fields */}
          {embedData.fields && embedData.fields.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-3"
            >
              <div className="grid gap-3">
                {embedData.fields.map((field, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + index * 0.05 }}
                    className={`${
                      field.inline 
                        ? 'inline-block w-1/2 pr-3 align-top' 
                        : 'block w-full'
                    } mb-2`}
                  >
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:border-gray-200 transition-colors">
                      <div className="font-semibold text-sm text-gray-900 mb-1 flex items-center">
                        <span className="mr-2 opacity-60">{field.inline ? '▸' : '▼'}</span>
                        {field.name}
                      </div>
                      <div className="text-sm text-gray-700 leading-relaxed">
                        {field.value}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Image */}
          {embedData.image && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.35 }}
              className="mb-3 overflow-hidden rounded-lg border border-gray-200"
            >
              <img 
                src={embedData.image} 
                alt="" 
                className="max-w-full h-auto transition-transform duration-300 hover:scale-105"
                loading="lazy"
              />
            </motion.div>
          )}

          {/* Footer */}
          {(embedData.footerText || embedData.timestamp) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between pt-3 border-t border-gray-100"
            >
              <div className="flex items-center space-x-2">
                {embedData.footerIcon && (
                  <img 
                    src={embedData.footerIcon} 
                    alt="" 
                    className="w-4 h-4 rounded-full ring-1 ring-gray-200"
                  />
                )}
                {embedData.footerText && (
                  <span className="text-xs text-gray-500 font-medium">
                    {embedData.footerText}
                  </span>
                )}
              </div>
              {embedData.timestamp && (
                <span className="text-xs text-gray-400">
                  {format(new Date(createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              )}
            </motion.div>
          )}

          {/* Thumbnail */}
          {embedData.thumbnail && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.45, type: "spring", stiffness: 200 }}
              className="absolute top-4 right-4"
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                <img 
                  src={embedData.thumbnail} 
                  alt="" 
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}