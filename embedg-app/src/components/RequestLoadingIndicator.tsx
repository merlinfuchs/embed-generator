import { useIsFetching } from "react-query";

export default function RequestLoadingIndicator() {
  const isFetching = useIsFetching();

  if (isFetching === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-8 right-8 bg-blurple animate-ping rounded-full h-4 w-4 z-50"></div>
  );
}
