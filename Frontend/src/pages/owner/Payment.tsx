import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { useState } from "react";
import { CreditCard, Save } from "lucide-react";

import { ownerLogo, ownerMenu } from "@/components/config/Menu";
import { logout, getUser } from "@/lib/auth";

import FormInput from "@/components/admin/FormInput";
import ImageUpload from "@/components/admin/ImageUpload";
import InfoCard from "@/components/admin/InfoCard";

import { useToast } from "@/components/ui/Toast";

export default function OwnerPayment() {
  const toast = useToast();

  const [formData, setFormData] = useState({
    bankName:      "",
    accountNumber: "",
    accountHolder: "",
  });

  const [qrisImage, setQrisImage]     = useState<File | null>(null);
  const [qrisPreview, setQrisPreview] = useState<string>("");
  const [isSaving, setIsSaving]       = useState(false);
  const [errors, setErrors]           = useState<Record<string, string>>({});
  const [touched, setTouched]         = useState<Record<string, boolean>>({});

  const currentUser = getUser();

  // Button aktif jika minimal satu field sudah diisi
  const hasAnyInput =
    formData.bankName.trim() !== "" ||
    formData.accountNumber.trim() !== "" ||
    formData.accountHolder.trim() !== "" ||
    qrisImage !== null;

  const validate = (data: typeof formData, image: File | null) => {
    const newErrors: Record<string, string> = {};
    if (!data.bankName.trim())      newErrors.bankName      = "Bank name is required.";
    if (!data.accountNumber.trim()) newErrors.accountNumber = "Account number is required.";
    if (!data.accountHolder.trim()) newErrors.accountHolder = "Account holder name is required.";
    if (!image)                     newErrors.qrisImage     = "QRIS code image is required.";
    return newErrors;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (touched[name]) {
        const newErrors = validate(updated, qrisImage);
        setErrors((prev) => ({ ...prev, [name]: newErrors[name] ?? "" }));
      }
      return updated;
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const newErrors = validate(formData, qrisImage);
    setErrors((prev) => ({ ...prev, [name]: newErrors[name] ?? "" }));
  };

  const handleQrisChange = (file: File | null) => {
    setQrisImage(file);
    setTouched((prev) => ({ ...prev, qrisImage: true }));
    setErrors((prev) => ({ ...prev, qrisImage: file ? "" : "QRIS code image is required." }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched on submit
    setTouched({ bankName: true, accountNumber: true, accountHolder: true, qrisImage: true });

    const newErrors = validate(formData, qrisImage);
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) {
      return;
    }

    setIsSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      toast.success("Payment Settings Saved", "Your bank account information has been updated successfully.");
    } catch {
      toast.error("Save Failed", "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DashboardLayout
      title="Barbershops Payment"
      subtitle="Manage all registered barbershops"
      showSidebar
      menuItems={ownerMenu}
      logo={ownerLogo}
      userProfile={currentUser ?? { name: "owner", email: "owner@cutbro.com", role: "owner" }}
      showNotification
      notificationCount={3}
      onLogout={logout}
    >
      <div className="w-full space-y-6 lg:space-y-8">

        <div className="bg-[#1A1A1A] rounded-2xl shadow-2xl shadow-black/40 border-2 border-[#2A2A2A] p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#D4AF37]/10 rounded-lg">
              <CreditCard className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Bank Account Information</h2>
              <p className="text-sm text-[#B8B8B8]">Enter your bank details for receiving payments</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput
              label="Bank Name"
              id="bankName"
              name="bankName"
              value={formData.bankName}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="e.g., Bank BCA, Bank Mandiri, Bank BNI"
              required
              error={touched.bankName ? errors.bankName : ""}
            />
            <FormInput
              label="Account Number"
              id="accountNumber"
              name="accountNumber"
              type="text"
              value={formData.accountNumber}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="e.g., 1234567890"
              required
              error={touched.accountNumber ? errors.accountNumber : ""}
            />
            <FormInput
              label="Account Holder Name"
              id="accountHolder"
              name="accountHolder"
              value={formData.accountHolder}
              onChange={handleInputChange}
              onBlur={handleBlur}
              placeholder="e.g., John Doe"
              required
              error={touched.accountHolder ? errors.accountHolder : ""}
            />

            <div className="pt-4 border-t border-[#2A2A2A]">
              <ImageUpload
                label="QRIS Code Image"
                required
                helperText="Upload your QRIS code for customers to scan and pay"
                value={qrisImage}
                onChange={handleQrisChange}
                preview={qrisPreview}
                onPreviewChange={setQrisPreview}
                error={touched.qrisImage ? errors.qrisImage : ""}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={isSaving || !hasAnyInput}
                className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#B8941F] disabled:bg-[#2A2A2A] disabled:text-[#555555] disabled:cursor-not-allowed text-black font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSaving ? "Saving..." : "Save Payment Settings"}
              </button>
            </div>
          </form>
        </div>

        <InfoCard>
          <ul className="space-y-1">
            <li>• Make sure your bank account details are correct to avoid payment issues</li>
            <li>• QRIS code should be clearly visible and scannable by customers</li>
            <li>• You can update these settings anytime from this page</li>
            <li>• All payment information is encrypted and stored securely</li>
          </ul>
        </InfoCard>
      </div>
    </DashboardLayout>
  );
}