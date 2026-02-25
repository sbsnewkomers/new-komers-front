import * as React from "react";

export function Skeleton(props: React.HTMLAttributes<HTMLDivElement>) {
  const { className, ...rest } = props;
  return (
    <div
      className={"animate-pulse rounded-md bg-muted " + (className ?? "")}
      {...rest}
    />
  );
}
