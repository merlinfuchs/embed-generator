import { useIsFetching } from "@tanstack/react-query";

export default function RequestLoadingIndicator() {
  const isFetching = useIsFetching();

  if (isFetching === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-8 lg:bottom-8 bg-azure-500 animate-ping rounded-full h-4 w-4 z-50"></div>
  );
}
