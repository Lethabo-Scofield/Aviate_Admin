import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-6xl font-bold text-gray-200 mb-2">404</p>
      <p className="text-lg font-semibold text-gray-600 mb-1">Page not found</p>
      <p className="text-sm text-gray-400 mb-6">The page you are looking for does not exist.</p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-[#008080] text-white rounded-lg text-sm font-medium hover:bg-[#006e6e] transition-colors"
      >
        <Home size={16} />
        Back to Dashboard
      </Link>
    </div>
  );
}
