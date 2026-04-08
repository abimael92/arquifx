import es from "@/locales/es.json";

interface MeasurementCardProps {
  areaM2: number;
  perimeterM: number;
  estimatedCostEur: number;
}

const formatNumber = (value: number) =>
  value.toLocaleString("es-ES", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export function MeasurementCard({ areaM2, perimeterM, estimatedCostEur }: MeasurementCardProps) {
  return (
    <article className="rounded-lg border border-panelBorde bg-slate-900/30 p-4 text-sm">
      <h3 className="mb-3 font-semibold text-slate-100">{es.measurement.title}</h3>
      <div className="space-y-2 text-slate-300">
        <p>
          {es.measurement.totalArea}: <span className="text-slate-100">{formatNumber(areaM2)} {es.units.squareMeters}</span>
        </p>
        <p>
          {es.measurement.perimeter}: <span className="text-slate-100">{formatNumber(perimeterM)} {es.units.meters}</span>
        </p>
        <p>
          {es.measurement.estimatedCost}: <span className="text-slate-100">{formatNumber(estimatedCostEur)} {es.units.euros}</span>
        </p>
      </div>
    </article>
  );
}
