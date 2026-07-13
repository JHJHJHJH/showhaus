import * as React from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const TabsContext = React.createContext(null);

function useTabsContext() {
  const context = React.useContext(TabsContext);

  if (!context) {
    throw new Error("Tabs components must be used within Tabs.");
  }

  return context;
}

const Tabs = React.forwardRef(
  ({ children, className, defaultValue, value, onValueChange, ...props }, ref) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const selectedValue = value ?? internalValue;

    const setSelectedValue = React.useCallback(
      (nextValue) => {
        if (value === undefined) {
          setInternalValue(nextValue);
        }

        onValueChange?.(nextValue);
      },
      [onValueChange, value]
    );

    const contextValue = React.useMemo(
      () => ({ selectedValue, setSelectedValue }),
      [selectedValue, setSelectedValue]
    );

    return (
      <TabsContext.Provider value={contextValue}>
        <div ref={ref} className={cx("w-full", className)} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = "Tabs";

const TabsList = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cx(
      "inline-flex h-11 items-center justify-center rounded-xl bg-slate-200/50 p-1 text-slate-500",
      className
    )}
    role="tablist"
    {...props}
  />
));
TabsList.displayName = "TabsList";

const TabsTrigger = React.forwardRef(
  ({ children, className, value, ...props }, ref) => {
    const { selectedValue, setSelectedValue } = useTabsContext();
    const selected = selectedValue === value;

    return (
      <button
        ref={ref}
        aria-selected={selected}
        className={cx(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50",
          selected
            ? "bg-white text-slate-950 shadow-md"
            : "text-slate-600 hover:bg-white/40 hover:text-slate-900",
          className
        )}
        onClick={() => setSelectedValue(value)}
        role="tab"
        type="button"
        {...props}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

const TabsContent = React.forwardRef(
  ({ children, className, value, ...props }, ref) => {
    const { selectedValue } = useTabsContext();

    if (selectedValue !== value) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cx("mt-4 focus-visible:outline-none", className)}
        role="tabpanel"
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };
