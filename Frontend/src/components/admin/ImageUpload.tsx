import { useState } from "react";
import { Upload, Image as ImageIcon } from "lucide-react";

interface ImageUploadProps {
  label: string;
  required?: boolean;
  helperText?: string;
  maxSize?: number; // in MB
  accept?: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  preview?: string;
  onPreviewChange?: (preview: string) => void;
  error?: string;
}

export default function ImageUpload({
  label,
  required = false,
  helperText = "PNG, JPG or JPEG (MAX. 5MB)",
  maxSize = 5,
  accept = "image/png, image/jpeg, image/jpg",
  value,
  onChange,
  preview,
  onPreviewChange,
  error,
}: ImageUploadProps) {
  const [localPreview, setLocalPreview] = useState(preview || "");
  const currentPreview = preview !== undefined ? preview : localPreview;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > maxSize * 1024 * 1024) {
        alert(`File size must be less than ${maxSize}MB`);
        return;
      }

      onChange(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (onPreviewChange) {
          onPreviewChange(result);
        } else {
          setLocalPreview(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (onPreviewChange) {
      onPreviewChange("");
    } else {
      setLocalPreview("");
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-white mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {helperText && (
        <p className="text-xs text-[#B8B8B8] mb-4">{helperText}</p>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        {/* Upload Button */}
        <div className="flex-1">
          <label
            htmlFor="imageUpload"
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors bg-[#141414] ${
              error
                ? "border-red-500 hover:border-red-400"
                : "border-[#2A2A2A] hover:border-[#D4AF37]"
            }`}
          >
            <div className="flex flex-col items-center justify-center py-6">
              <Upload className={`w-10 h-10 mb-3 ${error ? "text-red-400" : "text-[#B8B8B8]"}`} />
              <p className="text-sm text-[#B8B8B8] mb-1">
                <span className="font-semibold text-[#D4AF37]">
                  Click to upload
                </span>{" "}
                or drag and drop
              </p>
              <p className="text-xs text-[#B8B8B8]">{helperText}</p>
            </div>
            <input
              id="imageUpload"
              type="file"
              accept={accept}
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          {error && (
            <p className="mt-1.5 text-xs text-red-500">{error}</p>
          )}
        </div>

        {/* Preview */}
        {currentPreview && (
          <div className="flex-1">
            <div className="relative w-full h-48 bg-[#141414] border-2 border-[#2A2A2A] rounded-lg overflow-hidden">
              <img
                src={currentPreview}
                alt="Preview"
                className="w-full h-full object-contain"
              />
              <div className="absolute top-2 right-2">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  <span className="text-xs font-semibold">Remove</span>
                </button>
              </div>
            </div>
            {value && (
              <p className="text-xs text-[#B8B8B8] mt-2">
                <ImageIcon className="w-3 h-3 inline mr-1" />
                {value.name}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}