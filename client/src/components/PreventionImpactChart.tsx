import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Heart, TrendingDown, ArrowDownRightFromCircle } from "lucide-react";

// Simulated data for prevention impact
const preventionData = [
  { year: '2020', withoutSystem: 100, withSystem: 100, baseline: 100 },
  { year: '2021', withoutSystem: 105, withSystem: 92, baseline: 100 },
  { year: '2022', withoutSystem: 110, withSystem: 85, baseline: 100 },
  { year: '2023', withoutSystem: 118, withSystem: 75, baseline: 100 },
  { year: '2024', withoutSystem: 125, withSystem: 66, baseline: 100 },
  { year: '2025', withoutSystem: 132, withSystem: 60, baseline: 100 },
  { year: '2026', withoutSystem: 140, withSystem: 56, baseline: 100 },
];

// Risk reduction data by risk factor
const riskReductionData = [
  { name: 'Blood Pressure', reduction: 35 },
  { name: 'Cholesterol', reduction: 28 },
  { name: 'Smoking', reduction: 42 },
  { name: 'Physical Activity', reduction: 25 },
  { name: 'Diet', reduction: 30 },
  { name: 'Diabetes Management', reduction: 22 },
];

// Outcomes breakdown data 
const outcomesData = [
  { name: 'Early Detection', value: 40, color: '#3b82f6' },
  { name: 'Lifestyle Changes', value: 32, color: '#10b981' },
  { name: 'Medication Adherence', value: 18, color: '#f59e0b' },
  { name: 'Regular Monitoring', value: 10, color: '#8b5cf6' },
];

export default function PreventionImpactChart() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <TrendingDown className="h-6 w-6 text-green-600" />
          <h2 className="text-2xl font-bold">Heart Disease Prevention Impact</h2>
        </div>
        <p className="text-muted-foreground">
          Visualizing the impact of early detection and prevention on heart disease outcomes
        </p>
      </div>

      <Tabs defaultValue="trend" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="trend">Prevention Trend</TabsTrigger>
          <TabsTrigger value="factors">Risk Factor Impact</TabsTrigger>
          <TabsTrigger value="outcomes">Prevention Outcomes</TabsTrigger>
        </TabsList>
        
        {/* Trend Analysis Tab */}
        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle>Heart Disease Rate Reduction Over Time</CardTitle>
              <CardDescription>
                Comparing heart disease rates with and without early detection system (2020-2026)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={preventionData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                  >
                    <defs>
                      <linearGradient id="colorWithout" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="colorWith" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.2}/>
                      </linearGradient>
                      <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#9ca3af" stopOpacity={0.6}/>
                        <stop offset="95%" stopColor="#9ca3af" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" />
                    <YAxis 
                      label={{ value: 'Relative Heart Disease Rate (%)', angle: -90, position: 'insideLeft' }} 
                      domain={[40, 160]}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, '']}
                      labelFormatter={(label) => `Year: ${label}`}
                    />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="withoutSystem" 
                      stroke="#ef4444" 
                      fillOpacity={1} 
                      fill="url(#colorWithout)" 
                      name="Without Prevention System"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="withSystem" 
                      stroke="#10b981" 
                      fillOpacity={1} 
                      fill="url(#colorWith)" 
                      name="With Prevention System"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="baseline" 
                      stroke="#9ca3af" 
                      strokeDasharray="5 5"
                      fillOpacity={1} 
                      fill="url(#colorBaseline)" 
                      name="Baseline (2020)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-100">
                <h3 className="font-medium text-green-800 flex items-center">
                  <ArrowDownRightFromCircle className="h-5 w-5 mr-2 text-green-600" />
                  Key Findings
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-green-700">
                  <li>• By 2026, early detection and prevention could reduce heart disease rates by up to 60% compared to growing rates without intervention</li>
                  <li>• The most significant reduction occurs within the first 3 years of implementation</li>
                  <li>• Without intervention, heart disease rates are projected to increase by 40% from baseline by 2026</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Risk Factor Impact Tab */}
        <TabsContent value="factors">
          <Card>
            <CardHeader>
              <CardTitle>Risk Factor Reduction Impact</CardTitle>
              <CardDescription>
                Percentage reduction in heart disease risk by addressing key factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={riskReductionData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis 
                      type="number" 
                      domain={[0, 50]}
                      label={{ value: 'Risk Reduction (%)', position: 'insideBottom', offset: -10 }}
                    />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip formatter={(value) => [`${value}%`, 'Risk Reduction']} />
                    <Legend />
                    <Bar 
                      dataKey="reduction" 
                      name="Risk Reduction (%)" 
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-medium text-blue-800 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-blue-600" />
                  Prevention Strategy Impact
                </h3>
                <p className="mt-2 text-sm text-blue-700">
                  Early identification and management of these risk factors through our system's integrated approach 
                  provides significant reductions in heart disease risk. Smoking cessation and blood pressure 
                  management show the highest impact potential, while combined interventions targeting multiple 
                  factors simultaneously can reduce overall risk by up to 70%.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Prevention Outcomes Tab */}
        <TabsContent value="outcomes">
          <Card>
            <CardHeader>
              <CardTitle>Prevention Outcome Contributors</CardTitle>
              <CardDescription>
                Breakdown of factors contributing to heart disease prevention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={outcomesData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    >
                      {outcomesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Contribution']}
                    />
                    <Legend 
                      layout="horizontal" 
                      verticalAlign="bottom" 
                      align="center"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="font-medium text-blue-800">Early Detection (40%)</h3>
                  <p className="mt-1 text-sm text-blue-700">
                    Identifying high-risk patients before symptoms develop using 
                    predictive analytics and regular screening.
                  </p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                  <h3 className="font-medium text-emerald-800">Lifestyle Changes (32%)</h3>
                  <p className="mt-1 text-sm text-emerald-700">
                    Diet improvements, increased physical activity, and smoking cessation
                    guided by personalized recommendations.
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <h3 className="font-medium text-amber-800">Medication Adherence (18%)</h3>
                  <p className="mt-1 text-sm text-amber-700">
                    Improved compliance with prescribed treatments through 
                    reminders and educational resources.
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
                  <h3 className="font-medium text-purple-800">Regular Monitoring (10%)</h3>
                  <p className="mt-1 text-sm text-purple-700">
                    Continuous tracking of health metrics enabling timely 
                    interventions when warning signs appear.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}