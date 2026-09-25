export const DashboardSkeleton = () => {
  return (
    <div className="space-y-8 p-6 lg:p-10 max-w-[1400px] mx-auto animate-pulse">
      {/* Skeleton del Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-700/60">
        <div className="space-y-2">
          <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700/80 rounded" />
          <div className="h-8 w-64 bg-slate-200 dark:bg-slate-700/60 rounded-lg" />
          <div className="h-3 w-80 bg-slate-100 dark:bg-slate-700/40 rounded" />
        </div>
        <div className="h-10 w-44 bg-slate-200 dark:bg-slate-700/80 rounded-xl" />
      </div>

      {/* Skeletons de las 4 Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-5 space-y-3"
          >
            <div className="flex justify-between items-center">
              <div className="h-3 w-28 bg-slate-200 dark:bg-slate-700/70 rounded" />
              <div className="h-9 w-9 bg-slate-100 dark:bg-slate-700/80 rounded-xl" />
            </div>
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-700/90 rounded" />
            <div className="h-2 w-full bg-slate-100 dark:bg-slate-900 rounded-full" />
            <div className="h-3 w-36 bg-slate-100 dark:bg-slate-700/50 rounded" />
          </div>
        ))}
      </div>

      {/* Skeletons de las 2 Columnas Inferiores */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-6 space-y-4">
          <div className="h-5 w-48 bg-slate-200 dark:bg-slate-700/70 rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-14 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/60 rounded-xl"
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 p-6 space-y-4">
          <div className="h-5 w-44 bg-slate-200 dark:bg-slate-700/70 rounded" />
          <div className="space-y-3 pt-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-16 bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-700/60 rounded-xl"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
