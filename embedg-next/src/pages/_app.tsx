import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

import "@/components/message-creator/MessagePreview.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class">
      <Component {...pageProps} />
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}
