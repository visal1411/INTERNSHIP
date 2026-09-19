const fs = require('fs');
let code = fs.readFileSync('src/pages/Home.tsx', 'utf8');

// 1. Replace allWeightData
const oldDataStart = "const allWeightData = {";
const oldDataEnd = "};";
const dataStartIndex = code.indexOf(oldDataStart);
const dataEndIndex = code.indexOf(oldDataEnd, dataStartIndex) + oldDataEnd.length;

if (dataStartIndex !== -1) {
  const newData = `const allWeightData = {
  '7days': [
    { day: 'Mon', weight: 1120, target: 1420 }, { day: 'Tue', weight: 1150, target: 1450 }, { day: 'Wed', weight: 1140, target: 1440 },
    { day: 'Thu', weight: 1190, target: 1490 }, { day: 'Fri', weight: 1220, target: 1520 }, { day: 'Sat', weight: 1260, target: 1560 }, { day: 'Sun', weight: 1280, target: 1580 }
  ],
  '30days': [
    { day: 'Week 1', weight: 1100, target: 1400 }, { day: 'Week 2', weight: 1150, target: 1450 }, { day: 'Week 3', weight: 1210, target: 1510 }, { day: 'Week 4', weight: 1280, target: 1580 }
  ],
  'year': [
    { day: 'Jan', weight: 900, target: 1200 }, { day: 'Feb', weight: 950, target: 1250 }, { day: 'Mar', weight: 1000, target: 1300 }, { day: 'Apr', weight: 1050, target: 1350 },
    { day: 'May', weight: 1100, target: 1400 }, { day: 'Jun', weight: 1150, target: 1450 }, { day: 'Jul', weight: 1200, target: 1500 }, { day: 'Aug', weight: 1280, target: 1580 }
  ]
};`;
  code = code.substring(0, dataStartIndex) + newData + code.substring(dataEndIndex);
}

// 2. Replace the chart section
const chartStartMarker = '{/* Chart Section */}';
const recentActivityMarker = '{/* Recent Activity */}';

const chartStartIndex = code.indexOf(chartStartMarker);
const recentActivityIndex = code.indexOf(recentActivityMarker);

if (chartStartIndex !== -1 && recentActivityIndex !== -1) {
  const newChartHtml = `{/* Chart Section */}
  <div className="lg:col-span-2 bg-[#18181b] p-6 rounded-2xl shadow-xl border border-gray-800 transition-colors">
    <div className="flex justify-between items-center mb-6">
      <div>
        <h3 className="text-lg font-bold text-white">Average Weight Trend</h3>
        <p className="text-sm text-gray-400">Trailing {timeFilter === '7days' ? '7 days' : timeFilter === '30days' ? '30 days' : 'year'} across all active scales</p>
      </div>
      
      <div className="relative" ref={timeFilterRef}>
        <button
          onClick={() => setIsTimeFilterOpen(!isTimeFilterOpen)}
          className="flex items-center justify-between w-full min-w-[160px] bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#00e396] font-sans cursor-pointer transition-colors hover:border-gray-600"
        >
          <span>{timeFilterOptions.find(opt => opt.value === timeFilter)?.label}</span>
          <ChevronDown size={16} className={\`text-gray-400 transition-transform \${isTimeFilterOpen ? 'rotate-180' : ''}\`} />
        </button>
        
        {isTimeFilterOpen && (
          <div className="absolute top-full right-0 mt-2 w-full min-w-[160px] bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden z-10 animate-in fade-in slide-in-from-top-2 duration-200">
            {timeFilterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => {
                  setTimeFilter(option.value);
                  setIsTimeFilterOpen(false);
                }}
                className={\`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-700 \${
                  timeFilter === option.value ? 'bg-gray-700/50 text-[#00e396] font-medium' : 'text-gray-300'
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
          <CartesianGrid strokeDasharray="0" vertical={false} stroke="#333" />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
          <Tooltip
            cursor={{ stroke: '#555', strokeWidth: 1, strokeDasharray: '4 4' }}
            animationDuration={300}
            contentStyle={{ borderRadius: '8px', border: '1px solid #333', backgroundColor: '#18181b', color: '#fff' }}
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
            activeDot={{ r: 6, fill: '#00e396', stroke: '#18181b', strokeWidth: 2 }}
          />
          <Area 
            type="monotone" 
            dataKey="weight" 
            stroke="#008ffb" 
            strokeWidth={3}
            fillOpacity={1}
            fill="url(#colorWeight)"
            isAnimationActive={true}
            activeDot={{ r: 6, fill: '#008ffb', stroke: '#18181b', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    
    {/* Quick Actions Panel */}
    <div className="mt-6 pt-6 border-t border-gray-800">
      <h4 className="text-sm font-semibold text-gray-300 mb-4">Quick Actions</h4>
      <div className="flex gap-3">
        <button 
          onClick={() => setIsWeighInModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-gray-200 rounded-lg hover:bg-gray-700 transition-colors font-medium text-sm border border-gray-700"
        >
          <Plus size={16} /> New Weigh-in
        </button>
        <button 
          onClick={() => handleExport('report')}
          className="flex items-center gap-2 px-4 py-2 bg-[#008ffb] text-white rounded-lg hover:bg-[#008ffb]/90 transition-colors font-medium text-sm border border-transparent shadow-sm"
        >
          Generate Report
        </button>
      </div>
    </div>
  </div>

  `;
  
  code = code.substring(0, chartStartIndex) + newChartHtml + code.substring(recentActivityIndex);
}

fs.writeFileSync('src/pages/Home.tsx', code);
console.log("Chart successfully patched.");
