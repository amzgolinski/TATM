import React from 'react';
import { useTrading } from '../context/TradingContext';
import { SAMPLE_NEWS } from '../data/mockStocks';
import { Globe, BarChart3, Newspaper, Award } from 'lucide-react';

export const StockFundamentals: React.FC = () => {
  const { selectedStock } = useTrading();

  const upsidePercent = selectedStock.analystRating
    ? (
        ((selectedStock.analystRating.targetPrice - selectedStock.price) /
          selectedStock.price) *
        100
      ).toFixed(1)
    : '0';

  const relevantNews = SAMPLE_NEWS.filter(
    (n) =>
      n.symbols.includes(selectedStock.symbol) ||
      n.symbols.includes('SPY') ||
      n.symbols.includes('QQQ')
  ).slice(0, 3);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 1. Key Statistics */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Fundamental Valuation & Metrics
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3.5 text-xs font-mono tabular-nums">
            <div className="bg-[#131d31] p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] font-sans">Market Capitalization</span>
              <span className="text-white font-bold text-sm">
                ${(selectedStock.marketCap / 1e9).toFixed(2)}B
              </span>
            </div>

            <div className="bg-[#131d31] p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] font-sans">P/E Ratio (TTM)</span>
              <span className="text-white font-bold text-sm">
                {selectedStock.peRatio ? selectedStock.peRatio.toFixed(1) : 'N/A'}
              </span>
            </div>

            <div className="bg-[#131d31] p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] font-sans">Beta (Volatility)</span>
              <span className="text-white font-bold text-sm">
                {selectedStock.beta ? selectedStock.beta.toFixed(2) : '1.00'}
              </span>
            </div>

            <div className="bg-[#131d31] p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] font-sans">Dividend Yield</span>
              <span className="text-white font-bold text-sm">
                {selectedStock.dividendYield !== undefined
                  ? `${selectedStock.dividendYield.toFixed(2)}%`
                  : '0.00%'}
              </span>
            </div>

            <div className="bg-[#131d31] p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] font-sans">Volume (24h)</span>
              <span className="text-white font-bold text-sm">
                {(selectedStock.volume / 1e6).toFixed(2)}M
              </span>
            </div>

            <div className="bg-[#131d31] p-2.5 rounded-lg border border-slate-800/80">
              <span className="text-slate-400 block text-[11px] font-sans">52W Range</span>
              <span className="text-slate-300 font-bold text-xs">
                ${selectedStock.fiftyTwoWeekLow.toFixed(0)} - ${selectedStock.fiftyTwoWeekHigh.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed mt-3.5 pt-3 border-t border-slate-800/60">
          {selectedStock.description}
        </p>
      </div>

      {/* 2. Analyst Consensus & Price Targets */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Wall Street Analyst Ratings
              </h3>
            </div>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60">
              {selectedStock.analystRating.consensus}
            </span>
          </div>

          <div className="mt-4 text-center">
            <span className="text-xs text-slate-400 block mb-0.5">Average 12-Month Target</span>
            <div className="text-3xl font-extrabold text-white font-mono tabular-nums">
              ${selectedStock.analystRating.targetPrice.toFixed(2)}
            </div>
            <span
              className={`text-xs font-semibold font-mono tabular-nums inline-block mt-1 ${
                Number(upsidePercent) >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {Number(upsidePercent) >= 0 ? '+' : ''}
              {upsidePercent}% Implied Upside
            </span>
          </div>

          {/* Target Range Bar */}
          <div className="mt-5 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono tabular-nums">
              <span>Low: ${selectedStock.analystRating.targetLow.toFixed(0)}</span>
              <span>Median: ${selectedStock.analystRating.targetPrice.toFixed(0)}</span>
              <span>High: ${selectedStock.analystRating.targetHigh.toFixed(0)}</span>
            </div>
            <div className="relative w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="absolute top-0 bottom-0 bg-blue-500 rounded-full"
                style={{
                  left: '15%',
                  width: '70%',
                }}
              />
              <div
                className="absolute top-0 bottom-0 w-2 bg-emerald-400 rounded-full shadow"
                style={{
                  left: `${Math.min(
                    95,
                    Math.max(
                      5,
                      ((selectedStock.price - selectedStock.analystRating.targetLow) /
                        (selectedStock.analystRating.targetHigh -
                          selectedStock.analystRating.targetLow)) *
                        100
                    )
                  )}%`,
                }}
                title={`Current Price: $${selectedStock.price.toFixed(2)}`}
              />
            </div>
          </div>

          {/* Buy percentage */}
          <div className="mt-5 bg-[#131d31] p-3 rounded-lg border border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-300">Bullish Consensus Ratio</span>
            <span className="font-bold text-emerald-400 font-mono">
              {selectedStock.analystRating.buyPercentage}% Buy / Overweight
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 pt-3 border-t border-slate-800/60 mt-4">
          Synthesized from 32 institutional equity research desks.
        </div>
      </div>

      {/* 3. Real-time Market News & Catalyst Feed */}
      <div className="bg-[#0f172a] rounded-xl border border-slate-800 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Newspaper className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              Market Intelligence & News
            </h3>
          </div>

          <div className="space-y-3 mt-3">
            {relevantNews.map((news) => (
              <div
                key={news.id}
                className="p-2.5 bg-[#131d31] rounded-lg border border-slate-800/80 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-semibold text-slate-300">{news.source}</span>
                  <span className="font-mono">{news.timeAgo}</span>
                </div>
                <h4 className="text-xs font-semibold text-white leading-snug hover:text-blue-400 cursor-pointer transition-colors">
                  {news.title}
                </h4>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {news.summary}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 mt-3 flex items-center justify-between">
          <span>Real-time Financial Wire</span>
          <span className="text-blue-400 hover:underline cursor-pointer">All News Headlines →</span>
        </div>
      </div>
    </div>
  );
};
