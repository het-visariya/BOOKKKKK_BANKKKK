import { CheckCircle2, CreditCard, Smartphone, X, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

type Tab = "upi" | "card" | "netbanking";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  amount: number;
  studentName: string;
}

export function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  amount,
  studentName,
}: PaymentModalProps) {
  const [tab, setTab] = useState<Tab>("upi");
  const [upiId, setUpiId] = useState("demo@razorpay");
  const [card, setCard] = useState({
    number: "4242 4242 4242 4242",
    expiry: "12/28",
    cvv: "123",
    name: "",
  });
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTab("upi");
      setProcessing(false);
      setSucceeded(false);
    }
  }, [isOpen]);

  // Auto-close after success animation
  useEffect(() => {
    if (succeeded) {
      const t = setTimeout(() => onSuccess(), 1500);
      return () => clearTimeout(t);
    }
  }, [succeeded, onSuccess]);

  const handlePay = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 1400));
    setProcessing(false);
    setSucceeded(true);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={!succeeded ? onClose : undefined}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: "spring", stiffness: 340, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            aria-modal="true"
            aria-label="Complete Payment"
          >
            <div
              className="w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              {/* Success state */}
              <AnimatePresence mode="wait">
                {succeeded ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-14 px-8 text-center"
                    data-ocid="payment_modal.success_state"
                  >
                    <motion.div
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 400,
                        damping: 20,
                        delay: 0.05,
                      }}
                      className="mb-5"
                    >
                      <CheckCircle2 className="h-20 w-20 text-emerald-500" />
                    </motion.div>
                    <motion.h2
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-2xl font-display font-bold text-foreground mb-2"
                    >
                      Payment Successful!
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-muted-foreground text-sm"
                    >
                      ₹{amount} paid for SVGA Book Bank Membership
                    </motion.p>
                    <motion.div
                      initial={{ opacity: 0, scaleX: 0 }}
                      animate={{ opacity: 1, scaleX: 1 }}
                      transition={{ delay: 0.45 }}
                      className="mt-6 h-1 w-32 rounded-full bg-emerald-400"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {/* Header bar */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-gradient-to-r from-[#0f172a] to-[#1e3a5f]">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-md bg-[#528ff5] flex items-center justify-center text-white font-bold text-sm select-none">
                          R
                        </div>
                        <span className="text-white font-semibold text-sm tracking-wide">
                          Complete Payment
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="text-white/60 hover:text-white transition-colors rounded-full p-1"
                        aria-label="Close payment modal"
                        data-ocid="payment_modal.close_button"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Amount + info */}
                    <div className="px-5 pt-5 pb-3 border-b border-border bg-[#f8fbff]">
                      <div className="flex items-end justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground mb-0.5">
                            Paying for:{" "}
                            <span className="font-medium text-foreground">
                              {studentName || "Student"}
                            </span>
                          </p>
                          <p className="text-xs text-muted-foreground">
                            SVGA Book Bank Membership
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-display font-bold text-foreground">
                            ₹{amount}
                          </p>
                          <p className="text-xs text-emerald-600 font-medium">
                            Refundable deposit
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-border">
                      {(
                        [
                          { id: "upi" as Tab, label: "UPI", icon: Smartphone },
                          {
                            id: "card" as Tab,
                            label: "Card",
                            icon: CreditCard,
                          },
                          {
                            id: "netbanking" as Tab,
                            label: "Net Banking",
                            icon: Zap,
                          },
                        ] as {
                          id: Tab;
                          label: string;
                          icon: React.ElementType;
                        }[]
                      ).map(({ id, label, icon: Icon }) => (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setTab(id)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold transition-colors relative ${
                            tab === id
                              ? "text-primary"
                              : "text-muted-foreground hover:text-foreground"
                          }`}
                          data-ocid={`payment_modal.${id}_tab`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                          {tab === id && (
                            <motion.div
                              layoutId="tab-indicator"
                              className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                            />
                          )}
                        </button>
                      ))}
                    </div>

                    {/* Tab content */}
                    <div className="px-5 py-5 space-y-4">
                      <AnimatePresence mode="wait">
                        {tab === "upi" && (
                          <motion.div
                            key="upi"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            className="space-y-4"
                          >
                            {/* Fake QR area */}
                            <div className="flex flex-col items-center gap-3">
                              <div className="relative w-40 h-40 rounded-xl overflow-hidden border-2 border-dashed border-[#bae6fd] bg-[#f0f9ff] flex items-center justify-center">
                                {/* Decorative QR placeholder using divs */}
                                <QrPlaceholder />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Scan with any UPI app to pay
                              </p>
                            </div>

                            <div className="relative">
                              <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-border" />
                              </div>
                              <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-card text-muted-foreground">
                                  or enter UPI ID
                                </span>
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <input
                                value={upiId}
                                onChange={(e) => setUpiId(e.target.value)}
                                className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                                placeholder="yourname@upi"
                                data-ocid="payment_modal.upi_input"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={handlePay}
                              disabled={processing}
                              className="w-full h-11 rounded-xl bg-[#528ff5] hover:bg-[#3b7de8] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                              data-ocid="payment_modal.upi_pay_button"
                            >
                              {processing ? (
                                <>
                                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                  Verifying...
                                </>
                              ) : (
                                `Verify & Pay ₹${amount}`
                              )}
                            </button>
                          </motion.div>
                        )}

                        {tab === "card" && (
                          <motion.div
                            key="card"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            className="space-y-3"
                          >
                            <div>
                              <label
                                htmlFor="card-number"
                                className="text-xs font-medium text-muted-foreground block mb-1"
                              >
                                Card Number
                              </label>
                              <input
                                id="card-number"
                                value={card.number}
                                onChange={(e) =>
                                  setCard((c) => ({
                                    ...c,
                                    number: e.target.value,
                                  }))
                                }
                                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                                placeholder="4242 4242 4242 4242"
                                data-ocid="payment_modal.card_number_input"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label
                                  htmlFor="card-expiry"
                                  className="text-xs font-medium text-muted-foreground block mb-1"
                                >
                                  Expiry
                                </label>
                                <input
                                  id="card-expiry"
                                  value={card.expiry}
                                  onChange={(e) =>
                                    setCard((c) => ({
                                      ...c,
                                      expiry: e.target.value,
                                    }))
                                  }
                                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                                  placeholder="MM/YY"
                                  data-ocid="payment_modal.card_expiry_input"
                                />
                              </div>
                              <div>
                                <label
                                  htmlFor="card-cvv"
                                  className="text-xs font-medium text-muted-foreground block mb-1"
                                >
                                  CVV
                                </label>
                                <input
                                  id="card-cvv"
                                  type="password"
                                  value={card.cvv}
                                  onChange={(e) =>
                                    setCard((c) => ({
                                      ...c,
                                      cvv: e.target.value,
                                    }))
                                  }
                                  maxLength={4}
                                  className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                                  placeholder="•••"
                                  data-ocid="payment_modal.card_cvv_input"
                                />
                              </div>
                            </div>
                            <div>
                              <label
                                htmlFor="card-name"
                                className="text-xs font-medium text-muted-foreground block mb-1"
                              >
                                Cardholder Name
                              </label>
                              <input
                                id="card-name"
                                value={card.name}
                                onChange={(e) =>
                                  setCard((c) => ({
                                    ...c,
                                    name: e.target.value,
                                  }))
                                }
                                className="w-full h-10 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                                placeholder="Name on card"
                                data-ocid="payment_modal.card_name_input"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={handlePay}
                              disabled={processing}
                              className="w-full h-11 rounded-xl bg-[#528ff5] hover:bg-[#3b7de8] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                              data-ocid="payment_modal.card_pay_button"
                            >
                              {processing ? (
                                <>
                                  <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                `Pay ₹${amount}`
                              )}
                            </button>
                          </motion.div>
                        )}

                        {tab === "netbanking" && (
                          <motion.div
                            key="netbanking"
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 8 }}
                            className="space-y-4"
                          >
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                "SBI",
                                "HDFC",
                                "ICICI",
                                "Axis",
                                "Kotak",
                                "Other",
                              ].map((bank) => (
                                <button
                                  key={bank}
                                  type="button"
                                  onClick={handlePay}
                                  disabled={processing}
                                  className="h-14 rounded-xl border border-border bg-background hover:bg-secondary/60 hover:border-primary/40 text-xs font-semibold text-foreground transition-all disabled:opacity-60"
                                  data-ocid={`payment_modal.bank_${bank.toLowerCase()}_button`}
                                >
                                  {bank}
                                </button>
                              ))}
                            </div>
                            {processing && (
                              <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                                <span className="h-4 w-4 border-2 border-primary/40 border-t-primary rounded-full animate-spin" />
                                Redirecting to bank...
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Footer */}
                    <div className="px-5 pb-4 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={onClose}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                        data-ocid="payment_modal.cancel_button"
                      >
                        Cancel
                      </button>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <span className="inline-block h-3 w-3 rounded-full bg-emerald-400" />
                        Demo mode — no real charge
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Lightweight CSS-drawn QR code placeholder (no external lib needed)
function QrPlaceholder() {
  return (
    <svg
      width="112"
      height="112"
      viewBox="0 0 112 112"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* TL finder */}
      <rect x="8" y="8" width="28" height="28" rx="3" fill="#0f172a" />
      <rect x="13" y="13" width="18" height="18" rx="1.5" fill="white" />
      <rect x="17" y="17" width="10" height="10" rx="1" fill="#0f172a" />
      {/* TR finder */}
      <rect x="76" y="8" width="28" height="28" rx="3" fill="#0f172a" />
      <rect x="81" y="13" width="18" height="18" rx="1.5" fill="white" />
      <rect x="85" y="17" width="10" height="10" rx="1" fill="#0f172a" />
      {/* BL finder */}
      <rect x="8" y="76" width="28" height="28" rx="3" fill="#0f172a" />
      <rect x="13" y="81" width="18" height="18" rx="1.5" fill="white" />
      <rect x="17" y="85" width="10" height="10" rx="1" fill="#0f172a" />
      {/* Data modules (decorative) */}
      <rect x="42" y="8" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="52" y="8" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="62" y="8" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="42" y="18" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="62" y="18" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="52" y="28" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="8" y="42" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="18" y="42" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="28" y="42" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="8" y="52" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="28" y="52" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="18" y="62" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="42" y="42" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="52" y="42" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="62" y="42" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="72" y="42" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="82" y="42" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="98" y="42" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="42" y="52" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="62" y="52" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="82" y="52" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="98" y="52" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="42" y="62" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="52" y="62" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="72" y="62" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="88" y="62" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="42" y="76" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="52" y="76" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="62" y="76" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="72" y="76" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="88" y="76" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="98" y="76" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="42" y="86" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="72" y="86" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="82" y="86" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="42" y="96" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="52" y="96" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="72" y="96" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="88" y="96" width="6" height="6" rx="1" fill="#0f172a" />
      <rect x="98" y="96" width="6" height="6" rx="1" fill="#0f172a" />
    </svg>
  );
}
