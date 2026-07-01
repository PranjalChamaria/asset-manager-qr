import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Asset } from "@/lib/asset-types";
import { emptyAsset } from "@/lib/asset-types";

type FormState = Record<string, string>;

function toFormState(a: Asset | null): FormState {
  if (!a) return { ...emptyAsset };
  return {
    company: a.company ?? "",
    asset_name: a.asset_name ?? "",
    category: a.category ?? "",
    brand: a.brand ?? "",
    model_number: a.model_number ?? "",
    serial_number: a.serial_number ?? "",
    purchase_date: a.purchase_date ?? "",
    purchase_price: a.purchase_price?.toString() ?? "",
    purchase_fund: a.purchase_fund ?? "",
    vendor: a.vendor ?? "",
    department: a.department ?? "",
    user_branch: a.user_branch ?? "",
    warranty_months: a.warranty_months?.toString() ?? "",
    warranty_expiry: a.warranty_expiry ?? "",
    status: a.status ?? "Active",
    remarks: a.remarks ?? "",
  };
}

export function AssetForm({
  asset,
  onSubmit,
  onCancel,
  submitting,
}: {
  asset: Asset | null;
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
  submitting?: boolean;
}) {
  const [form, setForm] = useState<FormState>(() => toFormState(asset));

  useEffect(() => { setForm(toFormState(asset)); }, [asset]);

  // Auto-calc warranty expiry from purchase_date + months
  useEffect(() => {
    if (form.purchase_date && form.warranty_months) {
      const d = new Date(form.purchase_date);
      d.setMonth(d.getMonth() + Number(form.warranty_months));
      const iso = d.toISOString().slice(0, 10);
      setForm((f) => (f.warranty_expiry === iso ? f : { ...f, warranty_expiry: iso }));
    }
  }, [form.purchase_date, form.warranty_months]);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      company: form.company || null,
      asset_name: form.asset_name,
      category: form.category || null,
      brand: form.brand || null,
      model_number: form.model_number || null,
      serial_number: form.serial_number || null,
      purchase_date: form.purchase_date || null,
      purchase_price: form.purchase_price ? Number(form.purchase_price) : null,
      purchase_fund: form.purchase_fund || null,
      vendor: form.vendor || null,
      department: form.department || null,
      user_branch: form.user_branch || null,
      warranty_months: form.warranty_months ? Number(form.warranty_months) : null,
      warranty_expiry: form.warranty_expiry || null,
      status: form.status || "Active",
      remarks: form.remarks || null,
    };
    onSubmit(payload);
  };

  const field = (k: string, label: string, type = "text") => (
    <div className="space-y-1.5">
      <Label htmlFor={k}>{label}</Label>
      <Input id={k} type={type} value={form[k]} onChange={set(k)} />
    </div>
  );

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {field("company", "Company")}
        <div className="space-y-1.5">
          <Label htmlFor="asset_name">Asset Name *</Label>
          <Input id="asset_name" required value={form.asset_name} onChange={set("asset_name")} />
        </div>
        {field("category", "Category")}
        {field("brand", "Brand")}
        {field("model_number", "Model Number")}
        {field("serial_number", "Serial Number")}
        {field("purchase_date", "Purchase Date", "date")}
        {field("purchase_price", "Purchase Price", "number")}
        {field("purchase_fund", "Purchased From Which Fund")}
        {field("vendor", "Supplier / Vendor")}
        {field("department", "Department")}
        {field("user_branch", "User Branch")}
        {field("warranty_months", "Warranty Period (months)", "number")}
        {field("warranty_expiry", "Warranty Expiry", "date")}
        <div className="space-y-1.5">
          <Label>Status</Label>
          <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Under Repair">Under Repair</SelectItem>
              <SelectItem value="Disposed">Disposed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="remarks">Remarks</Label>
        <Textarea id="remarks" rows={3} value={form.remarks} onChange={set("remarks")} />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={submitting}>{asset ? "Save changes" : "Add asset"}</Button>
      </div>
    </form>
  );
}