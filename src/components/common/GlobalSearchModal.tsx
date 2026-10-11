import React, { useState, useEffect } from 'react';
import { Search, X, FileText, ShoppingBag, Truck, Building, ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StatusChip } from './StatusChip';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (module: string, itemId?: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose, onNavigate }) => {
  const { requests, tenders, vendors, purchaseOrders } = useApp();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // Toggle or open handled in parent
      }
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const filteredRequests = q
    ? requests.filter(
        (r) =>
          r.referenceNumber.toLowerCase().includes(q) ||
          r.title.toLowerCase().includes(q) ||
          r.departmentName.toLowerCase().includes(q)
      )
    : [];

  const filteredTenders = q
    ? tenders.filter(
        (t) =>
          t.referenceNumber.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q) ||
          t.categories.some((c) => c.toLowerCase().includes(q))
      )
    : [];

  const filteredPOs = q
    ? purchaseOrders.filter(
        (po) =>
          po.referenceNumber.toLowerCase().includes(q) ||
          po.vendorName.toLowerCase().includes(q) ||
          po.tenderReference.toLowerCase().includes(q)
      )
    : [];

  const filteredVendors = q
    ? vendors.filter(
        (v) =>
          v.businessName.toLowerCase().includes(q) ||
          v.cacNumber.toLowerCase().includes(q) ||
          v.categories.some((c) => c.toLowerCase().includes(q))
      )
    : [];

  const hasResults =
    filteredRequests.length > 0 ||
    filteredTenders.length > 0 ||
    filteredPOs.length > 0 ||
    filteredVendors.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-[#07130E]/80 backdrop-blur-md">
      <div className="relative w-full max-w-2xl bg-[#0D1F17] border border-[#1F3A2D] rounded-[20px] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#1F3A2D] flex items-center gap-3 bg-[#132A20]/60">
          <Search className="w-5 h-5 text-[#D4AF37]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search requests, tenders, vendors, purchase orders by ref or name (Ctrl+K)..."
            autoFocus
            className="w-full bg-transparent text-[#F2EFE6] placeholder-[#A8B5AB]/60 text-sm focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-[#A8B5AB] hover:text-[#F2EFE6]">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 text-[10px] bg-[#07130E] border border-[#1F3A2D] rounded text-[#A8B5AB]">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-xs">
          {!q && (
            <div className="py-8 text-center text-[#A8B5AB]">
              <p>Type to search across all procurement documents...</p>
              <p className="text-[11px] text-[#A8B5AB]/60 mt-1">
                Try searching for &quot;REQ-2026&quot;, &quot;Generator&quot;, &quot;Apex&quot;, or &quot;PO-2026&quot;
              </p>
            </div>
          )}

          {q && !hasResults && (
            <div className="py-8 text-center text-[#A8B5AB]">
              No documents or vendors found matching &quot;{query}&quot;.
            </div>
          )}

          {/* Requests */}
          {filteredRequests.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase text-[#D4AF37] mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Purchase Requests ({filteredRequests.length})
              </div>
              <div className="space-y-1">
                {filteredRequests.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      onNavigate('requests', r.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-[#132A20]/50 hover:bg-[#132A20] border border-[#1F3A2D] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#E8CF7A]">{r.referenceNumber}</span>
                        <span className="text-[#F2EFE6] font-medium">{r.title}</span>
                      </div>
                      <div className="text-[11px] text-[#A8B5AB] mt-0.5">
                        {r.departmentName} · ₦{r.estimatedTotal.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusChip status={r.status} size="sm" />
                      <ArrowRight className="w-3.5 h-3.5 text-[#A8B5AB] group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tenders */}
          {filteredTenders.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase text-[#D4AF37] mb-2 flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" /> Tenders ({filteredTenders.length})
              </div>
              <div className="space-y-1">
                {filteredTenders.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onNavigate('tenders', t.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-[#132A20]/50 hover:bg-[#132A20] border border-[#1F3A2D] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#E8CF7A]">{t.referenceNumber}</span>
                        <span className="text-[#F2EFE6] font-medium">{t.title}</span>
                      </div>
                      <div className="text-[11px] text-[#A8B5AB] mt-0.5">
                        Categories: {t.categories.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusChip status={t.status} size="sm" />
                      <ArrowRight className="w-3.5 h-3.5 text-[#A8B5AB] group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Purchase Orders */}
          {filteredPOs.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase text-[#D4AF37] mb-2 flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5" /> Purchase Orders ({filteredPOs.length})
              </div>
              <div className="space-y-1">
                {filteredPOs.map((po) => (
                  <div
                    key={po.id}
                    onClick={() => {
                      onNavigate('orders', po.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-[#132A20]/50 hover:bg-[#132A20] border border-[#1F3A2D] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#E8CF7A]">{po.referenceNumber}</span>
                        <span className="text-[#F2EFE6] font-medium">To: {po.vendorName}</span>
                      </div>
                      <div className="text-[11px] text-[#A8B5AB] mt-0.5">
                        Amount: ₦{po.totalAmount.toLocaleString()} · Due: {po.expectedDeliveryDate}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusChip status={po.status} size="sm" />
                      <ArrowRight className="w-3.5 h-3.5 text-[#A8B5AB] group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vendors */}
          {filteredVendors.length > 0 && (
            <div>
              <div className="text-[11px] font-bold uppercase text-[#D4AF37] mb-2 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5" /> Registered Vendors ({filteredVendors.length})
              </div>
              <div className="space-y-1">
                {filteredVendors.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      onNavigate('vendors', v.id);
                      onClose();
                    }}
                    className="p-2.5 rounded-xl bg-[#132A20]/50 hover:bg-[#132A20] border border-[#1F3A2D] cursor-pointer flex items-center justify-between group transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F2EFE6]">{v.businessName}</span>
                        <span className="text-[11px] font-mono text-[#A8B5AB]">({v.cacNumber})</span>
                      </div>
                      <div className="text-[11px] text-[#A8B5AB] mt-0.5">
                        Score: {v.reliabilityScore}% · Categories: {v.categories.join(', ')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusChip status={v.status} size="sm" />
                      <ArrowRight className="w-3.5 h-3.5 text-[#A8B5AB] group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
