import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  centerHeader?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  showCloseButton = true,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  centerHeader = false,
}) => {

  // Handle escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm:   'max-w-md',
    md:   'max-w-2xl',
    lg:   'max-w-4xl',
    xl:   'max-w-6xl',
    full: 'max-w-7xl',
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!closeOnOutsideClick) return;
    if (e.target === e.currentTarget) onClose();
  };

  return (
    // ✅ z-[9999] memastikan modal selalu di atas sidebar & elemen lainnya
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* ✅ Backdrop terpisah, cover full screen termasuk sidebar */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal content */}
      <div
        className={`
          relative z-10
          bg-zinc-900 border border-zinc-800 shadow-2xl
          w-full ${sizeClasses[size]}
          flex flex-col rounded-2xl
          max-h-[90vh]
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`relative flex px-4 py-4 sm:p-6 border-b border-zinc-800 flex-shrink-0 ${centerHeader ? 'justify-center' : 'items-center justify-between'}`}>
          <div className={centerHeader ? 'text-center' : 'flex-1'}>
            <h2 className="text-lg sm:text-2xl font-bold text-white">{title}</h2>
            {subtitle && (
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">{subtitle}</p>
            )}
          </div>
          {showCloseButton && (
            <button
              onClick={onClose}
              className={`p-2 hover:bg-zinc-800 rounded-lg transition-colors ${centerHeader ? 'absolute right-4 top-4 sm:right-5 sm:top-5' : 'ml-4'}`}
              aria-label="Close modal"
            >
              <X className="text-white" size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:p-6">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex-shrink-0 px-4 py-4 sm:p-6 border-t border-zinc-800">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;