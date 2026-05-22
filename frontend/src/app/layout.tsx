import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'MediFusion - AI Clinical Platform',
  description: 'Multimodal LLM System for Clinical Encounter to Multilingual Discharge Summary Generation',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="dark bg-[#0d1117] min-h-screen font-['Inter']">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1c2333',
              color: '#e6edf3',
              border: '1px solid #30363d',
              borderRadius: '12px',
            },
          }}
        />
      </body>
    </html>
  );
}