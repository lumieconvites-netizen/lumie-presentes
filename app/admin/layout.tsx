import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";

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
      <header className="border-b border-[#E9D8C8] bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display text-[#8E3D2C]">Painel Admin</h1>
            <p className="text-sm text-gray-500">Controle geral da plataforma LUMIE</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/dashboard" className="text-[#8E3D2C] hover:underline">
              Dashboard Cliente
            </Link>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-6">{children}</main>
    </div>
  );
}
