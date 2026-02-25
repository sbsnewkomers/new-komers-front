import * as React from "react";

export function Avatar(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div
      className={"relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full " + (className ?? "")}
      {...rest}
    />
  );
}

export function AvatarImage(props: React.ImgHTMLAttributes<HTMLImageElement>) {
  const { className, ...rest } = props;
  return <img className={"aspect-square h-full w-full object-cover " + (className ?? "")} {...rest} />;
}

export function AvatarFallback(props: React.HTMLAttributes<HTMLSpanElement>) {
  const { className, ...rest } = props;
  return (
    <span
      className={
        "flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground " +
        (className ?? "")
      }
      {...rest}
    />
  );
}
