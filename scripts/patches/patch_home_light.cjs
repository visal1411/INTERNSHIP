const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// The chart section is currently dark themed. Let's find it.
const chartStartMarker = '{/* Chart Section */}';
const recentActivityMarker = '{/* Recent Activity */}';

const chartStartIndex = code.indexOf(chartStartMarker);
const recentActivityIndex = code.indexOf(recentActivityMarker);

if (chartStartIndex !== -1 && recentActivityIndex !== -1) {
  const newChartHtml = `{/* Chart Section */}
  <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 transition-colors">
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className="text-lg font-bold text-gray-900">Average Weight Trend</h3>
        <p className="text-sm text-gray-500">Trailing {timeFilter === '7days' ? '7 days' : timeFilter === '30days' ? '30 days' : 'year'} across all active scales</p>
      </div>
      
      <div className="relative" ref={timeFilterRef}>
        <button
          onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
          className="flex items-center justify-between w-full min-w-[160px] bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00e396] font-sans cursor-pointer transition-colors hover:border-gray-300"
        >
          <span>{timeFilterOptions.find(opt => opt.value === timeFilter)?.label}</span>
          <ChevronDown size={16} className={\`text-gray-400 transition-transform \${isTimeFilterOpen ? 'rotate-180' : ''}\`} />
        </button>
        
        {isTimeFilterOpen && (
          <div className="absolute top-full right-0 mt-2 w-full min-w-[160px] bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-10 animate-in fade-in slide-in-from-top-2 duration-200">
            {timeFilterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setTimeFilter(option.value);
                  setIsTimeFilterOpen(false);
                }}
                className={\`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 \${
                  timeFilter === option.value ? 'bg-green-50 text-[#00e396] font-medium' : 'text-gray-700'
                }\`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>

    <div className="h-[350px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={allWeightData[timeFilter]} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} accessibilityLayer={false} style={{ outline: 'none' }}>
          <defs>
            <linearGradient id="colorTarget" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00e396" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#00e396" stopOpacity={0.0} />
            </linearGradient>
            <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#008ffb" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#008ffb" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="0" vertical={false} stroke="#e5e7eb" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
          <Tooltip
            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
            animationDuration={300}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#111827', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
            itemStyle={{ fontWeight: 'bold' }}
          />
          <Area 
            type="monotone" 
            dataKey="target" 
            stroke="#00e396" 
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorTarget)"
            isAnimationActive={true}
            activeDot={{ r: 6, fill: '#00e396', stroke: '#ffffff', strokeWidth: 2 }}
          />
          <Area 
            type="monotone" 
            dataKey="weight" 
            stroke="#008ffb" 
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorWeight)"
            isAnimationActive={true}
            activeDot={{ r: 6, fill: '#008ffb', stroke: '#ffffff', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    
    {/* Quick Actions Panel */}
    <div className="mt-6 pt-6 border-t border-gray-100">
      <h4 className="text-sm font-semibold text-gray-900 mb-4">Quick Actions</h4>
      <div className="flex gap-3">
        <button 
          onClick={() => setIsWeighInModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#00e396]/10 text-[#00b377] rounded-lg hover:bg-[#00e396]/20 transition-colors font-medium text-sm border border-[#00e396]/20"
        >
          <Plus size={16} /> New Weigh-in
        </button>
        <button 
          onClick={() => handleExport('report')}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm border border-gray-200 shadow-sm"
        >
          Generate Report
        </button>
      </div>
    </div>
  </div>

  `;
  
  code = code.substring(0, chartStartIndex) + newChartHtml + code.substring(recentActivityIndex);
  fs.writeFileSync('src/pages/Home.tsx', code);
  console.log("Chart successfully patched to light theme.");
} else {
  console.log("Could not find markers.");
}
