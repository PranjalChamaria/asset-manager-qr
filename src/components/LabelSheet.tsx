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
      QRCode.toCanvas(qrRef.current, url, { width: 88, margin: 1 });
    }
    if (barRef.current) {
      JsBarcode(barRef.current, asset.asset_code, {
        format: "CODE128",
        displayValue: true,
        fontSize: 8,
        height: 24,
        margin: 0,
      });
    }
  }, [url, asset.asset_code]);

  return (
    <div className="label-card border-2 border-black rounded-[4px] p-1.5 bg-white text-black w-[2in] h-[1.5in] flex flex-col overflow-hidden">
      <div className="font-bold text-[10px] border-b border-black pb-0.5 mb-1 truncate leading-tight">
        {asset.company || "Asset"}
      </div>
      <div className="flex gap-1.5 items-start flex-1 min-h-0">
        <canvas ref={qrRef} className="shrink-0" />
        <div className="border-l border-black pl-1.5 flex-1 min-w-0 flex flex-col justify-center">
          <div className="font-bold text-[11px] truncate leading-tight">{asset.asset_name}</div>
          <div className="text-[9px] font-semibold text-gray-600 tracking-wider">
            {asset.asset_code}
          </div>
        </div>
      </div>
      <div className="mt-1 border-t border-black pt-1 flex flex-col items-center">
        <svg ref={barRef} className="w-full" />
        <div className="text-[7px] font-bold tracking-widest mt-0.5">SCAN FOR DETAILS</div>
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