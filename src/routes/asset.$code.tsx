import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Package } from "lucide-react";
import type { Asset } from "@/lib/asset-types";
import { daysUntil } from "@/lib/asset-types";

const db = supabase as unknown as { from: (t: string) => any };

export const Route = createFileRoute("/asset/$code")({
  ssr: false,
  head: ({ params }) => ({
    meta: [
      { title: `Asset ${params.code}` },
      { name: "description", content: `Asset details for ${params.code}` },
    ],
  }),
  component: AssetDetail,
});

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-3 py-2.5 border-b last:border-0">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="col-span-2 text-sm font-medium">{value || <span className="text-muted-foreground">—</span>}</div>
    </div>
  );
}

function AssetDetail() {
  const { code } = useParams({ from: "/asset/$code" });
  const { data, isLoading, error } = useQuery({
    queryKey: ["asset", code],
    queryFn: async (): Promise<Asset | null> => {
      const { data, error } = await db.from("assets").select("*").eq("asset_code", code).maybeSingle();
      if (error) throw error;
      return data as Asset | null;
    },
  });

  if (isLoading) return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  if (error) return <div className="min-h-screen grid place-items-center text-destructive">Error loading asset</div>;
  if (!data) return (
    <div className="min-h-screen grid place-items-center">
      <div className="text-center">
        <p className="text-lg font-semibold">Asset not found</p>
        <p className="text-sm text-muted-foreground mb-4">No record matches {code}</p>
        <Link to="/"><Button>Back to assets</Button></Link>
      </div>
    </div>
  );

  const days = daysUntil(data.warranty_expiry);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-4 flex items-center gap-3">
          <Link to="/"><Button variant="ghost" size="icon"><ArrowLeft className="size-4" /></Button></Link>
          <div className="size-9 rounded-lg bg-primary text-primary-foreground grid place-items-center">
            <Package className="size-4" />
          </div>
          <div>
            <h1 className="text-lg font-bold">{data.asset_name}</h1>
            <p className="text-xs font-mono text-muted-foreground">{data.asset_code}</p>
          </div>
          <Badge className="ml-auto" variant={data.status === "Active" ? "default" : "secondary"}>{data.status}</Badge>
        </div>
      </header>
      <main className="container mx-auto px-6 py-6 max-w-3xl">
        <div className="border rounded-lg bg-card p-5">
          <h2 className="font-semibold mb-2 text-sm uppercase tracking-wider text-muted-foreground">Asset Details</h2>
          <Row label="Company" value={data.company} />
          <Row label="Asset Code" value={<span className="font-mono">{data.asset_code}</span>} />
          <Row label="Asset Name" value={data.asset_name} />
          <Row label="Category" value={data.category} />
          <Row label="Brand" value={data.brand} />
          <Row label="Model Number" value={data.model_number} />
          <Row label="Serial Number" value={<span className="font-mono">{data.serial_number}</span>} />
          <Row label="Purchase Date" value={data.purchase_date} />
          <Row label="Purchase Price" value={data.purchase_price != null ? `₹ ${data.purchase_price}` : null} />
          <Row label="Vendor" value={data.vendor} />
          <Row label="Department" value={data.department} />
          <Row label="Location" value={data.location} />
          <Row label="Warranty Period" value={data.warranty_months ? `${data.warranty_months} months` : null} />
          <Row label="Warranty Expiry" value={data.warranty_expiry} />
          <Row label="Remaining Days" value={
            days !== null ? (
              <span className={days < 0 ? "text-destructive" : days < 30 ? "text-amber-600" : ""}>
                {days < 0 ? `Expired ${-days} days ago` : `${days} days`}
              </span>
            ) : null
          } />
          <Row label="Status" value={data.status} />
          <Row label="Remarks" value={data.remarks} />
        </div>
      </main>
    </div>
  );
}