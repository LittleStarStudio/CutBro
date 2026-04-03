import { User, Camera, Crown, Shield, Scissors, Users } from "lucide-react";

type UserRole = "SuperAdmin" | "Owner" | "Barber" | "Customer";

interface AvatarSectionProps {
  avatar?: string;
  role: UserRole;
  isEditing: boolean;
  onAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function AvatarSection({
  avatar,
  role,
  isEditing,
  onAvatarChange,
}: AvatarSectionProps) {
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case "SuperAdmin":
        return <Crown className="w-4 h-4 text-amber-400" />;
      case "Owner":
        return <Shield className="w-4 h-4 text-blue-400" />;
      case "Barber":
        return <Scissors className="w-4 h-4 text-green-400" />;
      default:
        return <Users className="w-4 h-4 text-zinc-400" />;
    }
  };

  return (
    <div className="flex items-end gap-4">
      {/* Avatar */}
      <div className="relative group">
        {avatar ? (
          <img
            src={avatar}
            alt="Profile"
            className="w-24 h-24 rounded-2xl border-4 border-zinc-900 object-cover shadow-xl"
          />
        ) : (
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center border-4 border-zinc-900 shadow-xl">
            <User className="w-12 h-12 text-black" />
          </div>
        )}

        {isEditing && (
          <label className="absolute inset-0 rounded-2xl bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
            <Camera className="w-5 h-5 text-white" />
            <input
              type="file"
              accept="image/*"
              onChange={onAvatarChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* ROLE BADGE */}
      <div className="px-4 py-1.5 rounded-full bg-zinc-800 border border-zinc-700 text-amber-400 flex items-center gap-2 font-semibold text-sm">
        {getRoleIcon(role)}
        {role}
      </div>
    </div>
  );
}