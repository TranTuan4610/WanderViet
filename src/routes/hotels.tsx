import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/hotels")({
  component: HotelsLayout,
});

function HotelsLayout() {
  return <Outlet />;
}
