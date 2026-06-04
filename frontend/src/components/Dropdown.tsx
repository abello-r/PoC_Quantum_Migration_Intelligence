import { type CSSProperties, useEffect, useId, useLayoutEffect, useRef, useState } from "react";

const VIEWPORT_PADDING = 12;
const DEFAULT_MENU_MIN_WIDTH = 136;
const COLUMN_FILTER_MENU_MIN_WIDTH = 220;
const MENU_MAX_HEIGHT = 260;
const OPTION_HEIGHT = 36;
const MENU_VERTICAL_GAP = 6;

type DropdownOption<T extends string | number> = {
  label: string;
  value: T;
};

type DropdownProps<T extends string | number> = {
  ariaLabel: string;
  options: readonly DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  leadingIcon?: "filter";
  iconOnly?: boolean;
  isActive?: boolean;
};

export function Dropdown<T extends string | number>({
  ariaLabel,
  options,
  value,
  onChange,
  className,
  leadingIcon,
  iconOnly,
  isActive
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const menuId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  useLayoutEffect(() => {
    if (!isOpen) {
      return;
    }

    const updateMenuPosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();

      if (!rect) {
        return;
      }

      setMenuStyle(getMenuStyle(rect, options.length, containerRef.current?.classList.contains("column-filter-menu") ?? false));
    };

    updateMenuPosition();

    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen, options.length]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className={["select-menu", className].filter(Boolean).join(" ")}>
      <button
        ref={triggerRef}
        type="button"
        className={["select-trigger", iconOnly ? "icon-only" : "", isActive ? "active" : ""].filter(Boolean).join(" ")}
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`${ariaLabel}: ${selectedOption.label}`}
        onClick={() => setIsOpen((current) => !current)}
      >
        {leadingIcon === "filter" || iconOnly ? <FilterIcon /> : null}
        {iconOnly ? null : <span className="select-trigger-label">{selectedOption.label}</span>}
        {iconOnly ? null : <ChevronDownIcon />}
      </button>
      {isOpen ? (
        <div id={menuId} className="select-options" role="listbox" aria-label={ariaLabel} style={menuStyle}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function getMenuStyle(rect: DOMRect, optionCount: number, isColumnFilter: boolean): CSSProperties {
  const availableWidth = window.innerWidth - VIEWPORT_PADDING * 2;
  const minWidth = Math.max(rect.width, isColumnFilter ? COLUMN_FILTER_MENU_MIN_WIDTH : DEFAULT_MENU_MIN_WIDTH);
  const width = Math.min(minWidth, availableWidth);
  const left = Math.min(Math.max(rect.left, VIEWPORT_PADDING), window.innerWidth - width - VIEWPORT_PADDING);
  const preferredHeight = Math.min(MENU_MAX_HEIGHT, optionCount * OPTION_HEIGHT + 8);
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING;
  const spaceAbove = rect.top - VIEWPORT_PADDING;
  const opensUp = spaceBelow < Math.min(preferredHeight, 180) && spaceAbove > spaceBelow;
  const availableHeight = Math.max(0, (opensUp ? spaceAbove : spaceBelow) - MENU_VERTICAL_GAP);
  const menuHeight = Math.min(preferredHeight, Math.max(OPTION_HEIGHT, availableHeight));
  const top = opensUp ? Math.max(VIEWPORT_PADDING, rect.top - menuHeight - MENU_VERTICAL_GAP) : rect.bottom + MENU_VERTICAL_GAP;

  return {
    top,
    left,
    minWidth: width,
    maxWidth: availableWidth,
    maxHeight: menuHeight
  };
}

function FilterIcon() {
  return (
    <svg className="select-trigger-filter-icon" aria-hidden="true" viewBox="0 0 16 16" focusable="false">
      <path d="M2.5 3.5h11L9.2 8.4v3.2l-2.4 1V8.4L2.5 3.5Z" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg className="select-trigger-icon" aria-hidden="true" viewBox="0 0 16 16" focusable="false">
      <path d="M4.5 6.25 8 9.75l3.5-3.5" />
    </svg>
  );
}
