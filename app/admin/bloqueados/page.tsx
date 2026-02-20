import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminBloqueadosPage() {
  return (
    <Card className="border-[#e7d8cb] bg-white">
      <CardHeader>
        <CardTitle>Bloqueados</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600">
        Pagina criada. Vamos evoluir a lista de contas bloqueadas aqui.
      </CardContent>
    </Card>
  );
}
