import { motion } from "framer-motion";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface EmbedField {
  name: string;
  value: string;
  inline: boolean;
}

interface EmbedButton {
  id: string;
  label: string;
  style: 'primary' | 'secondary' | 'success' | 'danger' | 'link';
  url?: string;
  emoji?: string;
  disabled?: boolean;
  position: 'bottom' | 'top-above' | 'top-below';
}

interface EmbedProgressBar {
  id: string;
  label: string;
  value: number;
  max: number;
  style: 'default' | 'striped' | 'animated' | 'gradient';
  color: string;
}

interface EmbedData {
  title?: string;
  description?: string;
  color?: string;
  colorPulsing?: boolean;
  url?: string;
  thumbnail?: string;
  image?: string;
  imagePosition?: 'current' | 'above-title' | 'below-title';
  imageSpoiler?: boolean;
  imageExplicit?: boolean;
  authorName?: string;
  authorIcon?: string;
  authorUrl?: string;
  footerText?: string;
  footerIcon?: string;
  timestamp?: boolean;
  fields?: EmbedField[];
  buttons?: EmbedButton[];
  progressBars?: EmbedProgressBar[];
}

interface EmbedMessageProps {
  embedData: EmbedData;
  createdAt: string;
}

export function EmbedMessage({ embedData, createdAt }: EmbedMessageProps) {
  console.log('EmbedMessage render:', { embedData, createdAt });
  
  if (!embedData) {
    console.log('EmbedMessage: No embedData provided');
    return null;
  }

  // Parse embedData if it's a JSON string
  let parsedEmbedData: EmbedData;
  try {
    if (typeof embedData === 'string') {
      parsedEmbedData = JSON.parse(embedData);
      console.log('EmbedMessage: Parsed embedData from string:', parsedEmbedData);
    } else {
      parsedEmbedData = embedData;
    }
  } catch (error) {
    console.error('EmbedMessage: Error parsing embedData:', error);
    return null;
  }

  // Helper function to render buttons by position
  const renderButtonsByPosition = (position: 'bottom' | 'top-above' | 'top-below') => {
    const buttonsAtPosition = parsedEmbedData.buttons?.filter(button => button.position === position) || [];
    
    if (buttonsAtPosition.length === 0) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: position === 'top-above' ? -10 : 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-3"
      >
        <div className="flex flex-wrap gap-2">
          {buttonsAtPosition.map((button, index) => {
            const getButtonStyle = (style: string) => {
              switch (style) {
                case 'primary':
                  return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600';
                case 'secondary':
                  return 'bg-gray-500 hover:bg-gray-600 text-white border-gray-500';
                case 'success':
                  return 'bg-green-600 hover:bg-green-700 text-white border-green-600';
                case 'danger':
                  return 'bg-red-600 hover:bg-red-700 text-white border-red-600';
                case 'link':
                  return 'bg-transparent hover:bg-gray-100 text-blue-600 border-blue-600';
                default:
                  return 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600';
              }
            };

            return (
              <motion.button
                key={button.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.45 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`
                  px-4 py-2 rounded-lg border text-sm font-medium 
                  transition-all duration-200 shadow-sm hover:shadow-md
                  ${getButtonStyle(button.style)}
                  ${button.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                onClick={() => {
                  if (!button.disabled && button.url) {
                    window.open(button.url, '_blank', 'noopener,noreferrer');
                  }
                }}
                disabled={button.disabled}
              >
                {button.emoji && <span className="mr-1">{button.emoji}</span>}
                {button.label}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    );
  };

  // Helper function to render image with spoiler/explicit handling
  const renderImage = (className = "mb-3 overflow-hidden rounded-lg border border-gray-200") => {
    if (!parsedEmbedData.image) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.35 }}
        className={className}
      >
        {(parsedEmbedData.imageSpoiler || parsedEmbedData.imageExplicit) && (
          <div className="bg-gray-100 p-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              {parsedEmbedData.imageSpoiler && (
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-medium">
                  SPOILER
                </span>
              )}
              {parsedEmbedData.imageExplicit && (
                <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-medium">
                  +18
                </span>
              )}
              <span>Clique para revelar</span>
            </div>
          </div>
        )}
        <img 
          src={parsedEmbedData.image} 
          alt="" 
          className={`max-w-full h-auto transition-transform duration-300 hover:scale-105 ${
            (parsedEmbedData.imageSpoiler || parsedEmbedData.imageExplicit) ? 'blur-sm hover:blur-none' : ''
          }`}
          loading="lazy"
        />
      </motion.div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="mt-2 max-w-full"
    >
      <div 
        className="bg-white rounded-lg p-4 border-l-4 shadow-sm relative overflow-hidden"
        style={{ borderLeftColor: parsedEmbedData.color || '#3b82f6' }}
      >
        {/* Background gradient effect */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{ 
            background: `linear-gradient(135deg, ${parsedEmbedData.color || '#3b82f6'} 0%, transparent 50%)` 
          }}
        />
        
        <div className="relative">
          {/* Author */}
          {parsedEmbedData.authorName && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center space-x-2 mb-2"
            >
              {parsedEmbedData.authorIcon && (
                <img 
                  src={parsedEmbedData.authorIcon} 
                  alt="" 
                  className="w-5 h-5 rounded-full ring-2 ring-white shadow-sm"
                />
              )}
              <span className="text-sm font-medium text-gray-800">
                {parsedEmbedData.authorUrl ? (
                  <a 
                    href={parsedEmbedData.authorUrl} 
                    className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {parsedEmbedData.authorName}
                  </a>
                ) : (
                  parsedEmbedData.authorName
                )}
              </span>
            </motion.div>
          )}

          {/* Buttons Above Title */}
          {renderButtonsByPosition('top-above')}

          {/* Image Above Title */}
          {parsedEmbedData.imagePosition === 'above-title' && renderImage()}

          {/* Title */}
          {parsedEmbedData.title && (
            <motion.h3
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="font-bold text-lg mb-2 leading-tight"
              style={{ color: parsedEmbedData.color || '#3b82f6' }}
            >
              {parsedEmbedData.url ? (
                <a 
                  href={parsedEmbedData.url} 
                  className="hover:underline transition-all duration-200 hover:shadow-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {parsedEmbedData.title}
                </a>
              ) : (
                parsedEmbedData.title
              )}
            </motion.h3>
          )}

          {/* Buttons Below Title */}
          {renderButtonsByPosition('top-below')}

          {/* Image Below Title */}
          {parsedEmbedData.imagePosition === 'below-title' && renderImage()}

          {/* Description */}
          {parsedEmbedData.description && (
            <motion.p
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-gray-700 mb-3 whitespace-pre-wrap leading-relaxed"
            >
              {parsedEmbedData.description}
            </motion.p>
          )}

          {/* Fields */}
          {parsedEmbedData.fields && parsedEmbedData.fields.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="mb-3"
            >
              <div className="grid gap-3">
                {parsedEmbedData.fields.map((field, index) => (
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

          {/* Image in Current Position */}
          {(!parsedEmbedData.imagePosition || parsedEmbedData.imagePosition === 'current') && renderImage()}

          {/* Progress Bars */}
          {parsedEmbedData.progressBars && parsedEmbedData.progressBars.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-3 space-y-3"
            >
              {parsedEmbedData.progressBars.map((progressBar, index) => {
                const percentage = Math.min(100, Math.max(0, (progressBar.value / progressBar.max) * 100));

                return (
                  <motion.div
                    key={progressBar.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.55 + index * 0.1 }}
                    className="bg-gray-50 rounded-lg p-3 border border-gray-100"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-800">
                        {progressBar.label}
                      </span>
                      <span className="text-xs text-gray-600">
                        {progressBar.value}/{progressBar.max}
                      </span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ delay: 0.6 + index * 0.1, duration: 1.2, ease: "easeOut" }}
                        className={`h-3 rounded-full relative overflow-hidden transition-all duration-300`}
                        style={{ 
                          backgroundColor: progressBar.color,
                          backgroundImage: progressBar.style === 'striped' 
                            ? `repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(255,255,255,0.3) 8px, rgba(255,255,255,0.3) 16px)`
                            : progressBar.style === 'gradient'
                            ? `linear-gradient(90deg, ${progressBar.color}, ${progressBar.color}cc, ${progressBar.color})`
                            : undefined,
                          animation: progressBar.style === 'animated' 
                            ? 'progress-pulse 2s ease-in-out infinite' 
                            : progressBar.style === 'striped'
                            ? 'progress-stripes 1s linear infinite'
                            : undefined
                        }}
                      >
                        {progressBar.style === 'animated' && (
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-40"
                            animate={{ x: ['-100%', '100%'] }}
                            transition={{ 
                              duration: 2, 
                              repeat: Infinity, 
                              ease: "linear",
                              delay: 0.8 + index * 0.1
                            }}
                          />
                        )}
                      </motion.div>
                    </div>
                    
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>0</span>
                      <span className="font-medium text-gray-700">
                        {percentage.toFixed(1)}%
                      </span>
                      <span>{progressBar.max}</span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {/* Buttons at Bottom */}
          {renderButtonsByPosition('bottom')}

          {/* Footer */}
          {(parsedEmbedData.footerText || parsedEmbedData.timestamp) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-between pt-3 border-t border-gray-100"
            >
              <div className="flex items-center space-x-2">
                {parsedEmbedData.footerIcon && (
                  <img 
                    src={parsedEmbedData.footerIcon} 
                    alt="" 
                    className="w-4 h-4 rounded-full ring-1 ring-gray-200"
                  />
                )}
                {parsedEmbedData.footerText && (
                  <span className="text-xs text-gray-500 font-medium">
                    {parsedEmbedData.footerText}
                  </span>
                )}
              </div>
              {parsedEmbedData.timestamp && (
                <span className="text-xs text-gray-400">
                  {format(new Date(createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              )}
            </motion.div>
          )}

          {/* Thumbnail */}
          {parsedEmbedData.thumbnail && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ delay: 0.45, type: "spring", stiffness: 200 }}
              className="absolute top-4 right-4"
            >
              <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                <img 
                  src={parsedEmbedData.thumbnail} 
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