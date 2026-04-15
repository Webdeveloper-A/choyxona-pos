import HomeCtaButtons from "@/components/public/home-cta-buttons";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-50 via-purple-50 to-indigo-50">
      <header className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-800">Choyxona POS</h1>

          <HomeCtaButtons />
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-24 text-center">
        <h2 className="text-4xl font-bold text-gray-900 md:text-6xl">
          Restoran boshqaruvini tartibli qiladigan POS tizim
        </h2>
        <p className="mt-6 text-lg text-gray-600">
          Admin, ofitsiant, oshxona, kassa va hisobot modullari bitta tizimda.
        </p>
      </section>
    </main>
  );
}
