'use client';

import { useUser } from '@/contexts/user-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, Eye, EyeOff } from 'lucide-react';

export default function RecadosPage() {
  const { messages, toggleMessageVisibility, toggleMessageFavorite } = useUser();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-display text-foreground mb-2">Recados</h1>
        <p className="text-gray-500">Mensagens carinhosas dos seus convidados</p>
      </div>

      <div className="space-y-4">
        {messages.map((message) => (
          <Card key={message.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-medium text-foreground">{message.guestName}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(message.date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={message.isFavorite ? 'default' : 'outline'}
                    onClick={() => toggleMessageFavorite(message.id)}
                  >
                    <Heart className={`w-4 h-4 ${message.isFavorite ? 'fill-current' : ''}`} />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleMessageVisibility(message.id)}
                  >
                    {message.isPublic ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              {message.giftTitle && (
                <Badge className="mb-2">{message.giftTitle}</Badge>
              )}
              <p className="text-gray-600">{message.message}</p>
              {message.amount && (
                <p className="text-sm text-green-600 font-medium mt-2">
                  {message.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
