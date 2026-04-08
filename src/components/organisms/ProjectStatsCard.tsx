import es from "@/locales/es.json";

interface ProjectStatsCardProps {
  areaConstruida: number;
  perimetroTotal: number;
  cantidadMuros: number;
  cantidadPuertas: number;
  cantidadVentanas: number;
  costoEstimado: number;
}

const formatNumber = (value: number) =>
  value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function ProjectStatsCard({
  areaConstruida,
  perimetroTotal,
  cantidadMuros,
  cantidadPuertas,
  cantidadVentanas,
  costoEstimado,
}: ProjectStatsCardProps) {
  return (
    <article className="rounded-lg border border-panelBorde bg-slate-900/30 p-4 text-sm text-slate-300">
      <h3 className="mb-3 font-semibold text-slate-100">{es.statistics.title}</h3>
      <div className="space-y-1.5">
        <p>
          {es.statistics.builtArea}: <span className="text-slate-100">{formatNumber(areaConstruida)} {es.units.squareMeters}</span>
        </p>
        <p>
          {es.statistics.totalPerimeter}: <span className="text-slate-100">{formatNumber(perimetroTotal)} {es.units.meters}</span>
        </p>
        <p>
          {es.statistics.wallsCount}: <span className="text-slate-100">{cantidadMuros}</span>
        </p>
        <p>
          {es.statistics.doorsCount}: <span className="text-slate-100">{cantidadPuertas}</span>
        </p>
        <p>
          {es.statistics.windowsCount}: <span className="text-slate-100">{cantidadVentanas}</span>
        </p>
        <p>
          {es.statistics.estimatedCost}: <span className="text-slate-100">{es.units.euros}{formatNumber(costoEstimado)}</span>
        </p>
      </div>
    </article>
  );
}
