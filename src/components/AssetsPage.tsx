import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Pencil,
  Trash2,
  QrCode,
  Package,
  Search,
  RotateCcw,
  Trash,
  Download,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Asset } from "@/lib/asset-types";
import { AssetForm } from "./AssetForm";
import { LabelSheet } from "./LabelSheet";
import { apiFetch } from "@/lib/api";

async function fetchAssets(view: "active" | "trash", search: string): Promise<Asset[]> {
  const params = new URLSearchParams({ view });
  if (search.trim()) params.set("q", search.trim());
  return apiFetch<Asset[]>(`/api/assets?${params.toString()}`);
}

export function AssetsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [labelAsset, setLabelAsset] = useState<Asset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);
  const [purgeAsset, setPurgeAsset] = useState<Asset | null>(null);
  const [view, setView] = useState<"active" | "trash">("active");
  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["assets", view, search],
    queryFn: () => fetchAssets(view, search),
  });
  const { data: allAssets = [] } = useQuery({
    queryKey: ["assets-all"],
    queryFn: async () => {
      const [active, trash] = await Promise.all([
        fetchAssets("active", ""),
        fetchAssets("trash", ""),
      ]);
      return [...active, ...trash];
    },
  });
  const [unlocked, setUnlocked] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);

  const ADMIN_PW = "admin123";

  const requireAuth = (action: () => void) => {
    if (unlocked) {
      action();
      return;
    }
    setPendingAction(() => action);
    setPwInput("");
    setPwOpen(true);
  };

  const submitPw = () => {
    if (pwInput === ADMIN_PW) {
      setUnlocked(true);
      setPwOpen(false);
      const a = pendingAction;
      setPendingAction(null);
      if (a) a();
    } else {
      toast.error("Incorrect password");
    }
  };

  const filtered = useMemo(() => assets, [assets]);
  const trashCount = useMemo(() => allAssets.filter((a) => !!a.deleted_at).length, [allAssets]);
  const activeCount = useMemo(() => allAssets.filter((a) => !a.deleted_at).length, [allAssets]);

  const upsertMut = useMutation({
    mutationFn: async (payload: Record<string, unknown> & { id?: string }) => {
      const route = editing ? `/api/assets/${editing.id}` : "/api/assets";
      const method = editing ? "PUT" : "POST";
      return apiFetch<Asset>(route, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["assets-all"] });
      setFormOpen(false);
      setEditing(null);
      toast.success(editing ? "Asset updated" : "Asset added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<void>(`/api/assets/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["assets-all"] });
      setDeleteAsset(null);
      toast.success("Moved to recycle bin");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const restoreMut = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<void>(`/api/assets/${id}/restore`, { method: "POST" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["assets-all"] });
      toast.success("Asset restored");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const purgeMut = useMutation({
    mutationFn: async (id: string) => {
      return apiFetch<void>(`/api/assets/${id}/permanent`, { method: "DELETE" });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["assets-all"] });
      setPurgeAsset(null);
      toast.success("Permanently deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exportActiveAssets = () => {
    const activeAssets = allAssets.filter((asset) => !asset.deleted_at);
    if (activeAssets.length === 0) {
      toast.error("No active assets to export");
      return;
    }

    const rows = activeAssets.map((asset) => ({
      asset_code: asset.asset_code,
      asset_name: asset.asset_name,
      category: asset.category || "",
      brand: asset.brand || "",
      model_number: asset.model_number || "",
      serial_number: asset.serial_number || "",
      purchase_date: asset.purchase_date || "",
      purchase_price: asset.purchase_price ?? "",
      purchase_fund: asset.purchase_fund || "",
      vendor: asset.vendor || "",
      department: asset.department || "",
      user_branch: asset.user_branch || "",
      warranty_months: asset.warranty_months ?? "",
      status: asset.status || "",
      remarks: asset.remarks || "",
      created_at: asset.created_at || "",
      updated_at: asset.updated_at || "",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Active Assets");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "active-assets.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success("Active assets exported");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-primary text-primary-foreground grid place-items-center">
              <Package className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Asset Command</h1>
              <p className="text-xs text-muted-foreground">Unit readiness control</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportActiveAssets}>
              <Download className="size-4 mr-1.5" /> Export Excel
            </Button>
            <Button
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4 mr-1.5" /> Add Asset
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-6 space-y-4">
        <Tabs value={view} onValueChange={(v) => setView(v as "active" | "trash")}>
          <TabsList>
            <TabsTrigger value="active">Active ({activeCount})</TabsTrigger>
            <TabsTrigger value="trash">Recycle Bin ({trashCount})</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by code, name, brand, serial…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="text-sm text-muted-foreground ml-auto">
            {filtered.length} of {assets.length} assets
          </div>
        </div>

        <div className="border rounded-lg bg-card overflow-x-auto">
          <Table className="min-w-[1400px]">
            <TableHeader>
              <TableRow>
                <TableHead>Asset Code</TableHead>
                <TableHead>Asset Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Model Number</TableHead>
                <TableHead>Serial Number</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Purchase Price</TableHead>
                <TableHead>Fund</TableHead>
                <TableHead>Supplier / Vendor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>User Branch</TableHead>
                <TableHead>Warranty Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Remarks</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={16} className="text-center py-10 text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={16} className="text-center py-10 text-muted-foreground">
                    {view === "trash"
                      ? "Recycle bin is empty."
                      : 'No assets yet. Click "Add Asset" to create your first record.'}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => {
                  return (
                    <TableRow
                      key={a.id}
                      className="cursor-pointer"
                      onClick={() => setLabelAsset(a)}
                    >
                      <TableCell className="font-mono text-xs">{a.asset_code}</TableCell>
                      <TableCell className="font-medium">{a.asset_name}</TableCell>
                      <TableCell>{a.category || "—"}</TableCell>
                      <TableCell>{a.brand || "—"}</TableCell>
                      <TableCell>{a.model_number || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{a.serial_number || "—"}</TableCell>
                      <TableCell>{a.purchase_date || "—"}</TableCell>
                      <TableCell>
                        {a.purchase_price != null
                          ? `KES ${a.purchase_price.toLocaleString()}`
                          : "—"}
                      </TableCell>
                      <TableCell>{a.purchase_fund || "—"}</TableCell>
                      <TableCell>{a.vendor || "—"}</TableCell>
                      <TableCell>{a.department || "—"}</TableCell>
                      <TableCell>{a.user_branch || "—"}</TableCell>
                      <TableCell>
                        {a.warranty_months ? `${a.warranty_months} months` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.status === "Active" ? "default" : "secondary"}>
                          {a.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate">{a.remarks || "—"}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          {view === "active" ? (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setLabelAsset(a)}
                                title="QR & Barcode"
                              >
                                <QrCode className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() =>
                                  requireAuth(() => {
                                    setEditing(a);
                                    setFormOpen(true);
                                  })
                                }
                                title="Edit"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => requireAuth(() => setDeleteAsset(a))}
                                title="Move to recycle bin"
                              >
                                <Trash2 className="size-4 text-destructive" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => requireAuth(() => restoreMut.mutate(a.id))}
                                title="Restore"
                              >
                                <RotateCcw className="size-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => requireAuth(() => setPurgeAsset(a))}
                                title="Delete permanently"
                              >
                                <Trash className="size-4 text-destructive" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog
        open={formOpen}
        onOpenChange={(o) => {
          setFormOpen(o);
          if (!o) setEditing(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Asset" : "Add New Asset"}</DialogTitle>
            <DialogDescription>
              {editing
                ? `Editing ${editing.asset_code}`
                : "Asset code will be generated automatically."}
            </DialogDescription>
          </DialogHeader>
          <AssetForm
            asset={editing}
            submitting={upsertMut.isPending}
            onSubmit={(d) => upsertMut.mutate(d)}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!labelAsset} onOpenChange={(o) => !o && setLabelAsset(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asset Label — {labelAsset?.asset_code}</DialogTitle>
            <DialogDescription>{"\n"}</DialogDescription>
          </DialogHeader>
          {labelAsset && <LabelSheet asset={labelAsset} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteAsset} onOpenChange={(o) => !o && setDeleteAsset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to recycle bin?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAsset?.asset_code} — {deleteAsset?.asset_name}. You can restore it later from
              the recycle bin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAsset && deleteMut.mutate(deleteAsset.id)}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!purgeAsset} onOpenChange={(o) => !o && setPurgeAsset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete permanently?</AlertDialogTitle>
            <AlertDialogDescription>
              {purgeAsset?.asset_code} — {purgeAsset?.asset_name}. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => purgeAsset && purgeMut.mutate(purgeAsset.id)}>
              Delete forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={pwOpen}
        onOpenChange={(o) => {
          setPwOpen(o);
          if (!o) {
            setPendingAction(null);
            setPwInput("");
          }
        }}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Admin password required</DialogTitle>
            <DialogDescription>
              Enter the admin password to edit or delete records.
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            autoFocus
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitPw();
            }}
            placeholder="Password"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPwOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitPw}>Unlock</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
