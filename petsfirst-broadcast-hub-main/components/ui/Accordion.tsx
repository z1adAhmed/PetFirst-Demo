import React, { useState, ReactNode } from 'react';

export interface AccordionItemProps {
  id: string;
  title: string;
  description?: string;
  icon?: string | ReactNode;
  badge?: string;
  isCompleted?: boolean;
  isDisabled?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
  footer?: ReactNode;
  onToggle?: (isOpen: boolean) => void;
}

interface AccordionProps {
  items: AccordionItemProps[];
  allowMultiple?: boolean;
  controlledOpenItems?: Set<string>;
  onOpenItemsChange?: (openItems: Set<string>) => void;
}

const AccordionItem: React.FC<AccordionItemProps & { isControlled?: boolean; isOpen?: boolean }> = ({
  id,
  title,
  description,
  icon,
  badge,
  isCompleted = false,
  isDisabled = false,
  defaultOpen = false,
  children,
  footer,
  onToggle,
  isControlled = false,
  isOpen: controlledIsOpen,
}) => {
  const [internalIsOpen, setIsInternalOpen] = useState(defaultOpen);
  const isOpen = isControlled ? (controlledIsOpen ?? false) : internalIsOpen;

  const handleToggle = () => {
    if (isDisabled) return;
    const newState = !isOpen;
    if (!isControlled) {
      setIsInternalOpen(newState);
    }
    onToggle?.(newState);
  };

  return (
    <div className="bg-white rounded-xl md:rounded-2xl border border-slate-200 overflow-hidden transition-all duration-300">
      {/* Accordion Header */}
      <button
        onClick={handleToggle}
        disabled={isDisabled}
        className={`w-full flex items-center justify-between p-4 md:p-6 transition-all duration-300 ${
          isDisabled
            ? 'opacity-50 cursor-not-allowed'
            : 'hover:bg-slate-50 cursor-pointer'
        } ${isOpen ? 'bg-slate-50' : ''}`}
      >
        <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
          {/* Checkbox/Icon */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {isCompleted ? (
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg bg-green-500 flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-3 h-3 md:w-4 md:h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            ) : (
              <div className="w-5 h-5 md:w-6 md:h-6 rounded-lg border-2 border-slate-300 flex items-center justify-center flex-shrink-0">
                {isOpen && (
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                )}
              </div>
            )}

            {/* Icon */}
            {icon && (
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                {typeof icon === 'string' ? (
                  <span className="text-lg md:text-xl">{icon}</span>
                ) : (
                  icon
                )}
              </div>
            )}
          </div>

          {/* Title and Description */}
          <div className="flex-1 min-w-0 text-left">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h3 className="font-black text-slate-800 text-sm md:text-base truncate">
                {title}
              </h3>
              {badge && (
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] md:text-xs font-black rounded-lg whitespace-nowrap">
                  {badge}
                </span>
              )}
            </div>
            {description && (
              <p className="text-xs md:text-sm text-slate-500 truncate">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Chevron Icon */}
        <div className="ml-3 md:ml-4 flex-shrink-0">
          <svg
            className={`w-5 h-5 md:w-6 md:w-6 text-slate-400 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {/* Accordion Content */}
      {children && (
        <div
          className={`overflow-hidden transition-all duration-300 ${
            isOpen ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="p-4 md:p-6 pt-0 border-t border-slate-100">
            {children}
          </div>
        </div>
      )}

      {/* Accordion Footer - Always visible */}
      {footer && (
        <div className="p-4 md:p-6 pt-0 border-t border-slate-100 bg-slate-50">
          {footer}
        </div>
      )}
    </div>
  );
};

const Accordion: React.FC<AccordionProps> = ({
  items,
  allowMultiple = true,
  controlledOpenItems,
  onOpenItemsChange,
}) => {
  const [internalOpenItems, setInternalOpenItems] = useState<Set<string>>(
    new Set(items.filter((item) => item.defaultOpen).map((item) => item.id))
  );

  const isControlled = controlledOpenItems !== undefined;
  const openItems = isControlled ? controlledOpenItems! : internalOpenItems;

  const handleToggle = (id: string, isOpen: boolean) => {
    if (isControlled && onOpenItemsChange) {
      // Controlled mode - call parent handler
      if (allowMultiple) {
        const newSet = new Set(openItems);
        if (isOpen) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
        onOpenItemsChange(newSet);
      } else {
        onOpenItemsChange(isOpen ? new Set([id]) : new Set());
      }
    } else {
      // Uncontrolled mode - use internal state
      if (allowMultiple) {
        setInternalOpenItems((prev) => {
          const newSet = new Set(prev);
          if (isOpen) {
            newSet.add(id);
          } else {
            newSet.delete(id);
          }
          return newSet;
        });
      } else {
        setInternalOpenItems(isOpen ? new Set([id]) : new Set());
      }
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      {items.map((item) => (
        <AccordionItem
          key={item.id}
          {...item}
          isControlled={isControlled}
          isOpen={openItems.has(item.id)}
          defaultOpen={openItems.has(item.id)}
          onToggle={(isOpen) => {
            handleToggle(item.id, isOpen);
            item.onToggle?.(isOpen);
          }}
        />
      ))}
    </div>
  );
};

export default Accordion;
