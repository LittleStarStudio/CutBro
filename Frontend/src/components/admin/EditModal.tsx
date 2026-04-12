import React, { useState, useEffect, useMemo } from 'react';
import Modal from './Modal';
import { Save, X, AlertCircle, Eye, EyeOff, User } from 'lucide-react';

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'date' 
  | 'checkbox'
  | 'file'
  | 'image';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  options?: { value: string; label: string }[];
  rows?: number;
  accept?: string;
  validation?: (value: any, allData?: Record<string, any>) => string | null;
  helperText?: string;
  showAsterisk?: boolean;
}

export interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => void | Promise<void>;
  title: string;
  subtitle?: string;
  fields: FormField[];
  initialData?: Record<string, any>;
  saveButtonText?: string;
  cancelButtonText?: string;
  isLoading?: boolean;
  serverErrors?: Record<string, string>;
  hideFooter?: boolean;
}

const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  subtitle,
  fields,
  initialData = {},
  saveButtonText = 'Save Changes',
  cancelButtonText = 'Cancel',
  isLoading = false,
  serverErrors = {},
  hideFooter = false,
}) => {

  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [errors, setErrors]     = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showPasswordFields, setShowPasswordFields] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
      setErrors({});
      setSubmitted(false);
      setShowPasswordFields({});
    }
  }, [isOpen]);

  useEffect(() => {
    setFormData(initialData);
    setErrors({});
    setSubmitted(false);
  }, [initialData]);

  const hasChanges = useMemo(() => {
    return fields.some((field) => {
      const current  = formData[field.name] ?? '';
      const original = initialData[field.name] ?? '';
      return String(current) !== String(original);
    });
  }, [formData, initialData, fields]);

  /* ── Validation — passes full formData to each validator ── */
  const validateAll = (data = formData) => {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      if (field.disabled) return;

      const value = data[field.name];

      if (field.required && (!value || value === '')) {
        newErrors[field.name] = `${field.label} is required`;
        return;
      }

      if (field.validation) {
        const error = field.validation(value, data); // ← pass full data
        if (error) newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  useEffect(() => {
    if (submitted) validateAll();
  }, [formData, submitted]);

  const handleChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setSubmitted(true);
    if (!hasChanges) return;
    if (!validateAll()) return;
    await onSave(formData);
  };

  const handleFileChange = (name: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleChange(name, reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const renderField = (field: FormField) => {
    const hasError = (submitted && !!errors[field.name]) || !!serverErrors[field.name];
    const baseClass = `w-full px-4 py-3 bg-zinc-800 border rounded-xl text-white placeholder-zinc-500 
      focus:outline-none focus:ring-2 transition-colors
      ${hasError ? 'border-red-500 focus:ring-red-500' : 'border-zinc-700 focus:ring-amber-500'}
      ${field.disabled ? 'opacity-50 cursor-not-allowed' : ''}
      ${field.readOnly ? 'cursor-default' : ''}`;

    switch (field.type) {
      case 'textarea':
        return (
          <textarea
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 4}
            disabled={field.disabled}
            readOnly={field.readOnly}
            className={`${baseClass} resize-none`}
          />
        );

      case 'select':
        return (
          <select
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            disabled={field.disabled}
            className={`${baseClass} ${field.readOnly ? 'pointer-events-none' : ''}`}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData[field.name] || false}
              onChange={(e) => handleChange(field.name, e.target.checked)}
              disabled={field.disabled}
              className="w-5 h-5 bg-zinc-800 border border-zinc-700 rounded text-amber-500 focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-white">{field.label}</span>
          </label>
        );

      case 'image':
      case 'file':
        return (
          <div className="flex flex-col items-center gap-3">
            {formData[field.name] ? (
              <img
                src={formData[field.name]}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-full border-2 border-zinc-700"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-[#D4AF37]/10 border-2 border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                <User size={48} />
              </div>
            )}
            {!field.disabled && (
              <label className="cursor-pointer inline-block px-4 py-2 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors text-sm">
                <input
                  type="file"
                  accept={field.accept || (field.type === 'image' ? 'image/*' : '*')}
                  onChange={(e) => handleFileChange(field.name, e)}
                  className="hidden"
                />
                Choose File
              </label>
            )}
          </div>
        );

      case 'password':
        return (
          <div className="relative">
            <input
              type={showPasswordFields[field.name] ? 'text' : 'password'}
              value={formData[field.name] || ''}
              onChange={(e) => handleChange(field.name, e.target.value)}
              placeholder={field.placeholder}
              disabled={field.disabled}
              autoComplete="new-password"
              className={`${baseClass} pr-12`}
            />
            {!field.disabled && (
              <button
                type="button"
                onClick={() =>
                  setShowPasswordFields((prev) => ({
                    ...prev,
                    [field.name]: !prev[field.name],
                  }))
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPasswordFields[field.name]
                  ? <EyeOff size={18} />
                  : <Eye size={18} />}
              </button>
            )}
          </div>
        );

      default:
        return (
          <input
            type={field.type}
            value={formData[field.name] || ''}
            onChange={(e) => handleChange(field.name, e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled}
            readOnly={field.readOnly}
            autoComplete={field.type === 'email' ? 'off' : undefined}
            className={baseClass}
          />
        );
    }
  };

  const isFormValid = Object.keys(errors).length === 0;

  const footer = (
    <div className="space-y-3">
      {submitted && !isFormValid && (
        <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/40 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">
            Please fill in all required fields correctly before saving.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 px-6 py-3 bg-zinc-800 text-white rounded-xl hover:bg-zinc-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <X size={18} />
          {cancelButtonText}
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || !hasChanges}
          className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
            !hasChanges
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-600 text-white'
          } disabled:opacity-50`}
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={18} />
              {saveButtonText}
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      footer={hideFooter ? undefined : footer}
      size="md"
    >
      <form onSubmit={handleSubmit} autoComplete="off" className="space-y-6">
        {fields.map((field) => {
          if (field.type === 'checkbox') {
            return (
              <div key={field.name} className="space-y-2">
                {renderField(field)}
                {field.helperText && (
                  <p className="text-xs text-zinc-500">{field.helperText}</p>
                )}
              </div>
            );
          }

          const isEffectivelyRequired = field.required || field.showAsterisk;

          return (
            <div key={field.name} className="space-y-2">
              <label className="block text-zinc-400 text-sm font-medium">
                {field.label}
                {isEffectivelyRequired && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
              {field.helperText && !(submitted && errors[field.name]) && (
                <p className="text-xs text-zinc-500">{field.helperText}</p>
              )}
              {((submitted && errors[field.name]) || serverErrors[field.name]) && (
                <p className="flex items-center gap-1.5 text-xs text-red-400">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  {errors[field.name] || serverErrors[field.name]}
                </p>
              )}
            </div>
          );
        })}
      </form>
    </Modal>
  );
};

export default EditModal;