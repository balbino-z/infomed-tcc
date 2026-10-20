import { Search } from 'lucide-react';

interface SearchBarProps {
  placeholder: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function SearchBar({ placeholder, value, onChange }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="w-full h-12 pl-12 pr-4 rounded-2xl bg-[#F7FAFF] border border-[#E8F1FF] text-[#1A2B48] placeholder:text-[#64748B] focus:outline-none focus:border-[#0A73FF] transition-colors"
      />
    </div>
  );
}