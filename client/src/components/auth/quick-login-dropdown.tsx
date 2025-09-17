import { X } from "lucide-react";

interface SavedLogin {
  username: string;
  token: string;
}

interface QuickLoginDropdownProps {
  savedLogins: SavedLogin[];
  onQuickLogin: (username: string) => void;
  onRemoveLogin: (username: string) => void;
  className?: string;
}

export function QuickLoginDropdown({ 
  savedLogins, 
  onQuickLogin, 
  onRemoveLogin,
  className = "absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-48 overflow-y-auto"
}: QuickLoginDropdownProps) {
  return (
    <div className={className}>
      {savedLogins.map((login) => (
        <div key={login.username} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onQuickLogin(login.username);
            }}
            className="flex-1 text-left text-sm font-medium text-gray-700 hover:text-blue-600 py-2 px-0 bg-transparent border-none cursor-pointer"
          >
            Login as @{login.username}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemoveLogin(login.username);
            }}
            className="text-red-500 hover:text-red-700 p-1 h-6 w-6 ml-2 bg-transparent border-none cursor-pointer rounded flex items-center justify-center"
            title="Remove"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}