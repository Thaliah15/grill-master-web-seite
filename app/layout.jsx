import "./globals.css";
import CookieBanner from "@/components/CookieBanner";
import { ToastProvider } from "@/components/ToastProvider";
import Link from "next/link";
import { Container } from "@/components/ui";
import LastOrderNavButton from "@/components/LastOrderNavButton";

export const metadata = {
  title: process.env.NEXT_PUBLIC_APP_NAME || "Restaurant",
  description: "Online-Bestellung",
};

export default function RootLayout({ children }) {
  const name = process.env.NEXT_PUBLIC_APP_NAME || "Restaurant";
  return (
    <html lang="de">
      <body>
        <header className="sticky top-0 z-10 border-b border-gray-200 bg-white/80 backdrop-blur">
          <Container>
            <div className="flex items-center justify-between py-4">
              <Link className="flex items-center gap-3" href="/">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt={`${name} Logo`} className="h-9 w-9 rounded-2xl object-contain bg-white" />
                <div className="leading-tight">
                  <div className="text-lg font-extrabold tracking-tight">{name}</div>
                  <div className="text-xs font-semibold text-gray-500">Online-Bestellung</div>
                </div>
              </Link>
              <nav className="flex items-center gap-2">
                <LastOrderNavButton/>
                <Link className="rounded-2xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100" href="/menu">Menü</Link>
                <Link className="rounded-2xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100" href="/cart">Warenkorb</Link>
                {/*<Link className="rounded-2xl px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100" href="/admin">Admin</Link>*/}
              </nav>
            </div>
          </Container>
        </header>
        

        <main>
          <Container>
            <div className="py-8"><ToastProvider>{children}</ToastProvider></div>
          </Container>
        </main>

        <footer className="mt-12 border-t border-gray-200">
          <Container>
            <div className="flex flex-col gap-2 py-8 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
              <div>© {new Date().getFullYear()} {name} — Online-Bestellung</div>
              <div className="flex gap-4">
                <Link className="underline" href="/impressum">Impressum</Link>
                <Link className="underline" href="/datenschutz">Datenschutz</Link>
              </div>
            </div>
          </Container>
        </footer>
        <CookieBanner />
</body>
    </html>
  );
}
