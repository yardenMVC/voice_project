import { AlertTriangle } from "lucide-react";

export default function ErrorBanner({ message }) {
    if (!message) return null;
    return (
        <div className="errorBanner">
            <AlertTriangle size={16} className="icon" /> {message}
        </div>
    );
}
