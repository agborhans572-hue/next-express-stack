import type { ReactNode } from "react";
import ToolLayout from "./ToolLayout";
import "./public-pages.css";

export default function PublicPageLayout({
  page,
  children,
}: {
  page: string;
  children: ReactNode;
}) {
  return (
    <ToolLayout page={page}>
      <div className="tool-public-page">{children}</div>
    </ToolLayout>
  );
}
