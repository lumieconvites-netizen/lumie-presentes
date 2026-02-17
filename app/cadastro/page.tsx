import { redirect } from "next/navigation";

type CadastroPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function Cadastro({ searchParams }: CadastroPageProps) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams ?? {})) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item) params.append(key, item);
      }
      continue;
    }

    if (value) params.set(key, value);
  }

  const query = params.toString();
  redirect(query ? `/auth/cadastro?${query}` : "/auth/cadastro");
}
