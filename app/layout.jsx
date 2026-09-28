import "./globals.css";

export const metadata = {
  title: "MRSP Western Visayas — Live Scoreboard",
  description: "Robotic Arm Tank Challenge and Pop the Balloon Challenge",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body><div className="stage">{children}</div></body>
    </html>
  );
}
