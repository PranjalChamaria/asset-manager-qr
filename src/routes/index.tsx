import { createFileRoute } from "@tanstack/react-router";
import { AssetsPage } from "@/components/AssetsPage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Asset Command" },
      { name: "description", content: "Track and manage all your company assets with QR codes and barcodes." },
    ],
  }),
  component: AssetsPage,
});
