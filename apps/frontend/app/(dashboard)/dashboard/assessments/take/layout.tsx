import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Behave Like Compiler - Assessment Platform',
  description:
    'Professional MCQ assessment platform for students and educators',
};

export default function Layout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main lang="en">{children}</main>;
}
