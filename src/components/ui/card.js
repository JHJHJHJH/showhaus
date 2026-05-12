import * as React from "react";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cx("rounded-md border border-slate-200 bg-white text-slate-950 shadow-sm", className)}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cx("flex flex-col space-y-1.5 p-4 pb-2", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ children, className, ...props }, ref) => (
  <h3 ref={ref} className={cx("text-sm font-semibold leading-none tracking-tight", className)} {...props}>
    {children}
  </h3>
));
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cx("p-4 pt-2", className)} {...props} />
));
CardContent.displayName = "CardContent";

export { Card, CardHeader, CardTitle, CardContent };
