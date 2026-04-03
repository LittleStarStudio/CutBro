interface Props {
  name: string;
  email: string;
  photoPreview?: string;
  onEdit: () => void;
}

export default function ProfileCard({
  name,
  email,
  photoPreview,
  onEdit,
}: Props) {
  return (
    <div className="bg-[#141414] border border-[#2A2A2A] rounded-2xl p-8 text-center text-white shadow-xl">
      <img
        src={photoPreview || "https://i.pravatar.cc/300"}
        className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-[#2A2A2A]"
      />

      <h2 className="text-xl font-bold">{name}</h2>
      <p className="text-gray-400 text-sm mb-5">{email}</p>

      <button
        onClick={onEdit}
        className="px-5 py-2 bg-[#D4AF37] text-black rounded-lg font-semibold hover:opacity-80"
      >
        Edit Profile
      </button>
    </div>
  );
}
