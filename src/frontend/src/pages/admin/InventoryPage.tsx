import { AdminLayout } from "@/components/layout/AdminLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  useAddBook,
  useDeleteBook,
  useGetBookLifecycleFlow,
  useGetBooksReturningByDate,
  useGetInventoryLifecycle,
  useGetTransferHistory,
  useImportBooksFromCsv,
  useSearchInventory,
  useTransferBook,
  useUpdateBook,
} from "@/hooks/useBackend";
import type {
  Book,
  BookCsvRow,
  BookReturningEntry,
  InventoryLifecycleItem,
  Transfer,
} from "@/types";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Edit,
  FileUp,
  Filter,
  History,
  Package,
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  Upload,
  UserCheck2,
  Users,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const CATEGORY_OPTIONS = [
  "All",
  "Science",
  "Commerce",
  "Medical",
  "Engineering",
  "Arts",
  "Mathematics",
  "Language",
  "Other",
];

const AVAILABILITY_OPTIONS = ["All", "Available", "Out of Stock"];

const SORT_OPTIONS = [
  { value: "title-asc", label: "Title A→Z" },
  { value: "title-desc", label: "Title Z→A" },
  { value: "author-asc", label: "Author A→Z" },
  { value: "newest", label: "Newest First" },
];

const CSV_TEMPLATE =
  "shelf,title,author,publisher,edition,category,quantity,available\n" +
  "A1,Physics Part 1,H.C. Verma,Bharati Bhawan,1st,Science,10,10\n" +
  "B2,Business Studies,Poonam Gandhi,VK Publications,3rd,Commerce,5,5";

interface BookFormState {
  shelf: string;
  title: string;
  author: string;
  publisher: string;
  edition: string;
  category: string;
  quantity: string;
  availableCount: string;
}

const emptyForm: BookFormState = {
  shelf: "",
  title: "",
  author: "",
  publisher: "",
  edition: "",
  category: "",
  quantity: "1",
  availableCount: "1",
};

function BookFormDialog({
  open,
  onOpenChange,
  initial,
  onSubmit,
  title,
  submitting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: BookFormState;
  onSubmit: (data: BookFormState) => void;
  title: string;
  submitting: boolean;
}) {
  const [form, setForm] = useState<BookFormState>(initial);
  useEffect(() => {
    setForm(initial);
  }, [initial]);

  const set =
    (field: keyof BookFormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-lg"
        data-ocid="admin.inventory.book_dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(form);
          }}
          className="space-y-4 pt-2"
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="inv-title">Title</Label>
              <Input
                id="inv-title"
                value={form.title}
                onChange={set("title")}
                required
                placeholder="Book title"
                data-ocid="admin.inventory.title_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-author">Author</Label>
              <Input
                id="inv-author"
                value={form.author}
                onChange={set("author")}
                required
                placeholder="Author name"
                data-ocid="admin.inventory.author_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-edition">Edition</Label>
              <Input
                id="inv-edition"
                value={form.edition}
                onChange={set("edition")}
                placeholder="e.g. 3rd"
                data-ocid="admin.inventory.edition_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-publisher">Publisher</Label>
              <Input
                id="inv-publisher"
                value={form.publisher}
                onChange={set("publisher")}
                placeholder="Publisher"
                data-ocid="admin.inventory.publisher_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-category">Category</Label>
              <Input
                id="inv-category"
                value={form.category}
                onChange={set("category")}
                placeholder="e.g. Science"
                data-ocid="admin.inventory.category_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-shelf">Shelf</Label>
              <Input
                id="inv-shelf"
                value={form.shelf}
                onChange={set("shelf")}
                placeholder="e.g. A1"
                data-ocid="admin.inventory.shelf_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-qty">Total Qty</Label>
              <Input
                id="inv-qty"
                type="number"
                min="0"
                value={form.quantity}
                onChange={set("quantity")}
                required
                data-ocid="admin.inventory.quantity_input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="inv-avail">Available</Label>
              <Input
                id="inv-avail"
                type="number"
                min="0"
                value={form.availableCount}
                onChange={set("availableCount")}
                required
                data-ocid="admin.inventory.available_input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-ocid="admin.inventory.cancel_button"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              data-ocid="admin.inventory.submit_button"
            >
              {submitting ? "Saving…" : "Save Book"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onConfirm: () => void;
  isDeleting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-sm"
        data-ocid="admin.inventory.delete_dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">Delete Book?</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This action cannot be undone. The book will be removed from the
          inventory.
        </p>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="admin.inventory.delete_cancel_button"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isDeleting}
            data-ocid="admin.inventory.delete_confirm_button"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CsvPreviewRow extends BookCsvRow {
  _rowNum: number;
  shelf?: string;
  totalCopies?: number;
  availableCopies?: number;
}

function parseCsv(text: string): { rows: CsvPreviewRow[]; error?: string } {
  const lines = text.trim().split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return { rows: [], error: "CSV has no data rows" };

  const normalizeHeader = (header: string) =>
    header.replace(/^\uFEFF/, "").trim().toLowerCase();

  const canonicalHeader = (header: string) => {
    const normalized = normalizeHeader(header);
    if (normalized === "total copies" || normalized === "totalcopies" || normalized === "quantity") {
      return "qty";
    }
    if (
      normalized === "available copies" ||
      normalized === "availablecopies" ||
      normalized === "available count" ||
      normalized === "availablecount"
    ) {
      return "available";
    }
    return normalized;
  };

  const headers = lines[0].split(",").map(canonicalHeader);
  console.log("RAW HEADER LINE:", lines[0]);
  console.log("PARSED HEADERS:", headers);
  const requiredColumns = [
    "shelf",
    "title",
    "author",
    "publisher",
    "edition",
    "category",
    "qty",
    "available",
  ];

  const missingColumns = requiredColumns.filter(
    (column) => !headers.includes(column),
  );
  if (missingColumns.length > 0) {
    return { rows: [], error: `Missing column: ${missingColumns[0]}` };
  }

  const rows: CsvPreviewRow[] = [];
  const indexOf = (column: string) => headers.indexOf(column);

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    if (cols.length < headers.length) continue;
    const get = (key: string) => cols[indexOf(key)] ?? "";
    const quantityValue = Number(get("qty")) || 0;
    const availableValue = Number(get("available")) || quantityValue;

    rows.push({
      _rowNum: i,
      shelf: get("shelf"),
      title: get("title"),
      author: get("author"),
      publisher: get("publisher"),
      edition: get("edition"),
      category: get("category"),
      quantity: quantityValue,
      available: availableValue,
      totalCopies: quantityValue,
      availableCopies: availableValue,
    });
  }
  return { rows };
}

function CsvImportModal({
  open,
  onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [csvRows, setCsvRows] = useState<CsvPreviewRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const importMutation = useImportBooksFromCsv();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setResult(null);
    setParseError("");
    const reader = new FileReader();
    reader.onload = (e) => {
      const { rows, error } = parseCsv(e.target?.result as string);
      if (error) {
        setParseError(error);
        setCsvRows([]);
      } else {
        setCsvRows(rows);
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const handleImport = async () => {
    try {
      const rows: BookCsvRow[] = csvRows.map(
        ({ _rowNum: _r, ...rest }) => rest,
      );
      const res = await importMutation.mutateAsync(rows);
      setResult(res);
      setCsvRows([]);
      toast.success(
        `Import complete: ${Number(res.inserted)} inserted, ${Number(res.skipped)} skipped`,
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    }
  };

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "svga_books_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setCsvRows([]);
    setParseError("");
    setResult(null);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent
        className="sm:max-w-2xl max-h-[85vh] overflow-y-auto"
        data-ocid="admin.inventory.csv_dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display">
            Import Books from CSV
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-primary border-primary/40"
            onClick={downloadTemplate}
            data-ocid="admin.inventory.csv_template_button"
          >
            <Download className="h-3.5 w-3.5" /> Download CSV Template
          </Button>
          <button
            type="button"
            className={`w-full border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-sky-50/40"}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={
              handleDrop as unknown as React.DragEventHandler<HTMLButtonElement>
            }
            onClick={() => fileRef.current?.click()}
            onKeyDown={(e) => e.key === "Enter" && fileRef.current?.click()}
            data-ocid="admin.inventory.csv_dropzone"
          >
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm font-medium text-foreground">
              Drag & drop a CSV file here
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              or click to browse
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFileInput}
              data-ocid="admin.inventory.csv_file_input"
            />
          </button>
          {parseError && (
            <p className="text-sm text-destructive flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" /> {parseError}
            </p>
          )}
          {csvRows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">
                  Preview — {csvRows.length} rows
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={reset}
                >
                  <X className="h-3 w-3 mr-1" /> Clear
                </Button>
              </div>
              <div className="border border-border rounded-lg overflow-x-auto max-h-52">
                <table className="w-full text-xs">
                  <thead className="bg-blue-50 sticky top-0">
                    <tr>
                      {[
                        "#",
                        "Shelf",
                        "Title",
                        "Author",
                        "Publisher",
                        "Edition",
                        "Category",
                        "Quantity",
                        "Available",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-3 py-2 font-medium text-foreground whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {csvRows.map((row) => (
                      <tr key={row._rowNum} className="border-t border-border">
                        <td className="px-3 py-2 text-muted-foreground">
                          {row._rowNum}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.shelf}
                        </td>
                        <td className="px-3 py-2 max-w-[140px] truncate font-medium">
                          {row.title}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.author}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.publisher}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.edition}
                        </td>
                        <td className="px-3 py-2 text-muted-foreground">
                          {row.category}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {String(row.quantity)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          {String(row.available)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {result && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
              <p className="text-sm font-semibold text-emerald-800">
                Import Complete
              </p>
              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Processed:</span>{" "}
                  <span className="font-bold text-emerald-700">
                    {Number(result.inserted)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Skipped:</span>{" "}
                  <span className="font-bold text-amber-600">
                    {Number(result.skipped)}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Errors:</span>{" "}
                  <span className="font-bold text-red-600">
                    {result.errors.length}
                  </span>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="mt-2 space-y-1">
                  {result.errors.map((err) => (
                    <p key={err} className="text-xs text-red-700">
                      • {err}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
            data-ocid="admin.inventory.csv_cancel_button"
          >
            Close
          </Button>
          <Button
            type="button"
            disabled={csvRows.length === 0 || importMutation.isPending}
            onClick={handleImport}
            data-ocid="admin.inventory.csv_import_button"
          >
            {importMutation.isPending
              ? "Importing…"
              : `Import ${csvRows.length} Books`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Transfer Modal ─────────────────────────────────────────────────────
function TransferModal({
  open,
  onOpenChange,
  entry,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entry: BookReturningEntry | null;
}) {
  const transfer = useTransferBook();
  const [notes, setNotes] = useState("");

  if (!entry) return null;
  const hasNext = !!entry.nextReservedStudent;

  const handleTransfer = async () => {
    if (!hasNext) return;
    try {
      await transfer.mutateAsync({
        fromStudentId: entry.studentId,
        toStudentId: entry.nextReservedStudent!.studentId,
        bookId: entry.bookId,
        adminNotes: notes || undefined,
      });
      toast.success("Book transferred successfully");
      onOpenChange(false);
      setNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Transfer failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        data-ocid="admin.inventory.transfer_dialog"
      >
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-primary" /> Transfer Book
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="bg-sky-50 rounded-xl p-4 border border-sky-100 space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Book:</span>{" "}
              <span className="font-semibold">{entry.bookTitle}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white rounded-lg border border-border p-2">
                <p className="text-xs text-muted-foreground">From</p>
                <p className="font-medium text-foreground">
                  {entry.studentName}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 bg-white rounded-lg border border-emerald-200 p-2">
                <p className="text-xs text-muted-foreground">To</p>
                <p className="font-medium text-foreground">
                  {entry.nextReservedStudent?.studentName ?? "—"}
                </p>
              </div>
            </div>
          </div>
          {!hasNext && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              No waiting student for this book. Transfer not available.
            </p>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="transfer-notes">Admin Notes (optional)</Label>
            <Input
              id="transfer-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Book condition note"
              data-ocid="admin.inventory.transfer_notes_input"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-ocid="admin.inventory.transfer_cancel_button"
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!hasNext || transfer.isPending}
            onClick={handleTransfer}
            data-ocid="admin.inventory.transfer_confirm_button"
          >
            {transfer.isPending ? "Transferring…" : "Confirm Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Lifecycle Card ─────────────────────────────────────────────────────
function LifecycleCard({ item }: { item: InventoryLifecycleItem }) {
  const [expanded, setExpanded] = useState(false);
  const isAvail = item.availableCount > 0;
  const isOverdue = item.currentHolders.some(
    (h) => new Date(h.expectedReturnDate) < new Date(),
  );
  const statusColor = isAvail
    ? "border-l-emerald-400 bg-emerald-50/30"
    : isOverdue
      ? "border-l-red-400 bg-red-50/30"
      : "border-l-amber-400 bg-amber-50/30";

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div
      className={`border border-border rounded-xl overflow-hidden border-l-4 ${statusColor}`}
      data-ocid="admin.inventory.lifecycle_card"
    >
      <button
        type="button"
        className="w-full flex items-center justify-between p-4 text-left hover:bg-black/[0.02] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${
              isAvail
                ? "bg-emerald-100 text-emerald-700"
                : isOverdue
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
            }`}
          >
            <Package className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-foreground text-sm truncate">
              {item.bookTitle}
            </p>
            <p className="text-xs text-muted-foreground">
              {item.author} · {item.edition}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Avail / Total</p>
            <p
              className={`text-sm font-bold ${isAvail ? "text-emerald-700" : "text-red-700"}`}
            >
              {item.availableCount} / {item.totalQuantity}
            </p>
          </div>
          {item.waitingQueue.length > 0 && (
            <Badge
              variant="outline"
              className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
            >
              <Users className="h-3 w-3 mr-1" />
              {item.waitingQueue.length} waiting
            </Badge>
          )}
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-4 bg-white/60">
          {item.currentHolders.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Current Holders
              </p>
              <div className="space-y-2">
                {item.currentHolders.map((h) => {
                  const overdue = new Date(h.expectedReturnDate) < new Date();
                  return (
                    <div
                      key={h.studentId}
                      className={`flex items-center justify-between text-sm px-3 py-2 rounded-lg border ${overdue ? "bg-red-50 border-red-200" : "bg-sky-50 border-sky-100"}`}
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {h.studentName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Issued: {fmtDate(h.issueDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-xs font-semibold ${overdue ? "text-red-600" : "text-amber-600"}`}
                        >
                          {overdue ? "! Overdue" : "Return by:"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmtDate(h.expectedReturnDate)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {item.waitingQueue.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Waiting Queue
              </p>
              <div className="space-y-1.5">
                {item.waitingQueue.map((w, idx) => (
                  <div
                    key={w.studentId}
                    className="flex items-center gap-2 text-sm px-3 py-2 rounded-lg bg-amber-50 border border-amber-100"
                  >
                    <span className="h-5 w-5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-foreground">
                      {w.studentName}
                    </span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      Reserved: {fmtDate(w.reservationDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {item.currentHolders.length === 0 &&
            item.waitingQueue.length === 0 && (
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-500" /> All copies
                available — no active holders or waiting queue.
              </p>
            )}
        </div>
      )}
    </div>
  );
}

// ─── Books Returning Soon ────────────────────────────────────────────────
function BooksReturningSoon({
  onTransfer,
}: { onTransfer: (entry: BookReturningEntry) => void }) {
  const { data: entries, isLoading } = useGetBooksReturningByDate(14);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  const urgencyClass = (days: number) => {
    if (days < 0) return "border-l-red-500 bg-red-50/60";
    if (days <= 2) return "border-l-red-400 bg-red-50/40";
    if (days <= 5) return "border-l-amber-400 bg-amber-50/40";
    return "border-l-green-400 bg-green-50/30";
  };

  const urgencyBadge = (days: number) => {
    if (days < 0)
      return { text: "Overdue", cls: "bg-red-100 text-red-700 border-red-200" };
    if (days <= 2)
      return {
        text: `Due in ${days}d`,
        cls: "bg-red-100 text-red-700 border-red-200",
      };
    if (days <= 5)
      return {
        text: `Due in ${days}d`,
        cls: "bg-amber-100 text-amber-700 border-amber-200",
      };
    return {
      text: `${days}d left`,
      cls: "bg-green-100 text-green-700 border-green-200",
    };
  };

  if (isLoading)
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );

  if (!entries || entries.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-2 py-8 text-center"
        data-ocid="admin.inventory.returning_empty_state"
      >
        <Clock className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          No books returning in the next 14 days.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {[...entries]
        .sort((a, b) => a.daysUntilReturn - b.daysUntilReturn)
        .map((entry, i) => {
          const badge = urgencyBadge(entry.daysUntilReturn);
          return (
            <div
              key={`${entry.requestId}-${i}`}
              className={`border border-border border-l-4 rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 ${urgencyClass(entry.daysUntilReturn)}`}
              data-ocid={`admin.inventory.returning_item.${i + 1}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-foreground text-sm">
                    {entry.bookTitle}
                  </p>
                  <span
                    className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${badge.cls}`}
                  >
                    {badge.text}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                  <span>
                    Held by:{" "}
                    <span className="font-medium text-foreground">
                      {entry.studentName}
                    </span>
                  </span>
                  <span>Return: {fmtDate(entry.returnDate)}</span>
                  {entry.nextReservedStudent && (
                    <span className="text-amber-700">
                      → Next:{" "}
                      <span className="font-medium">
                        {entry.nextReservedStudent.studentName}
                      </span>
                    </span>
                  )}
                </div>
              </div>
              {entry.nextReservedStudent && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 shrink-0 border-primary/40 text-primary hover:bg-primary/5"
                  onClick={() => onTransfer(entry)}
                  data-ocid={`admin.inventory.transfer_button.${i + 1}`}
                >
                  <ArrowRight className="h-3.5 w-3.5" /> Transfer to Next
                </Button>
              )}
            </div>
          );
        })}
    </div>
  );
}

// ─── Transfer History ────────────────────────────────────────────────────
function TransferHistory() {
  const { data: transfers, isLoading } = useGetTransferHistory();

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  if (isLoading)
    return (
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );

  if (!transfers || transfers.length === 0) {
    return (
      <div
        className="flex flex-col items-center gap-2 py-8 text-center"
        data-ocid="admin.inventory.transfers_empty_state"
      >
        <History className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          No book transfers recorded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm min-w-[560px]">
        <thead>
          <tr className="bg-blue-50 border-b border-border">
            {["Date", "Book ID", "From Student", "To Student", "Notes"].map(
              (h) => (
                <th
                  key={h}
                  className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap"
                >
                  {h}
                </th>
              ),
            )}
          </tr>
        </thead>
        <tbody>
          {(transfers as Transfer[]).map((t, i) => (
            <tr
              key={t.id}
              className="border-b border-border last:border-0 hover:bg-sky-50/30"
              data-ocid={`admin.inventory.transfer_history.item.${i + 1}`}
            >
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                {fmtDate(t.transferDate)}
              </td>
              <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                {t.bookId.slice(0, 12)}…
              </td>
              <td className="px-4 py-3 font-medium">
                {t.fromStudentId.slice(0, 12)}…
              </td>
              <td className="px-4 py-3 font-medium text-emerald-700">
                {t.toStudentId.slice(0, 12)}…
              </td>
              <td className="px-4 py-3 text-muted-foreground text-xs italic">
                {t.adminNotes ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Filter Tag ──────────────────────────────────────────────────────────
function FilterTag({
  label,
  onRemove,
  ocid,
}: { label: string; onRemove: () => void; ocid: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800 border border-sky-200"
      data-ocid={ocid}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
        className="ml-0.5 hover:text-sky-900 transition-colors"
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export function InventoryPage() {
  const navigate = useNavigate({ from: "/admin/inventory" });
  const searchParams = useSearch({ from: "/admin/inventory" });

  const search = searchParams.search ?? "";
  const categoryFilter = searchParams.category ?? "All";
  const availabilityFilter = searchParams.availability ?? "All";
  const editionFilter = searchParams.edition ?? "All";
  const sortBy = searchParams.sort ?? "title-asc";

  const [searchInput, setSearchInput] = useState(search);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        navigate({
          to: "/admin/inventory",
          search: (prev) => ({ ...prev, search: value }),
        });
      }, 300);
    },
    [navigate],
  );

  const setFilter = useCallback(
    (key: string, value: string) => {
      navigate({
        to: "/admin/inventory",
        search: (prev) => ({ ...prev, [key]: value }),
      });
    },
    [navigate],
  );

  const clearAllFilters = useCallback(() => {
    setSearchInput("");
    navigate({
      to: "/admin/inventory",
      search: () => ({
        search: "",
        category: "All",
        availability: "All",
        edition: "All",
        sort: "title-asc",
      }),
    });
  }, [navigate]);

  const { data: books, isLoading } = useSearchInventory(
    search,
    categoryFilter !== "All" ? categoryFilter : null,
    availabilityFilter !== "All" ? availabilityFilter : null,
    editionFilter !== "All" ? editionFilter : null,
    sortBy,
  );
  const { data: allBooks } = useSearchInventory("", null, null, null, null);
  const { data: lifecycle, isLoading: lifecycleLoading } =
    useGetInventoryLifecycle();
  const { data: bookFlow, isLoading: bookFlowLoading } =
    useGetBookLifecycleFlow();

  const uniqueEditions = useMemo(() => {
    if (!allBooks) return [];
    return [
      ...new Set(
        allBooks.map((b) => b.edition).filter((e): e is string => !!e),
      ),
    ].sort();
  }, [allBooks]);

  const uniqueCategories = useMemo(() => {
    if (!allBooks) return CATEGORY_OPTIONS.slice(1);
    const cats = [
      ...new Set(allBooks.map((b) => b.category).filter(Boolean)),
    ].sort();
    return cats.length > 0 ? cats : CATEGORY_OPTIONS.slice(1);
  }, [allBooks]);

  const addBook = useAddBook();
  const updateBook = useUpdateBook();
  const deleteBook = useDeleteBook();

  const [addOpen, setAddOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [editBook, setEditBook] = useState<Book | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [transferEntry, setTransferEntry] = useState<BookReturningEntry | null>(
    null,
  );
  const [transferOpen, setTransferOpen] = useState(false);
  const [inventoryTab, setInventoryTab] = useState("books");

  const filtered = useMemo(() => books ?? [], [books]);

  const activeFilters = useMemo(() => {
    const tags: { key: string; label: string }[] = [];
    if (search) tags.push({ key: "search", label: `Search: "${search}"` });
    if (categoryFilter !== "All")
      tags.push({ key: "category", label: `Category: ${categoryFilter}` });
    if (availabilityFilter !== "All")
      tags.push({
        key: "availability",
        label: `Availability: ${availabilityFilter}`,
      });
    if (editionFilter !== "All")
      tags.push({ key: "edition", label: `Edition: ${editionFilter}` });
    if (sortBy !== "title-asc") {
      const s = SORT_OPTIONS.find((o) => o.value === sortBy);
      if (s) tags.push({ key: "sort", label: `Sort: ${s.label}` });
    }
    return tags;
  }, [search, categoryFilter, availabilityFilter, editionFilter, sortBy]);

  const handleAdd = async (data: BookFormState) => {
    try {
      await addBook.mutateAsync({
        title: data.title,
        author: data.author,
        edition: data.edition,
        publisher: data.publisher,
        category: data.category,
        shelf: data.shelf,
        quantity: Number(data.quantity),
      });
      toast.success("Book added successfully");
      setAddOpen(false);
    } catch {
      toast.error("Failed to add book");
    }
  };

  const handleEdit = async (data: BookFormState) => {
    if (!editBook) return;
    try {
      await updateBook.mutateAsync({
        bookId: editBook.bookId ?? editBook._id,
        title: data.title,
        author: data.author,
        edition: data.edition,
        publisher: data.publisher,
        category: data.category,
        shelf: data.shelf,
        quantity: Number(data.quantity),
        availableCount: Number(data.availableCount),
      });
      toast.success("Book updated");
      setEditBook(null);
    } catch {
      toast.error("Failed to update book");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBook.mutateAsync(deleteId);
      toast.success("Book deleted");
      setDeleteId(null);
    } catch {
      toast.error("Failed to delete book");
    }
  };

  const editForm: BookFormState = editBook
    ? {
        shelf: editBook.shelf ?? "",
        title: editBook.title,
        author: editBook.author,
        edition: editBook.edition ?? "",
        publisher: editBook.publisher ?? "",
        category: editBook.category,
        quantity: String(editBook.quantity),
        availableCount: String(
          editBook.availableCount ?? editBook.availableQuantity ?? 0,
        ),
      }
    : emptyForm;

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              Book Inventory
            </h1>
            <p className="text-sm text-muted-foreground font-body mt-1">
              {isLoading ? (
                <Skeleton className="h-4 w-32 inline-block" />
              ) : (
                `${filtered.length} book${filtered.length !== 1 ? "s" : ""} found`
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setCsvOpen(true)}
              data-ocid="admin.inventory.import_csv_button"
            >
              <FileUp className="h-4 w-4" /> Import CSV
            </Button>
            <Button
              onClick={() => setAddOpen(true)}
              className="gap-2"
              data-ocid="admin.inventory.add_button"
            >
              <Plus className="h-4 w-4" /> Add Book
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={inventoryTab} onValueChange={setInventoryTab}>
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger
              value="books"
              className="gap-1.5"
              data-ocid="admin.inventory.books_tab"
            >
              <Package className="h-4 w-4" /> Books
            </TabsTrigger>
            <TabsTrigger
              value="lifecycle"
              className="gap-1.5"
              data-ocid="admin.inventory.lifecycle_tab"
            >
              <Users className="h-4 w-4" /> Lifecycle
            </TabsTrigger>
            <TabsTrigger
              value="returning"
              className="gap-1.5"
              data-ocid="admin.inventory.returning_tab"
            >
              <Clock className="h-4 w-4" /> Returning Soon
            </TabsTrigger>
            <TabsTrigger
              value="transfers"
              className="gap-1.5"
              data-ocid="admin.inventory.transfers_tab"
            >
              <History className="h-4 w-4" /> Transfer History
            </TabsTrigger>
          </TabsList>

          {/* Books Table Tab */}
          <TabsContent value="books" className="space-y-4 mt-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by title, author, category…"
                  className="pl-9"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  data-ocid="admin.inventory.search_input"
                />
              </div>
              <Button
                variant="outline"
                className={`gap-2 ${showFilters || activeFilters.length > 0 ? "border-sky-400 text-sky-700 bg-sky-50" : ""}`}
                onClick={() => setShowFilters((v) => !v)}
                data-ocid="admin.inventory.filter_toggle"
              >
                <SlidersHorizontal className="h-4 w-4" /> Filters
                {activeFilters.length > 0 && (
                  <span className="ml-1 bg-sky-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {activeFilters.length}
                  </span>
                )}
              </Button>
            </div>

            {showFilters && (
              <div
                className="bg-sky-50/60 border border-sky-200 rounded-xl p-4 space-y-4"
                data-ocid="admin.inventory.filter_panel"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-semibold text-sky-800">
                    <Filter className="h-4 w-4" />
                    Advanced Filters
                  </div>
                  {activeFilters.length > 0 && (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="text-xs text-sky-600 hover:text-sky-800 underline transition-colors"
                      data-ocid="admin.inventory.clear_all_filters"
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Category
                    </Label>
                    <Select
                      value={categoryFilter}
                      onValueChange={(v) => setFilter("category", v)}
                    >
                      <SelectTrigger
                        className="h-8 text-sm"
                        data-ocid="admin.inventory.category_filter"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Categories</SelectItem>
                        {uniqueCategories.map((c) => (
                          <SelectItem key={c} value={c}>
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Edition
                    </Label>
                    <Select
                      value={editionFilter}
                      onValueChange={(v) => setFilter("edition", v)}
                    >
                      <SelectTrigger
                        className="h-8 text-sm"
                        data-ocid="admin.inventory.edition_filter"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="All">All Editions</SelectItem>
                        {uniqueEditions.map((e) => (
                          <SelectItem key={e} value={e}>
                            {e}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Availability
                    </Label>
                    <Select
                      value={availabilityFilter}
                      onValueChange={(v) => setFilter("availability", v)}
                    >
                      <SelectTrigger
                        className="h-8 text-sm"
                        data-ocid="admin.inventory.availability_filter"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABILITY_OPTIONS.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Sort by
                    </Label>
                    <Select
                      value={sortBy}
                      onValueChange={(v) => setFilter("sort", v)}
                    >
                      <SelectTrigger
                        className="h-8 text-sm"
                        data-ocid="admin.inventory.sort_select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SORT_OPTIONS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 pt-1">
                  <Switch
                    id="available-only"
                    checked={availabilityFilter === "Available"}
                    onCheckedChange={(checked) =>
                      setFilter("availability", checked ? "Available" : "All")
                    }
                    data-ocid="admin.inventory.available_only_toggle"
                  />
                  <Label
                    htmlFor="available-only"
                    className="text-sm cursor-pointer"
                  >
                    Available books only
                  </Label>
                </div>
              </div>
            )}

            {activeFilters.length > 0 && (
              <div
                className="flex flex-wrap gap-2 items-center"
                data-ocid="admin.inventory.active_filters"
              >
                <span className="text-xs text-muted-foreground font-medium">
                  Active filters:
                </span>
                {activeFilters.map((f) => (
                  <FilterTag
                    key={f.key}
                    label={f.label}
                    ocid={`admin.inventory.filter_tag.${f.key}`}
                    onRemove={() => {
                      if (f.key === "search") {
                        setSearchInput("");
                        setFilter("search", "");
                      } else if (f.key === "sort") {
                        setFilter("sort", "title-asc");
                      } else {
                        setFilter(f.key, "All");
                      }
                    }}
                  />
                ))}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs text-muted-foreground hover:text-foreground underline transition-colors"
                  data-ocid="admin.inventory.clear_all_tags"
                >
                  Clear all
                </button>
              </div>
            )}

            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-50 border-b border-border">
                      {[
                        "Shelf",
                        "Title",
                        "Author",
                        "Publisher",
                        "Edition",
                        "Category",
                        "Quantity",
                        "Available",
                        "Actions",
                      ].map((h) => (
                        <th
                          key={h}
                          className="text-left px-4 py-3 font-semibold text-foreground whitespace-nowrap"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      [1, 2, 3, 4, 5].map((i) => (
                        <tr key={i} className="border-b border-border">
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                            <td key={j} className="px-4 py-3">
                              <Skeleton className="h-4 w-full" />
                            </td>
                          ))}
                        </tr>
                      ))
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td
                          colSpan={9}
                          className="px-4 py-14 text-center"
                          data-ocid="admin.inventory.empty_state"
                        >
                          <div className="flex flex-col items-center gap-2">
                            <Filter className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm font-medium text-foreground">
                              No books found
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {activeFilters.length > 0
                                ? "No books match your filters."
                                : "No books in inventory yet."}
                            </p>
                            {activeFilters.length > 0 && (
                              <button
                                type="button"
                                onClick={clearAllFilters}
                                className="mt-1 text-xs text-primary hover:underline"
                              >
                                Clear all filters
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((book, i) => {
                        const isLowStock =
                          Number(book.availableCount) < 2 &&
                          Number(book.availableCount) >= 0;
                        const isOutOfStock = Number(book.availableCount) === 0;
                        return (
                          <tr
                            key={book.bookId ?? book._id}
                            className="border-b border-border last:border-0 hover:bg-sky-50/30 transition-colors"
                            data-ocid={`admin.inventory.item.${i + 1}`}
                          >
                            <td
                              className="px-4 py-3 font-medium max-w-[180px]"
                              title={book.title}
                            >
                              <div className="flex items-center gap-2">
                                <span className="truncate">{book.title}</span>
                                {isLowStock && !isOutOfStock && (
                                  <Badge
                                    variant="outline"
                                    className="text-amber-700 border-amber-300 bg-amber-50 whitespace-nowrap text-[10px] px-1.5"
                                  >
                                    Low
                                  </Badge>
                                )}
                                {isOutOfStock && (
                                  <Badge
                                    variant="outline"
                                    className="text-red-700 border-red-300 bg-red-50 whitespace-nowrap text-[10px] px-1.5"
                                  >
                                    Out
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {book.shelf || "—"}
                            </td>
                            <td className="px-4 py-3 font-medium max-w-[180px]">
                              <div className="flex items-center gap-2">
                                <span className="truncate">{book.title}</span>
                                {isLowStock && !isOutOfStock && (
                                  <Badge
                                    variant="outline"
                                    className="text-amber-700 border-amber-300 bg-amber-50 whitespace-nowrap text-[10px] px-1.5"
                                  >
                                    Low
                                  </Badge>
                                )}
                                {isOutOfStock && (
                                  <Badge
                                    variant="outline"
                                    className="text-red-700 border-red-300 bg-red-50 whitespace-nowrap text-[10px] px-1.5"
                                  >
                                    Out
                                  </Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {book.author}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {book.publisher}
                            </td>
                            <td className="px-4 py-3 text-muted-foreground">
                              {book.edition}
                            </td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded-full text-xs bg-sky-100 text-sky-700 border border-sky-200">
                                {book.category}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              {String(book.quantity)}
                            </td>
                            <td className="px-4 py-3 text-right font-mono">
                              <span
                                className={
                                  isOutOfStock
                                    ? "text-red-600 font-semibold"
                                    : isLowStock
                                      ? "text-amber-600 font-semibold"
                                      : "text-emerald-600"
                                }
                              >
                                {String(book.availableCount)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                                  onClick={() => setEditBook(book)}
                                  data-ocid={`admin.inventory.edit_button.${i + 1}`}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() =>
                                    setDeleteId(book.bookId ?? book._id)
                                  }
                                  data-ocid={`admin.inventory.delete_button.${i + 1}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Inventory Lifecycle Tab */}
          <TabsContent value="lifecycle" className="mt-4 space-y-4">
            {/* Book Transfer Flow Card — at top */}
            <div
              className="bg-card border border-border rounded-xl overflow-hidden shadow-sm"
              data-ocid="admin.inventory.transfer_flow.section"
            >
              <div className="px-4 py-3 border-b border-border bg-sky-50/60 flex items-center justify-between">
                <h2 className="text-sm font-display font-semibold text-foreground flex items-center gap-2">
                  <ArrowRightCircle className="h-4 w-4 text-primary" /> Book
                  Transfer Flow
                </h2>
                <Badge variant="outline" className="text-xs">
                  {bookFlow?.length ?? 0} active
                </Badge>
              </div>
              {bookFlowLoading ? (
                <div className="p-4 space-y-2">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !bookFlow || bookFlow.length === 0 ? (
                <p
                  className="text-sm text-muted-foreground text-center py-6"
                  data-ocid="admin.inventory.transfer_flow.empty_state"
                >
                  No active book assignments.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[560px]">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        {[
                          "Book Title",
                          "Currently With",
                          "Return Date",
                          "Next Reserved Student",
                        ].map((h) => (
                          <th
                            key={h}
                            className="text-left px-4 py-2.5 font-semibold text-foreground whitespace-nowrap text-xs"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bookFlow.map((item, i) => {
                        const returnIso = item.currentHolder?.returnDate;
                        const days = returnIso
                          ? Math.round(
                              (new Date(returnIso).getTime() - Date.now()) /
                                86_400_000,
                            )
                          : null;
                        const dateCls =
                          days === null
                            ? ""
                            : days < 0
                              ? "text-red-600 font-semibold"
                              : days <= 2
                                ? "text-red-500 font-semibold"
                                : days <= 5
                                  ? "text-amber-600"
                                  : "text-emerald-600";
                        const fmtDate = (iso?: string) =>
                          iso
                            ? new Date(iso).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "—";
                        return (
                          <tr
                            key={item.bookId}
                            className="border-b border-border last:border-0 hover:bg-sky-50/20 transition-colors"
                            data-ocid={`admin.inventory.transfer_flow.item.${i + 1}`}
                          >
                            <td className="px-4 py-3 font-medium text-foreground">
                              <span className="line-clamp-1">
                                {item.bookTitle}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {item.currentHolder ? (
                                <div className="flex items-center gap-1.5 text-foreground">
                                  <Users className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                                  {item.currentHolder.name}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  Available
                                </span>
                              )}
                            </td>
                            <td className={`px-4 py-3 ${dateCls}`}>
                              {fmtDate(returnIso)}
                            </td>
                            <td className="px-4 py-3">
                              {item.nextReservedStudent ? (
                                <div className="flex items-center gap-1.5 text-amber-700">
                                  <ChevronRight className="h-3.5 w-3.5 shrink-0" />
                                  {item.nextReservedStudent.name}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-xs">
                                  None
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Existing lifecycle section */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-display font-semibold text-foreground">
                  Inventory Lifecycle
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Per-book holder tracking, waiting queues, and procurement
                  requests.
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {lifecycle?.length ?? 0} books tracked
              </Badge>
            </div>
            {lifecycleLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : !lifecycle || lifecycle.length === 0 ? (
              <div
                className="flex flex-col items-center gap-2 py-12 text-center"
                data-ocid="admin.inventory.lifecycle_empty_state"
              >
                <Package className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">
                  No lifecycle data yet.
                </p>
                <p className="text-xs text-muted-foreground">
                  Books with active holders or waiting queues will appear here.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {lifecycle.map((item) => (
                  <LifecycleCard key={item.bookId} item={item} />
                ))}
              </div>
            )}
          </TabsContent>

          {/* Books Returning Soon Tab */}
          <TabsContent value="returning" className="mt-4 space-y-4">
            <div>
              <h2 className="text-base font-display font-semibold text-foreground">
                Books Returning Soon
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Sorted by nearest return date. Use "Transfer to Next" to assign
                to the waiting student.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center">
              {[
                {
                  label: "Overdue / ≤2 days",
                  color: "bg-red-50 border-red-200 text-red-700",
                },
                {
                  label: "≤5 days",
                  color: "bg-amber-50 border-amber-200 text-amber-700",
                },
                {
                  label: ">5 days",
                  color: "bg-green-50 border-green-200 text-green-700",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className={`rounded-xl border p-3 text-xs font-semibold ${item.color}`}
                >
                  {item.label}
                </div>
              ))}
            </div>
            <BooksReturningSoon
              onTransfer={(entry) => {
                setTransferEntry(entry);
                setTransferOpen(true);
              }}
            />
          </TabsContent>

          {/* Transfer History Tab */}
          <TabsContent value="transfers" className="mt-4 space-y-4">
            <div>
              <h2 className="text-base font-display font-semibold text-foreground">
                Transfer History
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                All book transfers between students recorded by admins.
              </p>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
              <TransferHistory />
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>

      <BookFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        initial={emptyForm}
        onSubmit={handleAdd}
        title="Add New Book"
        submitting={addBook.isPending}
      />
      {editBook && (
        <BookFormDialog
          open={!!editBook}
          onOpenChange={(v) => !v && setEditBook(null)}
          initial={editForm}
          onSubmit={handleEdit}
          title="Edit Book"
          submitting={updateBook.isPending}
        />
      )}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        onConfirm={handleDelete}
        isDeleting={deleteBook.isPending}
      />
      <CsvImportModal open={csvOpen} onOpenChange={setCsvOpen} />
      <TransferModal
        open={transferOpen}
        onOpenChange={(v) => {
          setTransferOpen(v);
          if (!v) setTransferEntry(null);
        }}
        entry={transferEntry}
      />
    </AdminLayout>
  );
}
