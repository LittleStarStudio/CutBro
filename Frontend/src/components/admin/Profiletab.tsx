import type { UserProfileData } from "@/type/TypeUser";

/* ======================================================
   PROPS
====================================================== */

interface ProfileTabProps {
  editedProfile: UserProfileData;
  isEditing: boolean;
  onFieldChange: (field: keyof UserProfileData, value: string) => void;
}

/* ======================================================
   COMPONENT
====================================================== */

export default function ProfileTab({
  editedProfile,
  isEditing,
  onFieldChange,
}: ProfileTabProps) {
  return (
    <div className="space-y-4">
      {/* Name */}
      <FormField
        label="Name"
        value={editedProfile.name || ""}
        isEditing={isEditing}
        onChange={(value) => onFieldChange("name", value)}
      />

      {/* Email */}
      <FormField
        label="Email"
        value={editedProfile.email || ""}
        isEditing={isEditing}
        onChange={(value) => onFieldChange("email", value)}
        type="email"
      />

      {/* Phone */}
      <FormField
        label="Phone"
        value={editedProfile.phone || ""}
        isEditing={isEditing}
        onChange={(value) => onFieldChange("phone", value)}
        type="tel"
      />

      {/* Location */}
      <FormField
        label="Location"
        value={editedProfile.location || ""}
        isEditing={isEditing}
        onChange={(value) => onFieldChange("location", value)}
      />

      {/* Address */}
      <FormField
        label="Address"
        value={editedProfile.address || ""}
        isEditing={isEditing}
        onChange={(value) => onFieldChange("address", value)}
        multiline
      />

      {/* Bio */}
      <FormField
        label="Bio"
        value={editedProfile.bio || ""}
        isEditing={isEditing}
        onChange={(value) => onFieldChange("bio", value)}
        multiline
      />

      {/* Join Date (Read-only) */}
      {editedProfile.joinDate && (
        <FormField
          label="Member Since"
          value={editedProfile.joinDate}
          isEditing={false}
          onChange={() => {}}
          readOnly
        />
      )}
    </div>
  );
}

/* ======================================================
   FORM FIELD COMPONENT
====================================================== */

interface FormFieldProps {
  label: string;
  value: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  type?: string;
  multiline?: boolean;
  readOnly?: boolean;
}

function FormField({
  label,
  value,
  isEditing,
  onChange,
  type = "text",
  multiline = false,
  readOnly = false,
}: FormFieldProps) {
  const baseClasses =
    "w-full px-4 py-3 rounded-xl border transition focus:outline-none focus:ring-2";
  const editableClasses =
    "bg-zinc-800 border-zinc-700 text-white focus:ring-amber-500/50 focus:border-amber-500";
  const readOnlyClasses = "bg-zinc-900 border-zinc-800 text-zinc-400";

  return (
    <div>
      <label className="block text-sm font-semibold text-zinc-400 mb-2">
        {label}
      </label>

      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!isEditing || readOnly}
          className={`${baseClasses} ${
            isEditing && !readOnly ? editableClasses : readOnlyClasses
          } min-h-[100px] resize-none`}
          rows={4}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={!isEditing || readOnly}
          className={`${baseClasses} ${
            isEditing && !readOnly ? editableClasses : readOnlyClasses
          }`}
        />
      )}
    </div>
  );
}