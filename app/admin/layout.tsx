import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "@/components/admin/sidebar";
import AdminTopbarMenu from "@/components/admin/topbar-menu";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  if ((session.user as any).role !== "ADMIN") {
    redirect("/dashboard");
  }

  const adminName = session.user.name || "Admin";
  const adminEmail = session.user.email || "";
  const adminImage = (session.user as any).image as string | null | undefined;

  return (
    <div className="min-h-screen bg-[#FAF4EF]">
      <div className="flex min-h-screen">
        <AdminSidebar />

        <div className="flex-1 min-w-0">
          <header className="border-b border-[#E9D8C8] bg-[#fffdfb]">
            <div className="px-6 py-5 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-display text-[#8E3D2C]">Central Administrativa</h1>
                <p className="text-sm text-[#8E3D2C]/70">Operacao geral da plataforma LUMIE</p>
              </div>
              <AdminTopbarMenu name={adminName} email={adminEmail} image={adminImage} />
            </div>
          </header>

          <main className="px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
