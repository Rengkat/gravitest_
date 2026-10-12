"use client";

import { useState } from "react";
import { CreditCard, Plus, Trash2, Check, X, Shield, Loader2 } from "lucide-react";
import { SavedCard } from "@/types/billing";
import { BRAND_CONFIG } from "@/lib/constants/billing";

interface PaymentMethodsProps {
  cards: SavedCard[];
  onSetDefault: (id: string) => Promise<unknown>;
  onRemove: (id: string) => Promise<unknown>;
  onAddCard: () => void; // routes to the subscribe/upgrade flow — see note in the modal below
}

export default function PaymentMethods({ cards, onSetDefault, onRemove, onAddCard }: PaymentMethodsProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const setDefault = async (id: string) => {
    setPendingId(id);
    setActionError(null);
    try {
      await onSetDefault(id);
    } catch (err: any) {
      setActionError(err?.message ?? "Couldn't set default card.");
    } finally {
      setPendingId(null);
    }
  };

  const removeCard = async (id: string) => {
    if (cards.find((c) => c.id === id)?.isDefault) {
      setActionError("Can't remove your default card — set another card as default first.");
      return;
    }
    setPendingId(id);
    setActionError(null);
    try {
      await onRemove(id);
    } catch (err: any) {
      setActionError(err?.message ?? "Couldn't remove card.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
              <CreditCard size={18} className="text-green-700" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-gray-900">Payment Methods</h3>
              <p className="text-[12px] text-gray-500">
                {cards.length} card{cards.length !== 1 ? "s" : ""} saved
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
            <Shield size={12} className="text-green-500" />
            Secured by Paystack
          </div>
        </div>

        {actionError && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-[12px] text-red-600">
            {actionError}
          </div>
        )}

        {cards.length === 0 && (
          <div className="mb-4 px-4 py-6 text-center border border-dashed border-gray-200 rounded-xl">
            <p className="text-[13px] text-gray-500">
              No saved cards yet. A card is saved automatically the next time you subscribe or renew
              through Paystack checkout.
            </p>
          </div>
        )}

        {/* Cards list */}
        <div className="space-y-3 mb-4">
          {cards.map((card) => {
            const brand = BRAND_CONFIG[card.brand];
            const isExpired = new Date(card.expYear, card.expMonth - 1) < new Date();
            const isPending = pendingId === card.id;

            return (
              <div
                key={card.id}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  card.isDefault
                    ? "border-green-400 bg-green-50/50"
                    : "border-gray-100 bg-white hover:border-gray-200"
                }`}>
                <div
                  className={`w-12 h-12 rounded-full ${brand.bg} flex items-center justify-center shadow-sm shrink-0`}>
                  <span className={`text-[11px] font-black ${brand.text} tracking-wide`}>
                    {brand.label}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <p className="text-[14px] font-bold text-gray-800 font-mono">
                      •••• •••• •••• {card.last4}
                    </p>
                    {card.isDefault && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                        Default
                      </span>
                    )}
                    {isExpired && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200">
                        Expired
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] text-gray-500">
                    {card.holderName && <span className="mr-2">{card.holderName} ·</span>}
                    Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isPending ? (
                    <Loader2 size={16} className="animate-spin text-gray-400" />
                  ) : (
                    <>
                      {!card.isDefault && (
                        <button
                          onClick={() => setDefault(card.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-semibold text-green-700 border border-green-200 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                          <Check size={12} /> Set Default
                        </button>
                      )}
                      <button
                        onClick={() => removeCard(card.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove card">
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Add card button */}
        <button
          onClick={() => setShowInfoModal(true)}
          className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-[14px] font-semibold text-gray-500 hover:border-green-400 hover:text-green-700 hover:bg-green-50 transition-all flex items-center justify-center gap-2">
          <Plus size={16} /> Add New Card
        </button>
      </div>

      {/* Info modal — cards can't be added via a raw form on this page.
          Collecting a card number/CVV directly in our own UI is a PCI-DSS
          scope problem regardless of what the backend does with it; the
          only compliant path is Paystack's own hosted checkout, which
          tokenizes the card entirely client-side. A card gets saved
          automatically (see TransactionsService.upsertPaymentMethod on the
          backend) the moment a Paystack checkout with a reusable
          authorization succeeds — i.e. on subscribe/renew. */}
      {showInfoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center">
                  <Shield size={18} className="text-green-700" />
                </div>
                <h3 className="text-[16px] font-bold text-gray-900">Adding a Card</h3>
              </div>
              <button
                title="close"
                onClick={() => setShowInfoModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-[13px] text-gray-600 leading-relaxed">
                For your security, cards can't be added directly on this page. Your card is saved
                automatically the next time you subscribe or renew through Paystack's secure checkout —
                your card details go straight to Paystack and never touch our servers.
              </p>
              <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-100 rounded-xl">
                <Shield size={14} className="text-green-600 shrink-0" />
                <p className="text-[11px] text-gray-500">
                  This is the same standard used by every major platform — card data is tokenized by the
                  payment processor, not collected by us.
                </p>
              </div>
            </div>

            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowInfoModal(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-[14px] text-gray-600 font-semibold hover:bg-gray-50">
                Close
              </button>
              <button
                onClick={() => {
                  setShowInfoModal(false);
                  onAddCard();
                }}
                className="flex-[2] py-2.5 bg-green-600 text-white rounded-xl text-[14px] font-bold hover:bg-green-700 flex items-center justify-center gap-2 shadow-sm">
                <Plus size={15} /> Go to Plans
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
