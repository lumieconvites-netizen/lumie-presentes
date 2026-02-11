'use client';

import { useUser } from '@/contexts/user-context';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, LayoutDashboard, Globe } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function DashboardHeader() {
  const { user } = useUser();
  const router = useRouter();

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="bg-white border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
<h1 className="text-xl font-display text-foreground flex items-center gap-2">
  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-secondary/20">
    👋
  </span>
  <span>Bem-vindo, {user?.name}</span>
</h1>
          <p className="text-sm text-gray-500">
            Gerencie sua lista de presentes
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
  variant="ghost"
  className="h-10 w-10 rounded-full p-0 overflow-hidden ring-1 ring-border"
>
{user?.photo ? (
  <Image
    src={user.photo}
    alt={user.name}
    width={40}
    height={40}
    className="h-10 w-10 rounded-full object-cover"
  />
) : (
  <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center text-white font-medium">
    {user ? getUserInitials(user.name) : 'U'}
  </div>
)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name}</p>
                <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard" className="cursor-pointer">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Meu Painel
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/preview" className="cursor-pointer">
                <Globe className="w-4 h-4 mr-2" />
                Ver Site
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/configuracoes" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Configurações
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/')} className="text-red-600 focus:text-red-600 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
