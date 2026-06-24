import { Link, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  MessageSquareText,
  Upload,
  Lightbulb,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Upload,
    title: "Carga de Excel",
    desc: "Sube tus estados financieros en segundos. La IA reconoce columnas y las normaliza automáticamente.",
  },
  {
    icon: MessageSquareText,
    title: "Chat en lenguaje natural",
    desc: "Pregunta cualquier cosa: ¿cuánto vendimos en enero?, ¿cuál fue el gasto más alto? — sin fórmulas ni SQL.",
  },
  {
    icon: BarChart3,
    title: "Dashboard de KPIs",
    desc: "Ingresos, costos, utilidad y flujo de caja con variación vs el periodo anterior.",
  },
  {
    icon: Lightbulb,
    title: "Insights automáticos",
    desc: "La IA detecta tendencias y anomalías. Un solo clic para analizar y guardar hallazgos.",
  },
];

const steps = [
  {
    step: "1",
    title: "Sube tu archivo",
    desc: "Excel con tus ventas, gastos o nómina. La IA lo interpreta al instante.",
  },
  {
    step: "2",
    title: "Selecciona cliente y periodo",
    desc: "Organiza la información por cliente y mes para mantener todo en orden.",
  },
  {
    step: "3",
    title: "Pregunta y descubre",
    desc: "Chat, KPIs e insights automáticos para tomar mejores decisiones.",
  },
];

export default function LandingPage() {
  const { token, loading } = useAuth();

  if (loading) return null;
  if (token) return <Navigate to="/dashboard" replace />;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <span className="text-xl font-bold text-primary">ContaIA</span>
          <nav className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Iniciar Sesión</Button>
            </Link>
            <Link to="/register">
              <Button>Registrarse</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-6 pb-32 pt-20 text-center text-white">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="relative mx-auto max-w-4xl">
            <span className="mb-4 inline-block rounded-full bg-white/20 px-4 py-1 text-sm font-medium backdrop-blur">
              Contabilidad impulsada por IA
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Tu contabilidad en lenguaje natural
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-blue-100">
              Sube tus estados financieros y haz preguntas como si hablaras con
              tu contador. Obtén KPIs, insights y dashboard al instante.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link to="/register">
                <Button
                  size="lg"
                  className="gap-2 bg-white text-blue-700 hover:bg-gray-100"
                >
                  Comenzar Gratis
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  className="border-white/40 text-white hover:bg-white/10 hover:text-white"
                >
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-blue-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-300" /> Sin
                instalación
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-300" /> No requiere
                SQL
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-300" /> Datos
                seguros
              </span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-white px-6 py-20 dark:bg-gray-950">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-gray-500 dark:text-gray-400">
              Desde la carga de datos hasta el análisis, ContaIA simplifica cada
              paso.
            </p>
            <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-gray-200 p-6 transition hover:border-primary/30 hover:shadow-lg dark:border-gray-800"
                >
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-primary dark:bg-blue-900/30">
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {f.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="bg-gray-50 px-6 py-20 dark:bg-gray-900">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Cómo funciona
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-gray-500 dark:text-gray-400">
              Tres pasos para transformar tus números en decisiones.
            </p>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              {steps.map((s) => (
                <div key={s.step} className="relative text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-xl font-bold text-white">
                    {s.step}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-white px-6 py-16 dark:bg-gray-950">
          <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-12 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">100+</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Contadores activos
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">10K+</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Facturas procesadas
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">5 min</div>
              <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                En poner tu cuenta al día
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-20 text-center text-white">
          <h2 className="text-3xl font-bold tracking-tight">
            Empieza hoy gratis
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-blue-100">
            No necesitas tarjeta de crédito. Sube tus datos y descubre lo que la
            IA puede hacer por tu contabilidad.
          </p>
          <div className="mt-8">
            <Link to="/register">
              <Button
                size="lg"
                className="gap-2 bg-white text-blue-700 hover:bg-gray-100"
              >
                Crear cuenta gratis <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-6 py-8 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400 sm:flex-row">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            ContaIA
          </span>
          <p>
            &copy; {new Date().getFullYear()} ContaIA. Todos los derechos
            reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
