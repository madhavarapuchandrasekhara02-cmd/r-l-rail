import AdminLayout from "@/admin/AdminLayout";
import { TRPCProvider } from "@/providers/trpc";
import { Toaster } from 'sonner';
import "../index.css";

export const metadata = {
  title: {
    template: 'Roots & Leaves | Admin - %s',
    default: 'Roots & Leaves | Admin',
  },
  description: "Roots & Leaves Admin Dashboard",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="bg-[#FAF9F6]">
        <TRPCProvider>
          <AdminLayout>{children}</AdminLayout>
        </TRPCProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
