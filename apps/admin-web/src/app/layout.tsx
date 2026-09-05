import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Portal — JeetoIndian',
  description: 'Internal operations, competition management, and fraud audit portal',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
