import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Save, X, AlertCircle, ChevronDown } from "lucide-react";
import Modal from "./Modal";

interface ServiceOption {
  id: number;
  name: string;
  price: number;
}

interface PromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { serviceId: number; discount: number; status: "active" | "inactive" }) => Promise<void>;
  title: string;
  subtitle?: string;
  services: ServiceOption[];
  initialData?: {
    serviceId: number | null;
    discount: number | string;
    status: "active" | "inactive";
  };
  isLoading?: boolean;
  saveButtonText?: string;
}

const formatPrice = (price: number) => `Rp ${price.toLocaleString("id-ID")}`;

export default function PromoModal({
  isOpen,
  onClose,
  onSave,
  title,
  subtitle,
  services,
  initialData,
  isLoading = false,
  saveButtonText = "Save Changes",
}: PromoModalProps) {
  const [serviceId, setServiceId]     = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [discount, setDiscount]       = useState<string>("");
  const [status, setStatus]           = useState<"active" | "inactive">("active");
  const [submitted, setSubmitted]     = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setServiceId(initialData?.serviceId ?? null);
      setDiscount(String(initialData?.discount ?? ""));
      setStatus(initialData?.status ?? "active");
      setSearchQuery("");
      setShowDropdown(false);
      setSubmitted(false);
    }
  }, [isOpen]);

  // Close dropdown on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId]
  );

  const filteredServices = useMemo(() => {
    if (!searchQuery.trim()) return services;
    const q = searchQuery.toLowerCase();
    return services.filter((s) => s.name.toLowerCase().includes(q));
  }, [services, searchQuery]);

  const discountNum = parseInt(discount);
  const originalPrice = selectedService?.price ?? 0;
  const finalPrice = selectedService && !isNaN(discountNum) && discountNum >= 1 && discountNum <= 99
    ? Math.round(originalPrice - (originalPrice * discountNum / 100))
    : null;

  // Validation
  const errors: Record<string, string> = {};
  if (submitted) {
    if (!serviceId)                                      errors.service  = "Please select a service";
    if (!discount)                                       errors.discount = "Discount is required";
    else if (isNaN(discountNum))                         errors.discount = "Discount must be a number";
    else if (discountNum < 1)                            errors.discount = "Discount must be at least 1%";
    else if (discountNum > 99)                           errors.discount = "Discount cannot exceed 99%";
  }

  const hasChanges = () => {
    if (!initialData) return !!serviceId && !!discount;
    return (
      serviceId !== initialData.serviceId ||
      String(discount) !== String(initialData.discount) ||
      status !== initialData.status
    );
  };

  const handleSelectService = (service: ServiceOption) => {
    setServiceId(service.id);
    setSearchQuery("");
    setShowDropdown(false);
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!serviceId) return;
    if (!discount || isNaN(discountNum) || discountNum < 1 || discountNum > 99) return;
    if (!hasChanges()) return;
    await onSave({ serviceId, discount: discountNum, status });
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white placeholder-zinc-500 
     focus:outline-none focus:ring-2 transition-colors
     ${hasError ? "border-red-500 focus:ring-red-500" : "border-zinc-700 focus:ring-amber-500"}`;

  const footer = (
    <div className="space-y-3">
      {submitted && Object.keys(errors).length > 0 && (
        <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/40 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">Please fill in all required fields correctly before saving.</p>
        </div>
      )}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors font-medium disabled:opacity-50 flex items-center justify-center gap-2"
        >
          <X size={18} /> Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !hasChanges()}
          className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            !hasChanges()
              ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              : "bg-amber-500 hover:bg-amber-600 text-white"
          } disabled:opacity-50`}
        >
          {isLoading ? (
            <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</>
          ) : (
            <><Save size={18} /> {saveButtonText}</>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} subtitle={subtitle} footer={footer} size="md">
      <div className="space-y-6">

        {/* Service Dropdown */}
        <div className="space-y-2">
          <label className="block text-zinc-400 text-sm font-medium">
            Service <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown((v) => !v)}
              className={`w-full px-4 py-3 bg-zinc-800 border rounded-xl text-left flex items-center justify-between transition-colors
                ${errors.service ? "border-red-500" : "border-zinc-700 hover:border-zinc-600"}
                ${selectedService ? "text-white" : "text-zinc-500"}`}
            >
              <span>{selectedService ? `${selectedService.name} — ${formatPrice(selectedService.price)}` : "Select a service..."}</span>
              <ChevronDown size={16} className={`text-zinc-400 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
            </button>

            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden">
                {/* Search input inside dropdown */}
                <div className="p-2 border-b border-zinc-700">
                  <div className="flex items-center gap-2 px-3 py-2 bg-zinc-900 rounded-lg">
                    <Search size={14} className="text-zinc-500 flex-shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search services..."
                      className="w-full bg-transparent text-white text-sm placeholder-zinc-500 focus:outline-none"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Service list */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredServices.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-zinc-500 text-center">No services found</p>
                  ) : (
                    filteredServices.map((service) => (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleSelectService(service)}
                        className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-zinc-700 transition-colors
                          ${service.id === serviceId ? "bg-zinc-700/50" : ""}`}
                      >
                        <span className="text-white text-sm">{service.name}</span>
                        <span className="text-[#D4AF37] text-sm font-medium">{formatPrice(service.price)}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {errors.service && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.service}
            </p>
          )}
        </div>

        {/* Original Price (readonly) */}
        <div className="space-y-2">
          <label className="block text-zinc-400 text-sm font-medium">Original Price</label>
          <div className="w-full px-4 py-3 bg-zinc-800/50 border border-zinc-700 rounded-xl text-zinc-400 cursor-default select-none">
            {selectedService ? formatPrice(selectedService.price) : <span className="text-zinc-600">Select a service first</span>}
          </div>
          <p className="text-xs text-zinc-500">Price is taken from the selected service</p>
        </div>

        {/* Discount */}
        <div className="space-y-2">
          <label className="block text-zinc-400 text-sm font-medium">
            Discount (%) <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            value={discount}
            onChange={(e) => setDiscount(e.target.value)}
            placeholder="e.g. 20"
            min={1}
            max={99}
            className={inputClass(!!errors.discount)}
          />
          {errors.discount ? (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5" /> {errors.discount}
            </p>
          ) : (
            <p className="text-xs text-zinc-500">Discount percentage (1–99%)</p>
          )}
        </div>

        {/* Final Price Preview */}
        <div className="space-y-2">
          <label className="block text-zinc-400 text-sm font-medium">Final Price Preview</label>
          <div className={`w-full px-4 py-3 border rounded-xl cursor-default select-none ${
            finalPrice !== null
              ? "bg-[#D4AF37]/5 border-[#D4AF37]/30 text-[#D4AF37] font-bold text-lg"
              : "bg-zinc-800/50 border-zinc-700 text-zinc-600"
          }`}>
            {finalPrice !== null ? formatPrice(finalPrice) : "Fill in service and discount to preview"}
          </div>
          <p className="text-xs text-zinc-500">Calculated automatically — cannot be edited directly</p>
        </div>

        {/* Status */}
        <div className="space-y-2">
          <label className="block text-zinc-400 text-sm font-medium">
            Status <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "active" | "inactive")}
            className={inputClass(false)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

      </div>
    </Modal>
  );
}
