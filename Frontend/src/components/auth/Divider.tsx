export default function Divider({ text = "OR" }: { text?: string }) {
  return (
    <div className="relative">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-neutral-700"></div>
      </div>
      <div className="relative flex justify-center text-xs">
        <span className="px-2 bg-neutral-900 text-neutral-500">{text}</span>
      </div>
    </div>
  );
}