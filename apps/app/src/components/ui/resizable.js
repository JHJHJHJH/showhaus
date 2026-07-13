import * as React from "react";
import { FiMoreVertical } from "react-icons/fi";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function resolveSize(size, viewportWidth) {
  if (typeof size === "string" && size.endsWith("vw")) {
    return (viewportWidth * parseFloat(size)) / 100;
  }

  return size;
}

const ResizableContext = React.createContext(null);

function useResizableContext() {
  const context = React.useContext(ResizableContext);

  if (!context) {
    throw new Error("Resizable components must be used within a ResizablePanelGroup.");
  }

  return context;
}

const ResizablePanelGroup = React.forwardRef(
  (
    {
      children,
      className,
      direction = "horizontal",
      defaultSize = 360,
      minSize = 280,
      maxSize = 560,
      ...props
    },
    ref
  ) => {
    const [size, setSize] = React.useState(() => {
      if (typeof window === "undefined") {
        return defaultSize;
      }

      return resolveSize(defaultSize, window.innerWidth);
    });
    const groupRef = React.useRef(null);

    React.useImperativeHandle(ref, () => groupRef.current);

    const resizeFromPointer = React.useCallback(
      (event) => {
        if (direction !== "horizontal") {
          return;
        }

        event.preventDefault();

        const handlePointerMove = (moveEvent) => {
          const viewportWidth = window.innerWidth;
          const resolvedMinSize = resolveSize(minSize, viewportWidth);
          const resolvedMaxSize = resolveSize(maxSize, viewportWidth);
          const nextSize = viewportWidth - moveEvent.clientX;
          setSize(Math.min(resolvedMaxSize, Math.max(resolvedMinSize, nextSize)));
        };

        const handlePointerUp = () => {
          window.removeEventListener("pointermove", handlePointerMove);
          window.removeEventListener("pointerup", handlePointerUp);
        };

        window.addEventListener("pointermove", handlePointerMove);
        window.addEventListener("pointerup", handlePointerUp);
      },
      [direction, maxSize, minSize]
    );

    const value = React.useMemo(
      () => ({ direction, resizeFromPointer, size }),
      [direction, resizeFromPointer, size]
    );

    return (
      <ResizableContext.Provider value={value}>
        <div
          ref={groupRef}
          className={cx(
            "relative ml-auto flex h-full max-w-[calc(100vw-48px)] overflow-hidden rounded-none border-l border-slate-200 bg-white shadow-xl",
            direction === "horizontal" ? "flex-row" : "flex-col",
            className
          )}
          style={direction === "horizontal" ? { width: `${size}px` } : undefined}
          {...props}
        >
          {children}
        </div>
      </ResizableContext.Provider>
    );
  }
);
ResizablePanelGroup.displayName = "ResizablePanelGroup";

const ResizablePanel = React.forwardRef(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cx("min-w-0 flex-1 overflow-hidden", className)}
      {...props}
    />
  );
});
ResizablePanel.displayName = "ResizablePanel";

const ResizableHandle = React.forwardRef(({ className, withHandle = true, ...props }, ref) => {
  const { resizeFromPointer } = useResizableContext();

  return (
    <div
      ref={ref}
      className={cx(
        "group relative flex w-3 cursor-col-resize touch-none items-center justify-center border-r border-slate-200 bg-slate-50 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
        className
      )}
      onPointerDown={resizeFromPointer}
      role="separator"
      tabIndex={0}
      aria-orientation="vertical"
      {...props}
    >
      {withHandle ? (
        <div className="flex h-8 w-5 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-500 shadow-sm group-hover:text-slate-700">
          <FiMoreVertical className="h-4 w-4" aria-hidden="true" />
        </div>
      ) : null}
    </div>
  );
});
ResizableHandle.displayName = "ResizableHandle";

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };
