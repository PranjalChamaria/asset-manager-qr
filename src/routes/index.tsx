import { createFileRoute } from "@tanstack/react-router";
import { AssetsPage } from "@/components/AssetsPage";

export const Route = createFileRoute("/")({
  component: AssetsPage,
});
