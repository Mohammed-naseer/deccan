import AdminLayoutClient from "@/components/admin/AdminLayoutClient";

export const metadata = {
  title: "Admin Portal | Deccan Space Works",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({ children }) {
  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
