export type Asset = {
  id: string;
  asset_code: string;
  company: string | null;
  asset_name: string;
  category: string | null;
  brand: string | null;
  model_number: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  vendor: string | null;
  department: string | null;
  location: string | null;
  warranty_months: number | null;
  warranty_expiry: string | null;
  status: string;
  remarks: string | null;
  created_at: string;
  updated_at: string;
};

export const emptyAsset = {
  company: "",
  asset_name: "",
  category: "",
  brand: "",
  model_number: "",
  serial_number: "",
  purchase_date: "",
  purchase_price: "",
  vendor: "",
  department: "",
  location: "",
  warranty_months: "",
  warranty_expiry: "",
  status: "Active",
  remarks: "",
};

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}