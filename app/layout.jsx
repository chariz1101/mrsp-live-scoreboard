import { Urbanist } from "next/font/google";
import "./globals.css";

/* Urbanist is self-hosted by next/font at build time. Matterhorn is a
   licensed font, so it is loaded from public/fonts in globals.css. */
const urbanist = Urbanist({
  subsets: ["latin"],
  weight: ["500", "700", "800"],
  variable: "--font-urbanist",
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
    <html lang="en" className={urbanist.variable}>
      <body><div className="stage">{children}</div></body>
    </html>
  );
}
