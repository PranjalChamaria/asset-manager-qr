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
      QRCode.toCanvas(qrRef.current, url, { width: 110, margin: 1 });
    }
    if (barRef.current) {
      JsBarcode(barRef.current, asset.asset_code, {
        format: "CODE128",
        displayValue: true,
        fontSize: 8,
        height: 22,
        margin: 0,
      });
    }
  }, [url, asset.asset_code]);

  return (
    <div className="label-card border-2 border-black rounded-[4px] p-1 bg-white text-black w-[50.8mm] h-[38.1mm] flex flex-row gap-1 items-stretch overflow-hidden">
      <canvas ref={qrRef} className="shrink-0 h-full w-auto" />
      <div className="flex-1 min-w-0 flex flex-col justify-between border-l border-black pl-1">
        <div>
          <div className="font-bold text-[8px] truncate leading-tight">
        {asset.company || "Asset"}
      </div>
          <div className="font-bold text-[10px] truncate leading-tight mt-0.5">{asset.asset_name}</div>
          <div className="text-[7px] font-semibold text-gray-700 tracking-wide break-words leading-tight mt-0.5">
            {asset.asset_code}
          </div>
        </div>
        <svg ref={barRef} className="w-full" />
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
      <div className="print-area flex flex-row gap-0 justify-center p-4 bg-muted/30 rounded-lg">
        <Label asset={asset} url={url} />
        <Label asset={asset} url={url} />
      </div>
      <style>{`
        @page { size: 101.6mm 38.1mm; margin: 0; }
        @media print {
          html, body { width: 101.6mm; height: 38.1mm; margin: 0 !important; padding: 0 !important; background: white !important; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 101.6mm; height: 38.1mm; padding: 0 !important; gap: 0 !important; background: white !important; display: flex !important; flex-direction: row !important; }
          .label-card { border: none !important; border-radius: 0 !important; width: 50.8mm !important; height: 38.1mm !important; }
        }
      `}</style>
    </div>
  );
}