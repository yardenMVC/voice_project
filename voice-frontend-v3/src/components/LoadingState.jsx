export default function LoadingState({ message = "Loading…" }) {
    return (
        <div className="loadingText">
            {message}
        </div>
    );
}
