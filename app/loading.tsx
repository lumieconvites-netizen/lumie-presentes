export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-terracota-50 via-white to-gold-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-32 h-32 mx-auto mb-6">
          <div className="absolute inset-0 rounded-full border-4 border-terracota-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-terracota-500 border-t-transparent animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center text-4xl">
            🎁
          </div>
        </div>
        <p className="font-display text-xl text-terracota-700 animate-pulse">
          Carregando...
        </p>
      </div>
    </div>
  );
}
