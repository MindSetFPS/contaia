import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

function Card({
  className,
  ...props
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({
  className,
  ...props
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

function CardTitle({
  className,
  ...props
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <h3
      className={cn("font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <p className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

function CardContent({
  className,
  ...props
}: {
  className?: string;
  children?: ReactNode;
}) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent };
