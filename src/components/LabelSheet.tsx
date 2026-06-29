import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { Button } from "@/components/ui/button";
import type { Asset } from "@/lib/asset-types";
import { Printer } from "lucide-react";

function Label({ asset, url }: { asset: Asset; url: string }) {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (qrRef.current) {
      QRCode.toCanvas(qrRef.current, url, { width: 256, margin: 0 });
    }
    if (barRef.current) {
      JsBarcode(barRef.current, asset.asset_code, {
        format: "CODE128",
        displayValue: true,
        fontSize: 14,
        height: 36,
        margin: 0,
      });
    }
  }, [url, asset.asset_code]);

  return (
    <div
      className="label-card bg-white text-black border border-black/40 box-border overflow-hidden flex flex-col"
      style={{ width: "50.8mm", height: "38.1mm", padding: "2mm" }}
    >
      <div className="flex gap-[1.5mm] items-stretch flex-1 min-h-0">
        <canvas
          ref={qrRef}
          className="shrink-0 h-full w-auto"
          style={{ height: "22mm", width: "22mm" }}
        />
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="font-bold leading-tight truncate" style={{ fontSize: "8pt" }}>
            {asset.company || "Asset"}
          </div>
          <div className="font-semibold leading-tight truncate" style={{ fontSize: "7pt" }}>
            {asset.asset_name}
          </div>
          <div className="font-mono leading-tight truncate" style={{ fontSize: "6pt" }}>
            {asset.asset_code}
          </div>
        </div>
      </div>
      <svg ref={barRef} style={{ width: "100%", height: "9mm" }} />
    </div>
  );
}

export function LabelSheet({ asset }: { asset: Asset }) {
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/asset/${asset.asset_code}`
    : `/asset/${asset.asset_code}`;

  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <Button onClick={() => window.print()} size="sm">
          <Printer className="size-4 mr-1.5" /> Print labels
        </Button>
      </div>
      <div className="print-area flex flex-wrap gap-[3mm] justify-center p-4 bg-muted/30 rounded-lg">
        <Label asset={asset} url={url} />
        <Label asset={asset} url={url} />
      </div>
      <style>{`
        @page { size: auto; margin: 5mm; }
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; background: white !important; padding: 0; gap: 3mm; display: flex; flex-wrap: wrap; }
          .label-card { border-color: #000 !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}