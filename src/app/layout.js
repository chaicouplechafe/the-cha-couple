import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata = {
  title: "Chai Bun Queue",
  description: "Realtime queue management for Irani chai & bun orders.",
  icons: {
    icon: "/thechaicouple.png",
    shortcut: "/thechaicouple.png",
    apple: "/thechaicouple.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} bg-background text-foreground antialiased`}>
        {children}
        <footer className="w-full py-4 text-center text-sm text-muted-foreground">
          Developed by{" "}
          <a
            href="https://devou.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            devou
          </a>
        </footer>
      </body>
    </html>
  );
}


