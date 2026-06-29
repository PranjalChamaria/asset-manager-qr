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
      QRCode.toCanvas(qrRef.current, url, { width: 180, margin: 1 });
    }
    if (barRef.current) {
      JsBarcode(barRef.current, asset.asset_code, {
        format: "CODE128",
        displayValue: true,
        fontSize: 12,
        height: 40,
        margin: 0,
      });
    }
  }, [url, asset.asset_code]);

  return (
    <div className="label-card border-2 border-foreground rounded-md p-3 bg-white text-black w-[280px]">
      <div className="font-bold text-sm border-b border-foreground pb-1 mb-2 truncate">
        {asset.company || "Asset"}
      </div>
      <div className="flex gap-2 items-center">
        <canvas ref={qrRef} className="shrink-0" />
        <div className="border-l border-foreground pl-2 flex-1 min-w-0">
          <div className="font-bold text-base truncate">{asset.asset_name}</div>
          <div className="text-xs font-semibold text-muted-foreground tracking-wider">
            {asset.asset_code}
          </div>
        </div>
      </div>
      <div className="mt-2 border-t border-foreground pt-2 flex flex-col items-center">
        <svg ref={barRef} className="w-full" />
        <div className="text-[10px] font-bold tracking-widest mt-1">SCAN FOR COMPLETE DETAILS</div>
      </div>
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
      <div className="print-area flex flex-wrap gap-4 justify-center p-4 bg-muted/30 rounded-lg">
        <Label asset={asset} url={url} />
        <Label asset={asset} url={url} />
      </div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; background: white !important; padding: 20px; gap: 20px; }
        }
      `}</style>
    </div>
  );
}