import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface NeuSelectOption<T = string | number> {
  value: T;
  label: string;
  sublabel?: string;
  badge?: string | number;
  icon?: React.ReactNode;
  group?: string;
  disabled?: boolean;
}

export interface NeuSelectProps<T = string | number> {
  value: T;
  onChange: (value: T) => void;
  options: NeuSelectOption<T>[];
  placeholder?: string;
  icon?: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'flat' | 'inset';
  className?: string;
  dropdownClassName?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  disabled?: boolean;
  align?: 'left' | 'right' | 'auto';
  title?: string;
  fullWidth?: boolean;
  renderOption?: (option: NeuSelectOption<T>, isSelected: boolean) => React.ReactNode;
}

export function NeuSelect<T extends string | number>({
  value,
  onChange,
  options,
  placeholder = 'Chọn...',
  icon,
  size = 'md',
  variant = 'inset',
  className = '',
  dropdownClassName = '',
  searchable,
  searchPlaceholder = 'Tìm kiếm nhanh...',
  disabled = false,
  align = 'auto',
  title,
  fullWidth = false,
  renderOption,
}: NeuSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [computedAlign, setComputedAlign] = useState<'left' | 'right'>(align === 'right' ? 'right' : 'left');

  // Handle open and close transitions
  useEffect(() => {
    if (isOpen) {
      setIsMounted(true);
      const raf = requestAnimationFrame(() => {
        setIsVisible(true);
      });
      return () => cancelAnimationFrame(raf);
    } else if (isMounted) {
      setIsVisible(false);
      const timer = setTimeout(() => {
        setIsMounted(false);
      }, 160);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Compute smart alignment to avoid viewport overflow
  useEffect(() => {
    if (!isOpen) return;
    if (align === 'right') {
      setComputedAlign('right');
      return;
    }
    if (align === 'left') {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.left + 220 > window.innerWidth - 16) {
          setComputedAlign('right');
          return;
        }
      }
      setComputedAlign('left');
      return;
    }
    // Auto alignment:
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const screenWidth = window.innerWidth;
      if (rect.left + 220 > screenWidth - 16 || rect.left > screenWidth * 0.55) {
        setComputedAlign('right');
      } else {
        setComputedAlign('left');
      }
    }
  }, [isOpen, align]);

  // Auto-enable search if there are more than 7 options
  const isSearchable = searchable !== undefined ? searchable : options.length > 7;

  // Selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on ESC key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        setSearchQuery('');
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isOpen, isSearchable]);

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchSublabel = opt.sublabel?.toLowerCase().includes(q);
      const matchGroup = opt.group?.toLowerCase().includes(q);
      const matchBadge = String(opt.badge || '').toLowerCase().includes(q);
      return matchLabel || matchSublabel || matchGroup || matchBadge;
    });
  }, [options, searchQuery]);

  // Grouped options
  const groupedOptions = useMemo(() => {
    const groups: { [key: string]: NeuSelectOption<T>[] } = {};
    const ungrouped: NeuSelectOption<T>[] = [];

    filteredOptions.forEach((opt) => {
      if (opt.group) {
        if (!groups[opt.group]) groups[opt.group] = [];
        groups[opt.group].push(opt);
      } else {
        ungrouped.push(opt);
      }
    });

    return { groups, ungrouped };
  }, [filteredOptions]);

  // Size styling maps
  const sizeStyles = {
    xs: 'px-2 py-1 text-[11px] rounded-lg gap-1.5',
    sm: 'px-2.5 py-1.5 text-xs rounded-xl gap-2',
    md: 'px-3 py-2 text-xs rounded-xl gap-2',
    lg: 'px-4 py-2.5 text-sm rounded-2xl gap-2.5',
  };

  const variantStyles = {
    inset: 'neu-inset-sm hover:text-[var(--primary)]',
    flat: 'neu-flat-xs hover:neu-flat-sm hover:text-[var(--primary)]',
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block ${fullWidth ? 'w-full' : ''}`}
      title={title}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`flex items-center justify-between text-left transition-all duration-150 active:scale-[0.98] cursor-pointer font-medium select-none ${
          sizeStyles[size]
        } ${variantStyles[variant]} ${
          fullWidth ? 'w-full' : ''
        } ${
          isOpen ? 'ring-1 ring-[var(--primary)]/40 text-[var(--primary)]' : 'text-[var(--text-main)]'
        } ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
      >
        <div className="flex items-center gap-2 min-w-0 truncate">
          {icon && (
            <span className="shrink-0 text-[var(--primary)]">{icon}</span>
          )}
          {selectedOption?.icon && !icon && (
            <span className="shrink-0">{selectedOption.icon}</span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="shrink-0 px-1.5 py-0.5 text-[10px] font-mono rounded-md neu-inset-sm text-[var(--primary)] font-bold whitespace-nowrap inline-flex items-center">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 ml-1.5 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[var(--primary)]' : 'text-[var(--text-muted)]'
          }`}
        />
      </button>

      {/* Dropdown Floating Popover */}
      {isMounted && (
        <div
          className={`absolute ${
            computedAlign === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left'
          } top-full mt-2 z-50 min-w-[210px] max-w-[calc(100vw-32px)] neu-dropdown backdrop-blur-xl bg-[var(--bg)]/98 rounded-2xl p-1.5 shadow-2xl transition-all duration-150 ease-out ${
            isVisible
              ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
              : 'opacity-0 scale-95 -translate-y-1.5 pointer-events-none'
          } ${
            fullWidth ? 'w-full' : ''
          } ${dropdownClassName}`}
          style={{ maxHeight: '340px' }}
        >
          {/* Search bar inside dropdown */}
          {isSearchable && (
            <div className="p-1.5 pb-2 border-b border-[var(--shadow-dark)]/20">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-2.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl neu-inset-sm text-[var(--text-main)] placeholder-[var(--text-muted)]/50 focus:outline-none"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 p-0.5 text-[var(--text-muted)] hover:text-[var(--text-main)] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto max-h-56 py-1 space-y-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="py-4 text-center text-xs text-[var(--text-muted)] font-medium">
                Không tìm thấy lựa chọn phù hợp
              </div>
            ) : (
              <>
                {/* Ungrouped options */}
                {groupedOptions.ungrouped.map((opt) => renderOptionItem(opt))}

                {/* Grouped options */}
                {Object.entries(groupedOptions.groups).map(([groupName, groupOpts]) => (
                  <div key={groupName} className="pt-1.5 first:pt-0">
                    <div className="px-2.5 py-1 text-[10px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]/60" />
                      {groupName}
                    </div>
                    {groupOpts.map((opt) => renderOptionItem(opt))}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );

  function renderOptionItem(opt: NeuSelectOption<T>) {
    const isSelected = opt.value === value;

    if (renderOption) {
      return (
        <div
          key={String(opt.value)}
          onClick={() => {
            if (!opt.disabled) {
              onChange(opt.value);
              setIsOpen(false);
              setSearchQuery('');
            }
          }}
          className={`cursor-pointer ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          {renderOption(opt, isSelected)}
        </div>
      );
    }

    return (
      <button
        key={String(opt.value)}
        type="button"
        disabled={opt.disabled}
        onClick={() => {
          if (!opt.disabled) {
            onChange(opt.value);
            setIsOpen(false);
            setSearchQuery('');
          }
        }}
        className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-xl transition-all duration-150 active:scale-[0.98] cursor-pointer ${
          isSelected
            ? 'neu-inset-sm text-[var(--primary)] font-bold'
            : 'text-[var(--text-main)] hover:bg-slate-500/10 dark:hover:bg-slate-400/10 hover:text-[var(--primary)]'
        } ${opt.disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
          {opt.icon && <span className="shrink-0 text-[var(--primary)]">{opt.icon}</span>}
          <div className="min-w-0 flex-1">
            <div className="truncate font-medium">{opt.label}</div>
            {opt.sublabel && (
              <div className="text-[10px] text-[var(--text-muted)] truncate font-normal mt-0.5">
                {opt.sublabel}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {opt.badge && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-md neu-inset-sm text-[var(--primary)] font-bold whitespace-nowrap shrink-0 inline-flex items-center">
              {opt.badge}
            </span>
          )}
          {isSelected && (
            <Check className="w-3.5 h-3.5 text-[var(--primary)] shrink-0 stroke-[2.5]" />
          )}
        </div>
      </button>
    );
  }
}
