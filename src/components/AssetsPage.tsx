import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
const db = supabase as unknown as { from: (t: string) => any };
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, QrCode, Package, Search, RotateCcw, Trash } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Asset } from "@/lib/asset-types";
import { daysUntil } from "@/lib/asset-types";
import { AssetForm } from "./AssetForm";
import { LabelSheet } from "./LabelSheet";

async function fetchAssets(): Promise<Asset[]> {
  const { data, error } = await db.from("assets").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Asset[];
}

export function AssetsPage() {
  const qc = useQueryClient();
  const { data: assets = [], isLoading } = useQuery({ queryKey: ["assets"], queryFn: fetchAssets });

  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [labelAsset, setLabelAsset] = useState<Asset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);
  const [purgeAsset, setPurgeAsset] = useState<Asset | null>(null);
  const [view, setView] = useState<"active" | "trash">("active");
  const [unlocked, setUnlocked] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pendingAction, setPendingAction] = useState<null | (() => void)>(null);

  const ADMIN_PW = "admin123";

  const requireAuth = (action: () => void) => {
    if (unlocked) { action(); return; }
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

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    const base = assets.filter((a) => (view === "trash" ? !!a.deleted_at : !a.deleted_at));
    if (!q) return base;
    return base.filter((a) =>
      [a.asset_code, a.asset_name, a.category, a.brand, a.serial_number, a.vendor, a.department, a.user_branch]
        .some((v) => v?.toString().toLowerCase().includes(q))
    );
  }, [assets, search, view]);

  const trashCount = useMemo(() => assets.filter((a) => !!a.deleted_at).length, [assets]);
  const activeCount = assets.length - trashCount;

  const upsertMut = useMutation({
    mutationFn: async (payload: Record<string, unknown> & { id?: string }) => {
      if (editing) {
        const { error } = await db.from("assets").update(payload).eq("id", editing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from("assets").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      setFormOpen(false);
      setEditing(null);
      toast.success(editing ? "Asset updated" : "Asset added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("assets").update({ deleted_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      setDeleteAsset(null);
      toast.success("Moved to recycle bin");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const restoreMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("assets").update({ deleted_at: null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      toast.success("Asset restored");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const purgeMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("assets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      setPurgeAsset(null);
      toast.success("Permanently deleted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
          <Button onClick={() => { setEditing(null); setFormOpen(true); }}>
            <Plus className="size-4 mr-1.5" /> Add Asset
          </Button>
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

        <div className="border rounded-lg bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Serial</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>User Branch</TableHead>
                <TableHead>Warranty</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={11} className="text-center py-10 text-muted-foreground">Loading…</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center py-10 text-muted-foreground">
                  {view === "trash" ? "Recycle bin is empty." : "No assets yet. Click \"Add Asset\" to create your first record."}
                </TableCell></TableRow>
              ) : filtered.map((a) => {
                const days = daysUntil(a.warranty_expiry);
                return (
                  <TableRow key={a.id} className="cursor-pointer" onClick={() => setLabelAsset(a)}>
                    <TableCell className="font-mono text-xs">{a.asset_code}</TableCell>
                    <TableCell className="font-medium">{a.asset_name}</TableCell>
                    <TableCell>{a.category}</TableCell>
                    <TableCell>{a.brand}</TableCell>
                    <TableCell className="font-mono text-xs">{a.serial_number}</TableCell>
                    <TableCell>{a.vendor}</TableCell>
                    <TableCell>{a.department}</TableCell>
                    <TableCell>{a.user_branch}</TableCell>
                    <TableCell>
                      {a.warranty_expiry ? (
                        <span className={days !== null && days < 0 ? "text-destructive" : days !== null && days < 30 ? "text-amber-600" : ""}>
                          {a.warranty_expiry} {days !== null && <span className="text-xs">({days}d)</span>}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={a.status === "Active" ? "default" : "secondary"}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-1">
                        {view === "active" ? (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => setLabelAsset(a)} title="QR & Barcode">
                              <QrCode className="size-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => requireAuth(() => { setEditing(a); setFormOpen(true); })} title="Edit">
                              <Pencil className="size-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => requireAuth(() => setDeleteAsset(a))} title="Move to recycle bin">
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => requireAuth(() => restoreMut.mutate(a.id))} title="Restore">
                              <RotateCcw className="size-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => requireAuth(() => setPurgeAsset(a))} title="Delete permanently">
                              <Trash className="size-4 text-destructive" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </main>

      <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Asset" : "Add New Asset"}</DialogTitle>
            <DialogDescription>
              {editing ? `Editing ${editing.asset_code}` : "Asset code will be generated automatically."}
            </DialogDescription>
          </DialogHeader>
          <AssetForm
            asset={editing}
            submitting={upsertMut.isPending}
            onSubmit={(d) => upsertMut.mutate(d)}
            onCancel={() => { setFormOpen(false); setEditing(null); }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!labelAsset} onOpenChange={(o) => !o && setLabelAsset(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Asset Label — {labelAsset?.asset_code}</DialogTitle>
            <DialogDescription>
              {"\n"}
            </DialogDescription>
          </DialogHeader>
          {labelAsset && <LabelSheet asset={labelAsset} />}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteAsset} onOpenChange={(o) => !o && setDeleteAsset(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to recycle bin?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteAsset?.asset_code} — {deleteAsset?.asset_name}. You can restore it later from the recycle bin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteAsset && deleteMut.mutate(deleteAsset.id)}>Delete</AlertDialogAction>
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
            <AlertDialogAction onClick={() => purgeAsset && purgeMut.mutate(purgeAsset.id)}>Delete forever</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={pwOpen} onOpenChange={(o) => { setPwOpen(o); if (!o) { setPendingAction(null); setPwInput(""); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Admin password required</DialogTitle>
            <DialogDescription>Enter the admin password to edit or delete records.</DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            autoFocus
            value={pwInput}
            onChange={(e) => setPwInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") submitPw(); }}
            placeholder="Password"
          />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setPwOpen(false)}>Cancel</Button>
            <Button onClick={submitPw}>Unlock</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}