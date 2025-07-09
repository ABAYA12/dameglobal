import RoleBasedLayout from "~/components/dashboard/role-based-layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RoleBasedLayout>{children}</RoleBasedLayout>;
}
