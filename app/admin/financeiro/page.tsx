import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminFinanceiroPage() {
  return (
    <Card className="border-[#e7d8cb] bg-white">
      <CardHeader>
        <CardTitle>Financeiro</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600">
        Pagina criada. Vamos evoluir os controles financeiros aqui.
      </CardContent>
    </Card>
  );
}
