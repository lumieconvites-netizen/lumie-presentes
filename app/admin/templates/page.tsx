import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminTemplatesPage() {
  return (
    <Card className="border-[#e7d8cb] bg-white">
      <CardHeader>
        <CardTitle>Templates</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-600">
        Pagina criada. Vamos evoluir a gestao de templates aqui.
      </CardContent>
    </Card>
  );
}
