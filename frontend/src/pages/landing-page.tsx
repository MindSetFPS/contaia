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
  Sparkles,
  FileSpreadsheet,
  TrendingUp,
  MessageCircle,
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
    icon: FileSpreadsheet,
  },
  {
    step: "2",
    title: "Selecciona cliente y periodo",
    desc: "Organiza la información por cliente y mes para mantener todo en orden.",
    icon: TrendingUp,
  },
  {
    step: "3",
    title: "Pregunta y descubre",
    desc: "Chat, KPIs e insights automáticos para tomar mejores decisiones.",
    icon: MessageCircle,
  },
];

export default function LandingPage() {
  const { token, loading } = useAuth();

  if (loading) return null;
  if (token) return <Navigate to="/app" replace />;

  return (
    <div className="flex min-h-screen flex-col bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-100">
      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-md dark:border-gray-800 dark:bg-gray-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 sm:px-6 py-3">
          <span className="text-lg sm:text-xl font-bold text-blue-600 dark:text-blue-400">ContaIA</span>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="sm:h-9 sm:px-4">Iniciar Sesión</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="sm:h-9 sm:px-4">Registrarse</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 px-4 sm:px-6 pb-24 sm:pb-32 pt-16 sm:pt-24 text-center text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_60%)]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djItSDI0di0yaDEyek0zNiAyNHYySDI0di0yaDEyeiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
          <div className="relative mx-auto max-w-4xl">
            <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs sm:text-sm font-medium backdrop-blur">
              <Sparkles className="size-3.5" />
              Contabilidad impulsada por IA
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
              Tu contabilidad en<br />
              <span className="text-blue-200">lenguaje natural</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base sm:text-lg text-blue-100/90 leading-relaxed">
              Sube tus estados financieros y haz preguntas como si hablaras con
              tu contador. Obtén KPIs, insights y dashboard al instante.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link to="/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto gap-2 bg-white text-blue-700 hover:bg-blue-50 shadow-lg shadow-blue-900/25"
                >
                  Comenzar Gratis
                </Button>
              </Link>
              <Link to="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 hover:text-white"
                >
                  Iniciar Sesión
                </Button>
              </Link>
            </div>
            <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-blue-200/80">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-300 shrink-0" /> Sin instalación
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-300 shrink-0" /> No requiere SQL
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-300 shrink-0" /> Datos seguros
              </span>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-gray-50 px-4 sm:px-6 py-20 sm:py-28 dark:bg-gray-900">
          <div className="mx-auto max-w-6xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <Sparkles className="size-3" />
                Características
              </span>
            </div>
            <h2 className="mt-6 text-center text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-gray-500 dark:text-gray-400">
              Desde la carga de datos hasta el análisis, ContaIA simplifica cada paso.
            </p>
            <div className="mt-14 sm:mt-16 grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-xl border border-gray-200 bg-white p-6 transition-all hover:border-blue-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-blue-600"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-blue-100 text-blue-600 group-hover:bg-blue-200 dark:bg-blue-900/40 dark:text-blue-400 dark:group-hover:bg-blue-900/60 transition-colors">
                    <f.icon className="h-5 w-5" />
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
        <section className="bg-white px-4 sm:px-6 py-20 sm:py-28 dark:bg-gray-950">
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
                <TrendingUp className="size-3" />
                Proceso
              </span>
            </div>
            <h2 className="mt-6 text-center text-3xl sm:text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              Cómo funciona
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-gray-500 dark:text-gray-400">
              Tres pasos para transformar tus números en decisiones.
            </p>
            <div className="relative mt-16 grid gap-12 sm:grid-cols-3">
              {steps.map((s, i) => (
                <div key={s.step} className="relative flex flex-col items-center text-center">
                  {i < steps.length - 1 && (
                    <div className="hidden sm:block absolute top-8 left-[60%] w-[80%] h-px border-t-2 border-dashed border-gray-300 dark:border-gray-600" />
                  )}
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/20 dark:bg-blue-500">
                    <s.icon className="h-7 w-7 text-white" />
                    <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gray-900 text-xs font-bold text-white dark:bg-gray-100 dark:text-gray-900">
                      {s.step}
                    </span>
                  </div>
                  <h3 className="mt-6 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {s.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-gray-50 px-4 sm:px-6 py-20 sm:py-24 dark:bg-gray-900">
          <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-12 sm:gap-20 text-center">
            <div>
              <div className="text-5xl sm:text-6xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">100+</div>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Contadores activos
              </div>
            </div>
            <div>
              <div className="text-5xl sm:text-6xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">10K+</div>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Facturas procesadas
              </div>
            </div>
            <div>
              <div className="text-5xl sm:text-6xl font-bold text-blue-600 dark:text-blue-400 tracking-tight">5 min</div>
              <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                En poner tu cuenta al día
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 px-4 sm:px-6 py-20 sm:py-28 text-center text-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(255,255,255,0.1),transparent_60%)]" />
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Empieza hoy gratis
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-blue-100/90">
              No necesitas tarjeta de crédito. Sube tus datos y descubre lo que la
              IA puede hacer por tu contabilidad.
            </p>
            <div className="mt-10">
              <Link to="/register">
                <Button
                  size="lg"
                  className="gap-2 bg-white text-blue-700 hover:bg-blue-50 shadow-lg shadow-blue-900/25 px-8 py-6 text-base"
                >
                  Crear cuenta gratis <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white px-6 py-10 dark:border-gray-800 dark:bg-gray-950">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400 sm:flex-row">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            ContaIA
          </span>
          <p>&copy; {new Date().getFullYear()} ContaIA. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
