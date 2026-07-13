import React from "react";
import { createPortal } from "react-dom";

const DrawerContext = React.createContext(null);

function useDrawerContext() {
  const context = React.useContext(DrawerContext);

  if (!context) {
    throw new Error("Drawer components must be used within a Drawer.");
  }

  return context;
}

export function Drawer({ children, open, onOpenChange }) {
  React.useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  const value = React.useMemo(
    () => ({ open, onOpenChange }),
    [open, onOpenChange]
  );

  return (
    <DrawerContext.Provider value={value}>{children}</DrawerContext.Provider>
  );
}

export function DrawerTrigger({ asChild = false, children, ...props }) {
  const { onOpenChange } = useDrawerContext();

  const triggerProps = {
    ...props,
    onClick: (event) => {
      props.onClick?.(event);
      onOpenChange(true);
    },
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...triggerProps,
      ...children.props,
      onClick: (event) => {
        children.props.onClick?.(event);
        triggerProps.onClick(event);
      },
    });
  }

  return <button {...triggerProps}>{children}</button>;
}

export function DrawerClose({ asChild = false, children, ...props }) {
  const { onOpenChange } = useDrawerContext();

  const closeProps = {
    ...props,
    onClick: (event) => {
      props.onClick?.(event);
      onOpenChange(false);
    },
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...closeProps,
      ...children.props,
      onClick: (event) => {
        children.props.onClick?.(event);
        closeProps.onClick(event);
      },
    });
  }

  return <button {...closeProps}>{children}</button>;
}

export function DrawerPortal({ children }) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

export function DrawerOverlay({ className = "" }) {
  const { onOpenChange } = useDrawerContext();

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] ${className}`}
      onClick={() => onOpenChange(false)}
    />
  );
}

export function DrawerContent({ children, className = "" }) {
  const { open } = useDrawerContext();

  if (!open) {
    return null;
  }

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <div
        aria-modal="true"
        className={`fixed inset-x-0 bottom-0 z-50 flex max-h-[80vh] flex-col rounded-t-[28px] border border-slate-200 bg-white shadow-2xl ${className}`}
        role="dialog"
      >
        <div className="mx-auto mt-3 h-1.5 w-14 rounded-full bg-slate-300" />
        {children}
      </div>
    </DrawerPortal>
  );
}

export function DrawerHeader({ children, className = "" }) {
  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function DrawerTitle({ children, className = "" }) {
  return (
    <h2 className={`text-base font-semibold tracking-tight text-slate-900 ${className}`}>
      {children}
    </h2>
  );
}
