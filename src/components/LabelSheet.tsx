import { useEffect, useRef } from "react";
import QRCode from "qrcode";
import JsBarcode from "jsbarcode";
import { Button } from "@/components/ui/button";
import type { Asset } from "@/lib/asset-types";
import { Download } from "lucide-react";

function Label({ asset, text }: { asset: Asset; text: string }) {
  const qrRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (qrRef.current) {
      QRCode.toCanvas(qrRef.current, text, {
        width: 110,
        margin: 1,
        color: { dark: "#000000", light: "#ffffff" },
      });
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
  }, [text, asset.asset_code]);

  return (
    <div className="label-card border-2 border-black rounded-[4px] p-1 bg-white text-black w-[50.8mm] h-[38.1mm] flex flex-row gap-1 items-stretch overflow-hidden">
      <canvas ref={qrRef} className="shrink-0 h-full w-auto" />
      <div className="flex-1 min-w-0 flex flex-col justify-between border-l border-black pl-1">
        <div className="space-y-0.5">
          <div className="font-bold text-[9px] truncate leading-tight">{asset.asset_name}</div>
          <div className="text-[7px] font-semibold text-gray-700 tracking-wide break-words leading-tight">
            AST ID: {asset.asset_code}
          </div>
          <div className="text-[7px] font-semibold text-gray-700 tracking-wide break-words leading-tight">
            Brand: {asset.brand || "—"}
          </div>
        </div>
        <svg ref={barRef} className="w-full" />
      </div>
    </div>
  );
}

export function LabelSheet({ asset }: { asset: Asset }) {
  const lines = [
    `Asset Code: ${asset.asset_code}`,
    `Name: ${asset.asset_name}`,
    `Category: ${asset.category || ""}`,
    `Brand: ${asset.brand || ""}`,
    `Serial: ${asset.serial_number || ""}`,
    `Vendor: ${asset.vendor || ""}`,
    `Department: ${asset.department || ""}`,
    `Branch: ${asset.user_branch || ""}`,
    `Status: ${asset.status || ""}`,
  ].filter((line) => line.split(": ")[1]?.trim() !== "");

  const qrText = lines.join("\n");

  const downloadLabel = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 450;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#000000";
    context.lineWidth = 3;
    context.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    const qrCanvas = document.createElement("canvas");
    qrCanvas.width = 220;
    qrCanvas.height = 220;
    await QRCode.toCanvas(qrCanvas, qrText, {
      width: 220,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });
    context.drawImage(qrCanvas, 36, 82, 180, 180);

    const barcodeCanvas = document.createElement("canvas");
    barcodeCanvas.width = 320;
    barcodeCanvas.height = 100;
    JsBarcode(barcodeCanvas, asset.asset_code, {
      format: "CODE128",
      displayValue: true,
      fontSize: 24,
      height: 64,
      margin: 4,
    });
    context.drawImage(barcodeCanvas, 240, 300, 300, 74);

    context.fillStyle = "#000000";
    context.font = "bold 30px Arial";
    context.fillText(asset.asset_name, 252, 110);
    context.font = "bold 24px Arial";
    context.fillText(`AST ID: ${asset.asset_code}`, 252, 155);
    context.font = "bold 24px Arial";
    context.fillText(`Brand: ${asset.brand || "—"}`, 252, 195);

    const link = document.createElement("a");
    link.download = `${asset.asset_code || "asset"}.jpg`;
    link.href = canvas.toDataURL("image/jpeg", 0.95);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end print:hidden">
        <Button onClick={downloadLabel} size="sm">
          <Download className="size-4 mr-1.5" /> Download label
        </Button>
      </div>
      <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
        <Label asset={asset} text={qrText} />
      </div>
    </div>
  );
}
