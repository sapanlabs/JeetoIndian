import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sponsor Portal — JeetoIndian',
  description: 'B2B Brand campaign management and ROI analytics portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
