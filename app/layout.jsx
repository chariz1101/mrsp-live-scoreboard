import { Oswald } from "next/font/google";
import "./globals.css";

/* Oswald is self-hosted by next/font at build time. Butler (headings)
   is not on Google Fonts, so it is loaded from public/fonts in
   globals.css. */
const oswald = Oswald({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-oswald",
});

export const metadata = {
  title: "MRSP Western Visayas — Live Scoreboard",
  description: "Robotic Arm Tank Challenge and Pop the Balloon Challenge",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#09065d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={oswald.variable}>
      <body><div className="stage">{children}</div></body>
    </html>
  );
}
