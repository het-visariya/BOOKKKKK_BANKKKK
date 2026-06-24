import { StudentLayout } from "@/components/layout/StudentLayout";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StepIndicator } from "@/components/ui/StepIndicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/useAuth";
import {
  useAllBooks,
  useBookRecommendations,
  useCheckBookAvailability,
  useCreateBookRequest,
  useCreateBookReservation,
  useCreateChallan,
  useCreateProcurementRequest,
  useCreateUrgentProcurement,
  useSearchBooks,
} from "@/hooks/useBackend";
import type { BookAvailability } from "@/types";
import type { Book, ManualBookEntry } from "@/types";
import { useNavigate, useSearch } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  ChevronRight,
  Clock,
  Filter,
  ImageIcon,
  Loader2,
  PlusCircle,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

const COURSES = [
  "FYJC",
  "SYJC",
  "FY-Degree",
  "SY-Degree",
  "TY-Degree",
  "MBBS",
  "BDS",
  "Engineering",
  "Commerce",
  "Arts",
  "Science",
  "Other",
];

const WIZARD_STEPS = [
  { id: 1, label: "Select Course" },
  { id: 2, label: "Choose Books" },
];

// ─── Recommendation Row ───
function RecommendationRow({
  bookId,
  onSelect,
}: { bookId: string; onSelect: (book: Book) => void }) {
  const { data: recs, isLoading } = useBookRecommendations(bookId);
  if (isLoading)
    return (
      <LoadingSpinner
        size="sm"
        text="Finding similar books…"
        className="py-3"
      />
    );
  if (!recs || recs.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
        <Sparkles className="h-3 w-3 text-primary" />
        Similar books you might like
      </p>
      <div className="flex flex-col gap-1.5">
        {recs.slice(0, 3).map((rec) => (
          <button
            key={rec.bookId}
            type="button"
            onClick={() => onSelect(rec)}
            data-ocid="books.recommendation.item"
            className="w-full text-left flex items-center justify-between px-3 py-2 rounded-lg bg-secondary/60 hover:bg-secondary border border-border transition-smooth text-sm"
          >
            <div className="min-w-0">
              <span className="font-medium text-foreground truncate block">
                {rec.title}
              </span>
              <span className="text-xs text-muted-foreground">
                {rec.author} · {rec.edition}
              </span>
            </div>
            {Number(rec.availableCount ?? rec.availableQuantity ?? 0) > 0 ? (
              <Badge className="ml-2 shrink-0 bg-green-100 text-green-700 border-green-200 text-xs">
                Available
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="ml-2 shrink-0 text-xs text-destructive border-destructive/30"
              >
                Out of stock
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

// ─── Image Upload Field ───
function BookImageUpload({
  onUploaded,
  uploaded,
}: { onUploaded: (url: string) => void; uploaded: string }) {
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const imgFileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Only JPG, PNG, or PDF files are allowed");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large — maximum size is 5MB");
      return;
    }
    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewUrl(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
    setIsUploading(true);
    setProgress(0);
    try {
      // Convert to base64 data URL for simple upload
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => {
          resolve(e.target?.result as string);
          setProgress(100);
        };
        reader.readAsDataURL(file);
      });
      onUploaded(dataUrl || `book-image:${file.name}`);
      toast.success("Book image uploaded");
    } catch {
      toast.error("Upload failed — please try again");
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  const _handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-1">
      <Label className="text-xs">
        Book Cover / Reference Image
        <span className="ml-1 text-muted-foreground font-normal">
          (optional, max 5MB)
        </span>
      </Label>
      {uploaded ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Book cover preview"
              className="h-8 w-8 object-cover rounded border border-border"
            />
          ) : (
            <ImageIcon className="h-4 w-4 text-emerald-600 shrink-0" />
          )}
          <p className="text-xs text-emerald-700 font-medium flex-1 truncate">
            Image uploaded ✓
          </p>
          <button
            type="button"
            onClick={() => {
              onUploaded("");
              setPreviewUrl(null);
            }}
            className="text-muted-foreground hover:text-destructive transition-smooth"
            aria-label="Remove uploaded image"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => imgFileRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-1.5 px-4 py-4 rounded-lg border-2 border-dashed border-border bg-muted/30 cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-smooth text-center"
          data-ocid="books.manual.image_dropzone"
        >
          {isUploading ? (
            <>
              <UploadCloud className="h-5 w-5 text-primary animate-pulse" />
              <div className="w-full max-w-32 bg-border rounded-full h-1.5 mt-1">
                <div
                  className="bg-primary h-1.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {progress}% uploaded
              </p>
            </>
          ) : (
            <>
              <UploadCloud className="h-5 w-5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Drag & drop or{" "}
                <span className="text-primary font-medium">browse</span>
              </p>
              <p className="text-[10px] text-muted-foreground">
                JPG, PNG, PDF up to 5MB
              </p>
            </>
          )}
        </button>
      )}
      <input
        ref={imgFileRef}
        type="file"
        accept="image/jpeg,image/png,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}

// ─── Manual Book Entry Form ───
function ManualBookForm({
  onAdd,
}: { onAdd: (entry: ManualBookEntry) => void }) {
  const [form, setForm] = useState<ManualBookEntry>({
    title: "",
    author: "",
    edition: "",
    publisher: "",
    imageUrl: "",
  });

  const handleChange = (field: keyof ManualBookEntry, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    if (!form.title.trim() || !form.author.trim()) {
      toast.error("Title and Author are required");
      return;
    }
    onAdd(form);
    setForm({
      title: "",
      author: "",
      edition: "",
      publisher: "",
      imageUrl: "",
    });
    toast.success("Book request added");
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="space-y-1">
        <Label htmlFor="manual-title" className="text-xs">
          Book Title <span className="text-destructive">*</span>
        </Label>
        <Input
          id="manual-title"
          placeholder="Enter book title"
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
          data-ocid="books.manual.title_input"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="manual-author" className="text-xs">
          Author <span className="text-destructive">*</span>
        </Label>
        <Input
          id="manual-author"
          placeholder="Author name"
          value={form.author}
          onChange={(e) => handleChange("author", e.target.value)}
          data-ocid="books.manual.author_input"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="manual-edition" className="text-xs">
          Edition
        </Label>
        <Input
          id="manual-edition"
          placeholder="e.g. 3rd Edition"
          value={form.edition}
          onChange={(e) => handleChange("edition", e.target.value)}
          data-ocid="books.manual.edition_input"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="manual-publisher" className="text-xs">
          Publisher
        </Label>
        <Input
          id="manual-publisher"
          placeholder="Publisher name"
          value={form.publisher}
          onChange={(e) => handleChange("publisher", e.target.value)}
          data-ocid="books.manual.publisher_input"
        />
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="manual-note" className="text-xs">
          Notes / special instructions
        </Label>
        <Input
          id="manual-note"
          placeholder="Provide any details for the procurement team"
          value={form.note ?? ""}
          onChange={(e) => handleChange("note", e.target.value)}
          data-ocid="books.manual.note_input"
        />
      </div>
      {/* Image Upload */}
      <div className="sm:col-span-2">
        <BookImageUpload
          uploaded={form.imageUrl}
          onUploaded={(url) => handleChange("imageUrl", url)}
        />
      </div>
      <div className="sm:col-span-2 flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={handleAdd}
          className="gap-2"
          data-ocid="books.manual.add_button"
        >
          <PlusCircle className="h-4 w-4" />
          Add to Request List
        </Button>
      </div>
    </div>
  );
}

// ─── Filter Tag ───
function BookFilterTag({
  label,
  onRemove,
}: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-sky-100 text-sky-800 border border-sky-200">
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

// ─── Main Page ───
export function BooksPage() {
  const navigate = useNavigate();
  const searchParams = useSearch({ from: "/student/books" });
  const { data: currentUser } = useCurrentUser();
  const createRequest = useCreateBookRequest();
  const createChallan = useCreateChallan();
  const [_challanQrUrl, setChallanQrUrl] = useState<string | null>(null);
  const [availabilityModal, setAvailabilityModal] = useState<{
    book: Book;
    availability: BookAvailability;
  } | null>(null);
  const [procurementForm, setProcurementForm] = useState(false);
  const [procBookTitle, setProcBookTitle] = useState("");
  const [procAuthor, setProcAuthor] = useState("");
  const [procEdition, setProcEdition] = useState("");
  const [procPublisher, setProcPublisher] = useState("");
  const [procUrgency, setProcUrgency] = useState<"Required" | "Optional">(
    "Optional",
  );
  const createReservation = useCreateBookReservation();
  const createUrgentProc = useCreateUrgentProcurement();
  const createProc = useCreateProcurementRequest();

  const [step, setStep] = useState(1);
  const [selectedCourse, setSelectedCourse] = useState("");

  // Filter state (URL-persisted)
  const authorFilter = searchParams.author ?? "All";
  const editionFilter = searchParams.edition ?? "All";
  const categoryBookFilter = searchParams.category ?? "All";
  const sortFilter = searchParams.sort ?? "title-asc";
  const [showBookFilters, setShowBookFilters] = useState(false);

  const setBookFilter = (key: string, value: string) => {
    navigate({
      to: "/student/books",
      search: {
        author: authorFilter,
        edition: editionFilter,
        category: categoryBookFilter,
        sort: sortFilter,
        [key]: value,
      },
    });
  };

  const clearBookFilters = () => {
    navigate({
      to: "/student/books",
      search: () => ({
        author: "All",
        edition: "All",
        category: "All",
        sort: "title-asc",
      }),
    });
  };

  const [searchInput, setSearchInput] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);

  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);
  const [manualRequests, setManualRequests] = useState<ManualBookEntry[]>([]);
  const [showManualForm, setShowManualForm] = useState(false);

  // Pre-fill course from user profile
  useEffect(() => {
    if (currentUser?.course && !selectedCourse) {
      const matched = COURSES.find(
        (c) => c.toLowerCase() === (currentUser.course ?? "").toLowerCase(),
      );
      if (matched) setSelectedCourse(matched);
    }
  }, [currentUser, selectedCourse]);

  // Debounced search handler
  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedTerm(value);
      setShowDropdown(value.trim().length > 1);
    }, 300);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { data: searchResults, isLoading: searchLoading } = useSearchBooks(
    debouncedTerm,
    selectedCourse,
  );

  // Derive unique authors, editions, categories from all books in this course
  const { data: allBooksRaw } = useAllBooks();
  const allBooks = useMemo(
    () =>
      selectedCourse
        ? (allBooksRaw ?? []).filter(
            (b) =>
              b.category.toLowerCase().includes(selectedCourse.toLowerCase()) ||
              b.category === selectedCourse ||
              selectedCourse === "",
          )
        : (allBooksRaw ?? []),
    [allBooksRaw, selectedCourse],
  );

  const uniqueAuthors = useMemo(() => {
    if (!allBooks) return [];
    return [...new Set(allBooks.map((b) => b.author).filter(Boolean))].sort();
  }, [allBooks]);

  const uniqueEditions = useMemo(() => {
    if (!allBooks) return [];
    return [
      ...new Set(
        allBooks.map((b) => b.edition).filter((e): e is string => !!e),
      ),
    ].sort();
  }, [allBooks]);

  const uniqueCategories = useMemo(() => {
    if (!allBooks) return [];
    return [...new Set(allBooks.map((b) => b.category).filter(Boolean))].sort();
  }, [allBooks]);

  // Client-side filter + sort applied to search dropdown results
  const filteredResults = useMemo(() => {
    if (!searchResults) return [];
    let results = searchResults.filter((b) => {
      if (authorFilter !== "All" && b.author !== authorFilter) return false;
      if (editionFilter !== "All" && b.edition !== editionFilter) return false;
      if (categoryBookFilter !== "All" && b.category !== categoryBookFilter)
        return false;
      return true;
    });
    if (sortFilter === "title-asc") {
      results = [...results].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortFilter === "title-desc") {
      results = [...results].sort((a, b) => b.title.localeCompare(a.title));
    } else if (sortFilter === "author-asc") {
      results = [...results].sort((a, b) => a.author.localeCompare(b.author));
    } else if (sortFilter === "newest") {
      results = [...results].reverse();
    }
    return results;
  }, [
    searchResults,
    authorFilter,
    editionFilter,
    categoryBookFilter,
    sortFilter,
  ]);

  const activeBookFilters = useMemo(() => {
    const tags: { key: string; label: string }[] = [];
    if (authorFilter !== "All")
      tags.push({ key: "author", label: `Author: ${authorFilter}` });
    if (editionFilter !== "All")
      tags.push({ key: "edition", label: `Edition: ${editionFilter}` });
    if (categoryBookFilter !== "All")
      tags.push({ key: "category", label: `Category: ${categoryBookFilter}` });
    if (sortFilter !== "title-asc") {
      const labels: Record<string, string> = {
        "title-desc": "Title Z→A",
        "author-asc": "Author A→Z",
        newest: "Newest",
      };
      tags.push({
        key: "sort",
        label: `Sort: ${labels[sortFilter] ?? sortFilter}`,
      });
    }
    return tags;
  }, [authorFilter, editionFilter, categoryBookFilter, sortFilter]);

  const isBookSelected = (id: string) =>
    selectedBooks.some((b) => (b.bookId ?? b._id) === id);

  // Availability check — triggered on dropdown item click
  const [checkingBookId, setCheckingBookId] = useState<string | null>(null);

  const handleSelectBook = (book: Book) => {
    if (isBookSelected(book.bookId ?? book._id ?? "")) return;
    const available =
      Number(book.availableCount ?? book.availableQuantity ?? 0) > 0;
    if (!available) {
      // Show availability modal for out-of-stock books
      setCheckingBookId(book.bookId ?? book._id ?? "");
      setProcBookTitle(book.title);
      setProcAuthor(book.author ?? "");
      setProcEdition(book.edition ?? "");
      setProcPublisher(book.publisher ?? "");
      setAvailabilityModal({
        book,
        availability: {
          available: false,
          waitingCount: 0,
          daysUntilReturn: undefined,
          expectedReturnDate: undefined,
        },
      });
      setSearchInput("");
      setDebouncedTerm("");
      setShowDropdown(false);
      return;
    }
    setSelectedBooks((prev) => [...prev, book]);
    setSearchInput("");
    setDebouncedTerm("");
    setShowDropdown(false);
    toast.success(`"${book.title}" added`);
  };

  const handleWaitForBook = async () => {
    if (!availabilityModal) return;
    try {
      const bookId =
        availabilityModal.book.bookId ?? availabilityModal.book._id ?? "";
      const res = await createReservation.mutateAsync({
        bookId,
        expectedAvailabilityDate:
          availabilityModal.availability.expectedReturnDate,
      });
      const expectedDate = res.expectedAvailabilityDate
        ? new Date(res.expectedAvailabilityDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : availabilityModal.availability.expectedReturnDate
          ? new Date(
              availabilityModal.availability.expectedReturnDate,
            ).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })
          : null;
      const position = res.queuePosition ?? 1;
      if (expectedDate) {
        toast.success(
          `Reservation confirmed! This book is expected to be available around ${expectedDate}. You are #${position} in the queue.`,
          { duration: 6000 },
        );
      } else {
        toast.success(
          `You are added to the waiting list! You are #${position} in the queue.`,
        );
      }
      setAvailabilityModal(null);
      setProcurementForm(false);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to join waiting list",
      );
    }
  };

  const handleUrgentProcurement = async () => {
    try {
      const bookId =
        availabilityModal?.book.bookId ??
        availabilityModal?.book._id ??
        undefined;
      await createUrgentProc.mutateAsync({
        bookTitle: procBookTitle,
        bookId,
        author: procAuthor || undefined,
        edition: procEdition || undefined,
        publisher: procPublisher || undefined,
      });
      toast.success(
        "Procurement request created! Admin has been notified. Track status in My Requests.",
        { duration: 5000 },
      );
      setAvailabilityModal(null);
      setProcurementForm(false);
      navigate({ to: "/student/requests" });
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to submit procurement request",
      );
    }
  };

  const handleRemoveBook = (id: string) => {
    setSelectedBooks((prev) => prev.filter((b) => (b.bookId ?? b._id) !== id));
  };

  const handleRemoveManual = (idx: number) => {
    setManualRequests((prev) => prev.filter((_, i) => i !== idx));
  };

  const outOfStockBooks = selectedBooks.filter(
    (b) => Number(b.availableCount ?? b.availableQuantity ?? 0) === 0,
  );
  const canGenerateChallan =
    selectedBooks.length > 0 || manualRequests.length > 0;

  const handleGenerateChallan = async () => {
    if (!canGenerateChallan) return;

    // Check token — read from both keys for robustness
    const studentToken =
      localStorage.getItem("svga_token") ||
      (() => {
        try {
          const raw = localStorage.getItem("svga_student_session");
          if (!raw) return "";
          const s = JSON.parse(raw) as { token: string; expiresAt?: number };
          return s.token ?? "";
        } catch {
          return "";
        }
      })();

    if (!studentToken || studentToken.startsWith("pending_")) {
      toast.error("Session not ready — please log in again");
      navigate({ to: "/student/login" });
      return;
    }

    try {
      // Step 1: Create the book request
      const requestResult = await createRequest.mutateAsync({
        selectedBookIds: selectedBooks.map(
          (b) => (b.bookId ?? b._id) as string,
        ),
        requestedBooks: manualRequests.map((m) => ({
          title: m.title,
          author: m.author,
          edition: m.edition,
          publisher: m.publisher,
          imageUrl: m.imageUrl,
          note: m.note,
        })),
      });

      // Step 2: Generate challan for the new request
      const requestId = requestResult.requestId ?? requestResult._id ?? "";
      if (requestId) {
        try {
          const challanResult = await createChallan.mutateAsync(requestId);
          if (challanResult.qrCodeDataUrl) {
            setChallanQrUrl(challanResult.qrCodeDataUrl);
          }
          toast.success("Challan created! Redirecting to your challan...");
          navigate({
            to: "/student/challan/$requestId",
            params: { requestId },
          });
          return;
        } catch {
          // Challan generation failure is non-fatal — go to requests
        }
      }

      toast.success("Request submitted! View it in your requests.");
      navigate({ to: "/student/requests" });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to create challan";
      if (
        msg.toLowerCase().includes("authenticated") ||
        msg.toLowerCase().includes("log in") ||
        msg.toLowerCase().includes("session") ||
        msg.toLowerCase().includes("token")
      ) {
        toast.error("Session expired — please log in again");
        navigate({ to: "/student/login" });
      } else {
        toast.error(msg || "Failed to save request. Please try again.");
      }
    }
  };

  // Fetch real availability data when an out-of-stock book is clicked
  const bookAvailabilityQuery = useCheckBookAvailability(checkingBookId ?? "");

  // Sync fetched availability into the modal as data arrives
  useEffect(() => {
    if (!checkingBookId || !bookAvailabilityQuery.data) return;
    setAvailabilityModal((prev) =>
      prev
        ? {
            ...prev,
            availability: bookAvailabilityQuery.data as BookAvailability,
          }
        : prev,
    );
  }, [checkingBookId, bookAvailabilityQuery.data]);

  return (
    <StudentLayout>
      {/* Book Availability Modal */}
      <AnimatePresence>
        {availabilityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.2 }}
              className="bg-card w-full max-w-md rounded-2xl shadow-elevated border border-border overflow-hidden"
              data-ocid="books.availability_modal"
            >
              {!procurementForm ? (
                <div className="p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display font-semibold text-foreground">
                        {availabilityModal.book.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {availabilityModal.book.author}
                      </p>
                    </div>
                  </div>
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-5">
                    <p className="text-sm text-amber-800 font-medium mb-1">
                      📚 This book is currently checked out.
                    </p>
                    {availabilityModal.availability.daysUntilReturn != null && (
                      <p className="text-sm text-amber-700">
                        Expected return:{" "}
                        <strong>
                          {availabilityModal.availability.daysUntilReturn} days
                        </strong>{" "}
                        from now.
                      </p>
                    )}
                    {availabilityModal.availability.waitingCount > 0 && (
                      <p className="text-xs text-amber-600 mt-1">
                        {availabilityModal.availability.waitingCount} student(s)
                        already waiting.
                      </p>
                    )}
                    <p className="text-sm text-amber-700 mt-2">
                      Would you like to wait for this book?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="w-full gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={handleWaitForBook}
                      disabled={createReservation.isPending}
                      data-ocid="books.availability_modal.wait_button"
                    >
                      {createReservation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Clock className="h-4 w-4" />
                      )}
                      YES, I can wait
                    </Button>
                    <Button
                      className="w-full gap-2"
                      onClick={() => setProcurementForm(true)}
                      data-ocid="books.availability_modal.urgent_button"
                    >
                      <Zap className="h-4 w-4" /> NO, I need urgently
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAvailabilityModal(null)}
                    className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-smooth"
                    data-ocid="books.availability_modal.cancel_button"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="h-5 w-5 text-primary" />
                    <h3 className="font-display font-semibold text-foreground">
                      Urgent Procurement Request
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    This will be flagged as{" "}
                    <strong>PROCUREMENT REQUIRED</strong>. Admin will source
                    this book for you.
                  </p>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        Book Title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        value={procBookTitle}
                        onChange={(e) => setProcBookTitle(e.target.value)}
                        placeholder="Book title"
                        data-ocid="books.procurement.title_input"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Author</Label>
                        <Input
                          value={procAuthor}
                          onChange={(e) => setProcAuthor(e.target.value)}
                          placeholder="Author"
                          data-ocid="books.procurement.author_input"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Edition</Label>
                        <Input
                          value={procEdition}
                          onChange={(e) => setProcEdition(e.target.value)}
                          placeholder="Edition"
                          data-ocid="books.procurement.edition_input"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Publisher</Label>
                      <Input
                        value={procPublisher}
                        onChange={(e) => setProcPublisher(e.target.value)}
                        placeholder="Publisher"
                        data-ocid="books.procurement.publisher_input"
                      />
                    </div>
                    <div className="flex gap-2">
                      {(["Optional", "Required"] as const).map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setProcUrgency(u)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-smooth ${
                            procUrgency === u
                              ? u === "Required"
                                ? "bg-red-100 text-red-700 border-red-300"
                                : "bg-amber-100 text-amber-700 border-amber-300"
                              : "bg-card text-muted-foreground border-border hover:border-primary/30"
                          }`}
                          data-ocid={`books.procurement.urgency_${u.toLowerCase()}`}
                        >
                          {u === "Required"
                            ? "🔴 Urgently Needed"
                            : "🟡 Can Wait"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <Button
                      variant="outline"
                      onClick={() => setProcurementForm(false)}
                      data-ocid="books.procurement.back_button"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleUrgentProcurement}
                      disabled={
                        !procBookTitle.trim() ||
                        createProc.isPending ||
                        createUrgentProc.isPending
                      }
                      data-ocid="books.procurement.submit_button"
                    >
                      {createProc.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />{" "}
                          Submitting…
                        </>
                      ) : (
                        "Submit Request"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Page header */}
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-foreground">
              Select Books
            </h1>
            <p className="text-muted-foreground mt-1">
              Search for books and build your borrowing request
            </p>
          </div>

          {/* Step Indicator */}
          <StepIndicator
            steps={WIZARD_STEPS}
            currentStep={step}
            className="mb-8"
          />

          {/* ──── STEP 1: Course Selection ──── */}
          {step === 1 && (
            <Card data-ocid="books.step1.card">
              <CardContent className="pt-6 pb-8">
                <div className="max-w-sm mx-auto text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="h-7 w-7 text-primary" />
                  </div>
                  <h2 className="text-xl font-display font-semibold text-foreground mb-1">
                    What are you studying?
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Select your course so we can show the most relevant books.
                  </p>
                  <div className="space-y-2 text-left">
                    <Label
                      htmlFor="course-select"
                      className="text-sm font-medium"
                    >
                      Course / Standard
                    </Label>
                    <Select
                      value={selectedCourse}
                      onValueChange={setSelectedCourse}
                    >
                      <SelectTrigger
                        id="course-select"
                        data-ocid="books.step1.course_select"
                        className="w-full"
                      >
                        <SelectValue placeholder="Select your course…" />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSES.map((course) => (
                          <SelectItem key={course} value={course}>
                            {course}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    className="w-full mt-6 gap-2"
                    disabled={!selectedCourse}
                    onClick={() => setStep(2)}
                    data-ocid="books.step1.continue_button"
                  >
                    Continue
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ──── STEP 2: Book Search & Selection ──── */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Course badge + back */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Course:</span>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {selectedCourse}
                  </Badge>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-smooth"
                  data-ocid="books.step2.back_button"
                >
                  ← Change course
                </button>
              </div>

              {/* Search box */}
              <div ref={searchBoxRef} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm font-medium">Search Books</Label>
                  <button
                    type="button"
                    onClick={() => setShowBookFilters((v) => !v)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors ${
                      showBookFilters || activeBookFilters.length > 0
                        ? "border-sky-400 text-sky-700 bg-sky-50"
                        : "border-border text-muted-foreground hover:border-sky-300 hover:text-sky-700"
                    }`}
                    data-ocid="books.filter_toggle"
                  >
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                    {activeBookFilters.length > 0 && (
                      <span className="bg-sky-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                        {activeBookFilters.length}
                      </span>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by title, author, or keyword…"
                    value={searchInput}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    onFocus={() =>
                      debouncedTerm.length > 1 && setShowDropdown(true)
                    }
                    className="pl-10"
                    data-ocid="books.search_input"
                  />
                </div>

                {/* Filter panel */}
                {showBookFilters && (
                  <div
                    className="mt-3 bg-sky-50/60 border border-sky-200 rounded-xl p-3 space-y-3"
                    data-ocid="books.filter_panel"
                  >
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">
                          Author
                        </Label>
                        <Select
                          value={authorFilter}
                          onValueChange={(v) => setBookFilter("author", v)}
                        >
                          <SelectTrigger
                            className="h-8 text-xs"
                            data-ocid="books.author_filter"
                          >
                            <SelectValue placeholder="All authors" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Authors</SelectItem>
                            {uniqueAuthors.map((a) => (
                              <SelectItem key={a} value={a}>
                                {a}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[11px] text-muted-foreground">
                          Edition
                        </Label>
                        <Select
                          value={editionFilter}
                          onValueChange={(v) => setBookFilter("edition", v)}
                        >
                          <SelectTrigger
                            className="h-8 text-xs"
                            data-ocid="books.edition_filter"
                          >
                            <SelectValue placeholder="All editions" />
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
                        <Label className="text-[11px] text-muted-foreground">
                          Category
                        </Label>
                        <Select
                          value={categoryBookFilter}
                          onValueChange={(v) => setBookFilter("category", v)}
                        >
                          <SelectTrigger
                            className="h-8 text-xs"
                            data-ocid="books.category_filter"
                          >
                            <SelectValue placeholder="All categories" />
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
                        <Label className="text-[11px] text-muted-foreground">
                          Sort by
                        </Label>
                        <Select
                          value={sortFilter}
                          onValueChange={(v) => setBookFilter("sort", v)}
                        >
                          <SelectTrigger
                            className="h-8 text-xs"
                            data-ocid="books.sort_select"
                          >
                            <SelectValue placeholder="Sort" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="title-asc">Title A→Z</SelectItem>
                            <SelectItem value="title-desc">
                              Title Z→A
                            </SelectItem>
                            <SelectItem value="author-asc">
                              Author A→Z
                            </SelectItem>
                            <SelectItem value="newest">Newest First</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {activeBookFilters.length > 0 && (
                      <button
                        type="button"
                        onClick={clearBookFilters}
                        className="text-xs text-sky-600 hover:text-sky-800 underline"
                        data-ocid="books.clear_filters"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                )}

                {/* Active filter tags */}
                {activeBookFilters.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {activeBookFilters.map((f) => (
                      <BookFilterTag
                        key={f.key}
                        label={f.label}
                        onRemove={() =>
                          f.key === "sort"
                            ? setBookFilter("sort", "title-asc")
                            : setBookFilter(f.key, "All")
                        }
                      />
                    ))}
                  </div>
                )}

                {/* Autocomplete dropdown */}
                {showDropdown && (
                  <div
                    className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-elevated overflow-hidden"
                    data-ocid="books.search_dropdown"
                  >
                    {searchLoading ? (
                      <div className="px-4 py-3">
                        <LoadingSpinner size="sm" text="Searching…" />
                      </div>
                    ) : !filteredResults || filteredResults.length === 0 ? (
                      <div className="px-4 py-4 text-center">
                        <p className="text-sm text-muted-foreground">
                          {activeBookFilters.length > 0
                            ? "No books match your filters."
                            : `No books found for "${debouncedTerm}"`}
                        </p>
                        <button
                          type="button"
                          className="text-sm text-primary hover:underline mt-1"
                          onClick={() => {
                            setShowDropdown(false);
                            setShowManualForm(true);
                          }}
                        >
                          + Request it manually
                        </button>
                      </div>
                    ) : (
                      <ul className="divide-y divide-border max-h-72 overflow-y-auto">
                        {filteredResults.map((book) => {
                          const available =
                            Number(
                              book.availableCount ??
                                book.availableQuantity ??
                                0,
                            ) > 0;
                          const alreadyAdded = isBookSelected(
                            book.bookId ?? book._id ?? "",
                          );
                          return (
                            <li key={book.bookId ?? book._id}>
                              <button
                                type="button"
                                disabled={alreadyAdded}
                                onClick={() => handleSelectBook(book)}
                                data-ocid="books.search_result.item"
                                className="w-full text-left px-4 py-3 hover:bg-muted/60 transition-smooth flex items-center justify-between gap-3 disabled:opacity-50 disabled:cursor-default"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground truncate">
                                    {book.title}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {book.author} · {book.edition} ·{" "}
                                    {book.publisher}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {available ? (
                                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                      {Number(
                                        book.availableCount ??
                                          book.availableQuantity ??
                                          0,
                                      )}{" "}
                                      available
                                    </Badge>
                                  ) : (
                                    <Badge
                                      variant="outline"
                                      className="text-destructive border-destructive/30 text-xs"
                                    >
                                      Out of stock
                                    </Badge>
                                  )}
                                  {alreadyAdded && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Added
                                    </Badge>
                                  )}
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Selected Books */}
              {selectedBooks.length > 0 && (
                <div data-ocid="books.selected_books.section">
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    Selected Books
                    <Badge className="ml-2 bg-primary/10 text-primary border-primary/20 text-xs">
                      {selectedBooks.length}
                    </Badge>
                  </h3>
                  <div className="space-y-3">
                    {selectedBooks.map((book, idx) => {
                      const isUnavailable =
                        Number(
                          book.availableCount ?? book.availableQuantity ?? 0,
                        ) === 0;
                      return (
                        <div key={book.bookId}>
                          <div
                            data-ocid={`books.selected_books.item.${idx + 1}`}
                            className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border transition-smooth ${
                              isUnavailable
                                ? "bg-destructive/5 border-destructive/20"
                                : "bg-primary/5 border-primary/15"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-foreground truncate">
                                {book.title}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {book.author} · {book.edition}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {isUnavailable ? (
                                <Badge
                                  variant="outline"
                                  className="text-destructive border-destructive/30 text-xs"
                                >
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Out of stock
                                </Badge>
                              ) : (
                                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                  Available
                                </Badge>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveBook(
                                    (book.bookId ?? book._id) as string,
                                  )
                                }
                                data-ocid={`books.selected_books.delete_button.${idx + 1}`}
                                className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-smooth"
                                aria-label={`Remove ${book.title}`}
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Recommendations for out-of-stock */}
                          {isUnavailable && (
                            <div className="ml-4 pl-4 border-l-2 border-primary/20 mt-2">
                              <RecommendationRow
                                bookId={(book.bookId ?? book._id) as string}
                                onSelect={handleSelectBook}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {outOfStockBooks.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 text-destructive" />
                      {outOfStockBooks.length} book
                      {outOfStockBooks.length > 1 ? "s are" : " is"} out of
                      stock — SVGA will procure{" "}
                      {outOfStockBooks.length > 1 ? "them" : "it"} for you.
                    </p>
                  )}
                </div>
              )}

              {/* Manual Request Section */}
              <div
                className="rounded-xl border border-dashed border-border bg-muted/30 p-4"
                data-ocid="books.manual_request.section"
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">
                      Request a Book Not in Library
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      SVGA will purchase the book and deliver it to you
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowManualForm((v) => !v)}
                    data-ocid="books.manual_request.toggle_button"
                    className="gap-1.5 text-xs"
                  >
                    <PlusCircle className="h-3.5 w-3.5" />
                    {showManualForm ? "Cancel" : "Add Book"}
                  </Button>
                </div>

                {showManualForm && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <ManualBookForm
                      onAdd={(entry) => {
                        setManualRequests((prev) => [...prev, entry]);
                        setShowManualForm(false);
                      }}
                    />
                  </div>
                )}

                {manualRequests.length > 0 && (
                  <div
                    className="mt-3 space-y-2"
                    data-ocid="books.manual_request.list"
                  >
                    {manualRequests.map((entry, idx) => (
                      <div
                        key={`manual-${entry.title}-${idx}`}
                        data-ocid={`books.manual_request.item.${idx + 1}`}
                        className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg bg-card border border-border"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {entry.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {entry.author}
                            {entry.edition ? ` · ${entry.edition}` : ""}
                            {entry.publisher ? ` · ${entry.publisher}` : ""}
                          </p>
                        </div>
                        <Badge className="shrink-0 bg-amber-100 text-amber-700 border-amber-200 text-xs">
                          To procure
                        </Badge>
                        <button
                          type="button"
                          onClick={() => handleRemoveManual(idx)}
                          data-ocid={`books.manual_request.delete_button.${idx + 1}`}
                          className="p-1 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-smooth"
                          aria-label={`Remove ${entry.title}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {!showManualForm && manualRequests.length === 0 && (
                  <EmptyState
                    icon={BookOpen}
                    title="No manual requests yet"
                    description="Use the form above if you need a book that isn't in our library."
                    className="py-6"
                  />
                )}
              </div>

              {/* Sticky Generate Challan CTA */}
              <div className="sticky bottom-4">
                <div className="bg-card border border-border rounded-2xl shadow-elevated px-5 py-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {canGenerateChallan
                        ? `${selectedBooks.length + manualRequests.length} book${selectedBooks.length + manualRequests.length !== 1 ? "s" : ""} in request`
                        : "Add at least one book"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {canGenerateChallan
                        ? `${selectedBooks.length} from library · ${manualRequests.length} to procure`
                        : "Search above or add a manual request"}
                    </p>
                  </div>
                  <Button
                    onClick={handleGenerateChallan}
                    disabled={
                      !canGenerateChallan ||
                      createRequest.isPending ||
                      createChallan.isPending
                    }
                    className="gap-2 shrink-0"
                    data-ocid="books.generate_challan_button"
                  >
                    {createRequest.isPending || createChallan.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    Generate Challan
                  </Button>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </StudentLayout>
  );
}
