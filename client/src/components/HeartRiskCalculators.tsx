import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Info, Heart, Activity, BarChart, TrendingDown } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import PreventionImpactChart from "./PreventionImpactChart";

export default function HeartRiskCalculators() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Heart className="h-6 w-6 text-red-600" />
          <h2 className="text-2xl font-bold">Heart Disease Risk Calculators</h2>
        </div>
        <p className="text-muted-foreground">
          Compare different approaches to cardiovascular risk assessment using the most trusted clinical tools.
        </p>

        <Alert variant="default" className="bg-blue-50 text-blue-800 border-blue-200">
          <Info className="h-4 w-4" />
          <AlertTitle>Clinical Decision Support</AlertTitle>
          <AlertDescription>
            These tools are for reference only. Always use your clinical judgment when making decisions about patient care.
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="prevent" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="prevent" className="text-xs sm:text-sm">AHA PREVENT™</TabsTrigger>
          <TabsTrigger value="harvard" className="text-xs sm:text-sm">Harvard Health</TabsTrigger>
          <TabsTrigger value="cleveland" className="text-xs sm:text-sm">Cleveland Clinic</TabsTrigger>
          <TabsTrigger value="ascvd" className="text-xs sm:text-sm">ASCVD Risk</TabsTrigger>
          <TabsTrigger value="comparison" className="text-xs sm:text-sm">Comparison</TabsTrigger>
          <TabsTrigger value="impact" className="text-xs sm:text-sm">Prevention Impact</TabsTrigger>
        </TabsList>
        
        {/* AHA PREVENT Calculator Tab */}
        <TabsContent value="prevent" className="p-4 border rounded-md mt-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-red-50 to-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-red-700">AHA PREVENT™ Calculator</CardTitle>
                  <CardDescription>Predicting Risk of cardiovascular disease EVENTs</CardDescription>
                </div>
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <Heart className="h-8 w-8 text-red-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Key Features</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Predicts 10-year and 30-year cardiovascular risk</li>
                  <li>Targeted for ages 30-79 years</li>
                  <li>Considers broader health metrics beyond traditional factors</li>
                  <li>Released in January 2024 by the American Heart Association</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Risk Factors Considered</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-red-500" />
                    <span>Age</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-red-500" />
                    <span>Sex</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-red-500" />
                    <span>Blood Pressure</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-red-500" />
                    <span>Cholesterol Levels</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-red-500" />
                    <span>Diabetes Status</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-red-500" />
                    <span>Smoking Status</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-red-500" />
                    <span>BP Medication</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-red-500" />
                    <span>Kidney Function</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-red-500" />
                    <span>Metabolic Health</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  className="w-full" 
                  variant="default"
                  onClick={() => window.open("https://professional.heart.org/en/guidelines-and-statements/prevent-calculator", "_blank")}
                >
                  Visit Official Calculator <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Harvard Health Risk Tool Tab */}
        <TabsContent value="harvard" className="p-4 border rounded-md mt-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-blue-700">Harvard Health Heart Disease Prediction Tool</CardTitle>
                  <CardDescription>Stages-based risk assessment approach</CardDescription>
                </div>
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <BarChart className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Key Features</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Categorizes risks into progressive stages</li>
                  <li>Identifies early indicators like type 2 diabetes</li>
                  <li>Tracks progression to advanced cardiovascular symptoms</li>
                  <li>Focuses on preventive interventions at each stage</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Risk Stages</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-green-50 rounded-md">
                    <h4 className="font-medium text-green-800">Stage 1: Early Indicators</h4>
                    <p className="text-sm text-green-700">Metabolic factors like type 2 diabetes, obesity</p>
                  </div>
                  <div className="p-3 bg-yellow-50 rounded-md">
                    <h4 className="font-medium text-yellow-800">Stage 2: Developing Risk</h4>
                    <p className="text-sm text-yellow-700">Elevated blood pressure, cholesterol abnormalities</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-md">
                    <h4 className="font-medium text-orange-800">Stage 3: Established Risk</h4>
                    <p className="text-sm text-orange-700">Arterial plaque, vascular changes</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-md">
                    <h4 className="font-medium text-red-800">Stage 4: Advanced Symptoms</h4>
                    <p className="text-sm text-red-700">Stroke, heart attack, heart failure</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  className="w-full" 
                  variant="default"
                  onClick={() => window.open("https://www.health.harvard.edu/heart-health", "_blank")}
                >
                  Visit Harvard Heart Health Resources <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Cleveland Clinic Calculator Tab */}
        <TabsContent value="cleveland" className="p-4 border rounded-md mt-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-purple-700">Cleveland Clinic Cardiac Risk Calculator</CardTitle>
                  <CardDescription>ASCVD Risk Estimator Plus</CardDescription>
                </div>
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Key Features</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Assesses 10-year and lifetime cardiovascular risk</li>
                  <li>Age range: 20-79 years</li>
                  <li>Provides personalized risk reduction strategies</li>
                  <li>Includes medication and lifestyle modification advice</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Unique Aspects</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-md">
                    <h4 className="font-medium">Risk Visualizations</h4>
                    <p className="text-sm text-gray-600">Interactive visual representations of risk factors and their impact</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <h4 className="font-medium">Therapy Impact</h4>
                    <p className="text-sm text-gray-600">Shows potential risk reduction with different interventions</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <h4 className="font-medium">Benefit-to-Risk Analysis</h4>
                    <p className="text-sm text-gray-600">Evaluates potential benefits vs. risks of treatments</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <h4 className="font-medium">Customized Reports</h4>
                    <p className="text-sm text-gray-600">Generates printable reports for patient education</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  className="w-full" 
                  variant="default"
                  onClick={() => window.open("https://www.mdcalc.com/calc/3939/ascvd-atherosclerotic-cardiovascular-disease-2013-risk-calculator-aha-acc", "_blank")}
                >
                  Access ASCVD Risk Estimator Plus <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* ASCVD Risk Estimator Tab */}
        <TabsContent value="ascvd" className="p-4 border rounded-md mt-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-emerald-50 to-emerald-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-emerald-700">ASCVD Risk Estimator</CardTitle>
                  <CardDescription>American College of Cardiology Risk Assessment Tool</CardDescription>
                </div>
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <Heart className="h-8 w-8 text-emerald-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Key Features</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Predicts 10-year risk of atherosclerotic cardiovascular disease</li>
                  <li>Based on the 2013 ACC/AHA Guidelines</li>
                  <li>Uses Pooled Cohort Equations for risk calculation</li>
                  <li>Provides statin therapy recommendations based on risk level</li>
                </ul>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold text-lg">Risk Factors Considered</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <span>Age</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <span>Sex</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <span>Race</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <span>Total Cholesterol</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <span>HDL Cholesterol</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <span>Systolic BP</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <span>BP Treatment</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <span>Diabetes</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Activity className="h-4 w-4 text-emerald-500" />
                    <span>Smoking Status</span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button 
                  className="w-full" 
                  variant="default"
                  onClick={() => window.open("https://tools.acc.org/ascvd-risk-estimator-plus/#!/calculate/estimate/", "_blank")}
                >
                  Use ACC Risk Estimator <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Comparison Tab */}
        <TabsContent value="comparison" className="p-4 border rounded-md mt-4">
          <Card>
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
              <CardTitle className="text-slate-700">Comparative Analysis</CardTitle>
              <CardDescription>Side-by-side comparison of major heart disease risk calculators</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left py-2 px-3 font-medium">Features</th>
                      <th className="text-center py-2 px-3 font-medium text-red-700">AHA PREVENT™</th>
                      <th className="text-center py-2 px-3 font-medium text-blue-700">Harvard Health</th>
                      <th className="text-center py-2 px-3 font-medium text-purple-700">Cleveland Clinic</th>
                      <th className="text-center py-2 px-3 font-medium text-emerald-700">ASCVD Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t">
                      <td className="py-2 px-3 font-medium">Age Range</td>
                      <td className="text-center py-2 px-3">30-79 years</td>
                      <td className="text-center py-2 px-3">All ages</td>
                      <td className="text-center py-2 px-3">20-79 years</td>
                      <td className="text-center py-2 px-3">40-79 years</td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-2 px-3 font-medium">Risk Period</td>
                      <td className="text-center py-2 px-3">10-year & 30-year</td>
                      <td className="text-center py-2 px-3">Staged progression</td>
                      <td className="text-center py-2 px-3">10-year & lifetime</td>
                      <td className="text-center py-2 px-3">10-year</td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-2 px-3 font-medium">Unique Feature</td>
                      <td className="text-center py-2 px-3">Kidney & metabolic factors</td>
                      <td className="text-center py-2 px-3">Stage-based approach</td>
                      <td className="text-center py-2 px-3">Treatment impact analysis</td>
                      <td className="text-center py-2 px-3">Statin therapy guidance</td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-2 px-3 font-medium">Race Consideration</td>
                      <td className="text-center py-2 px-3">Yes</td>
                      <td className="text-center py-2 px-3">Limited</td>
                      <td className="text-center py-2 px-3">Yes</td>
                      <td className="text-center py-2 px-3">Yes</td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-2 px-3 font-medium">Patient Education</td>
                      <td className="text-center py-2 px-3">Moderate</td>
                      <td className="text-center py-2 px-3">High</td>
                      <td className="text-center py-2 px-3">High</td>
                      <td className="text-center py-2 px-3">Moderate</td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-2 px-3 font-medium">Last Updated</td>
                      <td className="text-center py-2 px-3">2024</td>
                      <td className="text-center py-2 px-3">2023</td>
                      <td className="text-center py-2 px-3">2022</td>
                      <td className="text-center py-2 px-3">2019</td>
                    </tr>
                    <tr className="border-t">
                      <td className="py-2 px-3 font-medium">Primary Usage</td>
                      <td className="text-center py-2 px-3">Clinical decision-making</td>
                      <td className="text-center py-2 px-3">Patient education</td>
                      <td className="text-center py-2 px-3">Shared decision-making</td>
                      <td className="text-center py-2 px-3">Statin prescription</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-lg">Clinical Recommendations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-md">
                    <h4 className="font-medium mb-2">When to use AHA PREVENT™</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>For longer-term risk projection (30 years)</li>
                      <li>When kidney function metrics are available</li>
                      <li>For the most up-to-date risk assessment</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <h4 className="font-medium mb-2">When to use Harvard Health</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>For early stage risk identification</li>
                      <li>Patient education about disease progression</li>
                      <li>When detailed medical history is available</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <h4 className="font-medium mb-2">When to use Cleveland Clinic</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>For interactive patient counseling</li>
                      <li>When comparing treatment options</li>
                      <li>For visual risk representation to patients</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-md">
                    <h4 className="font-medium mb-2">When to use ASCVD Risk</h4>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      <li>For statin therapy decision-making</li>
                      <li>When following ACC/AHA guidelines</li>
                      <li>For quick risk assessment in clinical settings</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Separator />
                <p className="text-sm text-muted-foreground mt-4">
                  Note: This comparative analysis is for educational purposes only. Always refer to the official 
                  calculator websites for the most accurate and up-to-date information.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Prevention Impact Tab */}
        <TabsContent value="impact" className="p-4 border rounded-md mt-4">
          <PreventionImpactChart />
        </TabsContent>
      </Tabs>
    </div>
  );
}