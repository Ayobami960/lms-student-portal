import { memo } from "react";
import type { SummaryCardData } from "../../types";
 
interface SummaryCardsGridProps {
  cards: SummaryCardData[];
  isLoading: boolean;
}

function SummaryCardsGridImpl({ cards, isLoading }: SummaryCardsGridProps) {
  if (isLoading) {
    return (
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-md" aria-busy="true" aria-label="Loading summary statistics">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-surface-container-lowest border border-outline-variant rounded-xl animate-pulse" />
        ))}
      </section>
    );
  }

  return (
    <section className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-md" aria-label="Summary statistics">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="bg-surface-container-lowest border border-outline-variant shadow-sm p-md rounded-xl flex items-center gap-md hover:-translate-y-0.5 transition-transform duration-200"
          >
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${card.color}`}>
              <Icon className="w-6 h-6" strokeWidth={2} aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs font-semibold text-outline uppercase tracking-wider">{card.label}</p>
              <p className="text-xl font-semibold text-on-surface">{card.value}</p>
            </div>
          </div>
        );
      })}
    </section>
  );
}

export const SummaryCardsGrid = memo(SummaryCardsGridImpl);