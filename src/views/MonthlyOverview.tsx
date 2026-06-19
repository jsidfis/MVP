type MonthlyOverviewProps = {
  year: number;
  month: number;
  recordedDates: string[];
  onSelectDate?: (date: string) => void;
};

export function MonthlyOverview({ year, month, recordedDates, onSelectDate }: MonthlyOverviewProps) {
  const days = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const dates = Array.from({ length: days }, (_, index) => {
    const day = String(index + 1).padStart(2, '0');
    const paddedMonth = String(month).padStart(2, '0');

    return `${year}-${paddedMonth}-${day}`;
  });

  return (
    <section className="monthly-overview">
      <h2>月度总览</h2>
      <div className="monthly-grid">
        {dates.map((date) => {
          const recorded = recordedDates.includes(date);

          return (
            <button
              key={date}
              type="button"
              className={recorded ? 'monthly-day monthly-day-recorded' : 'monthly-day'}
              aria-label={`${date} ${recorded ? '有记录' : '无记录'}`}
              onClick={() => onSelectDate?.(date)}
            >
              {Number(date.slice(-2))}
            </button>
          );
        })}
      </div>
    </section>
  );
}
