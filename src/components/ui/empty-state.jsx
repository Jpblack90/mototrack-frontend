import * as React from "react";
import { cn } from "cn";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact = false,
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "py-6 px-3" : "py-10 px-4",
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            "rounded-full bg-muted/60 border border-border/60 flex items-center justify-center text-muted-foreground",
            compact ? "w-8 h-8 mb-2" : "w-11 h-11 mb-3"
          )}
        >
          <Icon className={compact ? "w-4 h-4" : "w-5 h-5"} />
        </div>
      )}
      {title && (
        <p
          className={cn(
            "font-semibold text-foreground",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {title}
        </p>
      )}
      {description && (
        <p
          className={cn(
            "text-muted-foreground mt-1 max-w-sm",
            compact ? "text-[11px]" : "text-xs"
          )}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export default EmptyState;
