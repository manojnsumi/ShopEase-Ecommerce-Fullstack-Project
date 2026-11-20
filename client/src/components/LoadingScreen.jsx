/**
 * Simple full-area loading spinner (used by pages while
 * they fetch data from the API).
 */
export default function LoadingScreen({ label = 'Loading...' }) {
  return (
    <div className="py-24 grid place-items-center">
      <div className="flex flex-col items-center gap-4">
        <i className="fa-solid fa-circle-notch fa-spin text-4xl text-brand-600" />
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}
