'use client';
export default function MapPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">Зарын газрын зураг</h1>
      <p className="text-[var(--esl-text-secondary)] mb-4">Таны байршуулсан зарууд газрын зураг дээр</p>
      <div className="bg-[var(--esl-bg-muted)] rounded-2xl h-96 flex items-center justify-center text-[var(--esl-text-muted)]">
        🗺️ Газрын зураг удахгүй нэмэгдэнэ
      </div>
    </div>
  );
}
