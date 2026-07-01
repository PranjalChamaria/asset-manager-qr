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
      QRCode.toCanvas(qrRef.current, url, { width: 120, margin: 1 });
    }
    if (barRef.current) {
      JsBarcode(barRef.current, asset.asset_code, {
        format: "CODE128",
        displayValue: true,
        fontSize: 9,
        height: 26,
        margin: 0,
      });
    }
  }, [url, asset.asset_code]);

  return (
    <div className="label-card border-2 border-black rounded-[4px] p-1.5 bg-white text-black w-[105mm] h-[40mm] flex flex-row gap-2 items-stretch overflow-hidden">
      <canvas ref={qrRef} className="shrink-0 h-full w-auto" />
      <div className="flex-1 min-w-0 flex flex-col justify-between border-l border-black pl-2">
        <div>
          <div className="font-bold text-[10px] truncate leading-tight">
        {asset.company || "Asset"}
      </div>
          <div className="font-bold text-[12px] truncate leading-tight mt-0.5">{asset.asset_name}</div>
          <div className="text-[9px] font-semibold text-gray-700 tracking-wide break-words leading-tight mt-0.5">
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
      <div className="print-area flex flex-col gap-4 items-center p-4 bg-muted/30 rounded-lg">
        <div className="label-page"><Label asset={asset} url={url} /></div>
        <div className="label-page"><Label asset={asset} url={url} /></div>
      </div>
      <style>{`
        @page { size: 105mm 40mm; margin: 0; }
        @media print {
          html, body { width: 105mm; margin: 0 !important; padding: 0 !important; background: white !important; }
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; padding: 0 !important; gap: 0 !important; background: white !important; display: block !important; }
          .label-page { width: 105mm; height: 40mm; page-break-after: always; break-after: page; overflow: hidden; }
          .label-page:last-child { page-break-after: auto; break-after: auto; }
          .label-card { border: none !important; border-radius: 0 !important; width: 105mm !important; height: 40mm !important; }
        }
      `}</style>
    </div>
  );
}