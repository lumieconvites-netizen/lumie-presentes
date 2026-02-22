import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import AdminSidebar from "@/components/admin/sidebar";

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
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-sm text-[#8E3D2C] hover:underline">
                  Ir para dashboard cliente
                </Link>
                <Link href="/admin/configuracoes" className="text-sm text-[#8E3D2C] hover:underline">
                  Configuracoes da conta
                </Link>
              </div>
            </div>
          </header>

          <main className="px-6 py-6">{children}</main>
        </div>
      </div>
    </div>
  );
}
