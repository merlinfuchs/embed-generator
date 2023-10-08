export default function PremiumSuggest() {
  return (
    <div className="text-gray-300">
      <div className="mb-5">This feature requires Embed Generator Premium!</div>
      <a
        href="/premium"
        target="_blank"
        className="px-3 py-2 bg-blurple hover:bg-blurple-dark rounded text-white"
      >
        Get Premium
      </a>
    </div>
  );
}
