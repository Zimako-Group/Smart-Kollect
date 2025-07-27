import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SmartKollect Documentation - Comprehensive Guide',
  description: 'Complete documentation for SmartKollect debt collection management system. Learn about features, API reference, integrations, and deployment.',
  keywords: 'SmartKollect, debt collection, documentation, API, integration, deployment, features',
  authors: [{ name: 'SmartKollect Team' }],
  openGraph: {
    title: 'SmartKollect Documentation',
    description: 'Comprehensive documentation for the intelligent debt collection management platform.',
    url: 'https://smartkollect.co.za/documentation',
    siteName: 'SmartKollect',
    images: [
      {
        url: '/og-documentation.png',
        width: 1200,
        height: 630,
        alt: 'SmartKollect Documentation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SmartKollect Documentation',
    description: 'Comprehensive documentation for the intelligent debt collection management platform.',
    images: ['/og-documentation.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="documentation-layout">
      {children}
    </div>
  );
}
