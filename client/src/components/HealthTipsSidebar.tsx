import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronRight, Lightbulb, HeartPulse, Bookmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthTip {
  id: number;
  category: string;
  title: string;
  content: string;
  sources: string[];
}

const healthTips: HealthTip[] = [
  {
    id: 1,
    category: "Heart Health",
    title: "Reducing Sodium Intake",
    content: "Reducing sodium intake to less than 2,300 mg per day can significantly lower blood pressure. Try using herbs and spices instead of salt to flavor your food.",
    sources: ["American Heart Association", "National Heart, Lung, and Blood Institute"]
  },
  {
    id: 2, 
    category: "Heart Health",
    title: "Benefits of Regular Exercise",
    content: "Just 30 minutes of moderate activity five days a week can help lower your blood pressure and cholesterol and reduce your risk of heart disease.",
    sources: ["World Health Organization", "Centers for Disease Control and Prevention"]
  },
  {
    id: 3,
    category: "Diabetes Management",
    title: "Monitoring Blood Sugar",
    content: "Regular monitoring of blood glucose levels is essential for diabetes management. It helps you understand how food, physical activity, and medications affect your blood sugar.",
    sources: ["American Diabetes Association", "National Institute of Diabetes and Digestive and Kidney Diseases"]
  },
  {
    id: 4,
    category: "Diabetes Management",
    title: "Importance of Carb Counting",
    content: "Counting carbohydrates at each meal can help people with diabetes manage their blood sugar levels. Work with a dietitian to develop a meal plan that fits your needs.",
    sources: ["American Diabetes Association", "Mayo Clinic"]
  },
  {
    id: 5,
    category: "Sleep Health",
    title: "Establishing a Sleep Routine",
    content: "Going to bed and waking up at the same time every day, even on weekends, helps regulate your body's internal clock and may help you fall asleep and stay asleep for the night.",
    sources: ["National Sleep Foundation", "Centers for Disease Control and Prevention"]
  },
  {
    id: 6,
    category: "Mental Health",
    title: "Mindfulness Meditation",
    content: "Practicing mindfulness meditation for just 10 minutes a day can reduce stress, anxiety, and depression while improving focus and emotional regulation.",
    sources: ["American Psychological Association", "National Center for Complementary and Integrative Health"]
  },
  {
    id: 7,
    category: "Nutrition",
    title: "Benefits of the Mediterranean Diet",
    content: "The Mediterranean diet, rich in fruits, vegetables, whole grains, and healthy fats, has been shown to reduce the risk of heart disease, stroke, and certain cancers.",
    sources: ["American Heart Association", "Harvard T.H. Chan School of Public Health"]
  }
];

interface HealthTipsSidebarProps {
  userCondition?: string;
  className?: string;
}

export function HealthTipsSidebar({ userCondition, className }: HealthTipsSidebarProps) {
  const [currentTip, setCurrentTip] = useState<HealthTip | null>(null);
  const [savedTips, setSavedTips] = useState<number[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter tips based on user condition if provided
  useEffect(() => {
    let filteredTips = [...healthTips];
    
    if (userCondition === "heart disease") {
      filteredTips = healthTips.filter(tip => 
        tip.category === "Heart Health" || tip.category === "Nutrition"
      );
    } else if (userCondition === "diabetes") {
      filteredTips = healthTips.filter(tip => 
        tip.category === "Diabetes Management" || tip.category === "Nutrition"
      );
    }
    
    // Select a random tip from the filtered list
    const randomTip = filteredTips[Math.floor(Math.random() * filteredTips.length)];
    setCurrentTip(randomTip);
  }, [userCondition]);

  const toggleSaveTip = (tipId: number) => {
    if (savedTips.includes(tipId)) {
      setSavedTips(savedTips.filter(id => id !== tipId));
    } else {
      setSavedTips([...savedTips, tipId]);
    }
  };

  const getNewTip = () => {
    let filteredTips = [...healthTips];
    
    if (userCondition === "heart disease") {
      filteredTips = healthTips.filter(tip => 
        tip.category === "Heart Health" || tip.category === "Nutrition"
      );
    } else if (userCondition === "diabetes") {
      filteredTips = healthTips.filter(tip => 
        tip.category === "Diabetes Management" || tip.category === "Nutrition"
      );
    }
    
    // Get a different tip than the current one
    let newTips = filteredTips.filter(tip => tip.id !== currentTip?.id);
    if (newTips.length === 0) newTips = filteredTips; // If all filtered out, reset
    
    const randomTip = newTips[Math.floor(Math.random() * newTips.length)];
    setCurrentTip(randomTip);
  };

  if (!currentTip) return null;

  const isSaved = savedTips.includes(currentTip.id);

  return (
    <div className={cn("transition-all duration-300", className, 
      isExpanded ? "w-80" : "w-14"
    )}>
      <div className="h-full flex flex-col">
        <div 
          className={cn(
            "flex items-center p-3 border-b cursor-pointer bg-blue-50 dark:bg-blue-950/20",
            isExpanded ? "justify-between" : "justify-center"
          )}
          onClick={() => setIsExpanded(prev => !prev)}
        >
          <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          {isExpanded && (
            <div className="flex-1 px-3">
              <h3 className="font-medium">Health Tips</h3>
            </div>
          )}
          <ChevronRight className={cn(
            "h-4 w-4 text-blue-600 dark:text-blue-400 transition-transform", 
            isExpanded ? "rotate-180" : "rotate-0"
          )} />
        </div>
        
        {isExpanded && (
          <>
            <ScrollArea className="flex-1 p-4">
              <Card className="mb-4">
                <CardHeader className="p-4 pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mb-2">
                        {currentTip.category}
                      </span>
                      <CardTitle className="text-base">{currentTip.title}</CardTitle>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8", 
                        isSaved ? "text-yellow-500" : "text-gray-400"
                      )}
                      onClick={() => toggleSaveTip(currentTip.id)}
                    >
                      <Bookmark className="h-5 w-5" fill={isSaved ? "currentColor" : "none"} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    {currentTip.content}
                  </p>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <p className="font-semibold mb-1">Sources:</p>
                    <ul className="list-disc list-inside">
                      {currentTip.sources.map((source, index) => (
                        <li key={index}>{source}</li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
              
              {savedTips.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-semibold text-sm mb-3 flex items-center">
                    <Bookmark className="h-4 w-4 mr-2" />
                    Saved Tips
                  </h4>
                  <div className="space-y-2">
                    {savedTips.map(id => {
                      const tip = healthTips.find(t => t.id === id);
                      if (!tip) return null;
                      
                      return (
                        <div key={id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 mb-1">
                                {tip.category}
                              </span>
                              <h5 className="font-medium text-sm">{tip.title}</h5>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-yellow-500"
                              onClick={() => toggleSaveTip(tip.id)}
                            >
                              <Bookmark className="h-4 w-4" fill="currentColor" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </ScrollArea>
            
            <div className="p-3 border-t">
              <Button
                onClick={getNewTip}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                <HeartPulse className="h-4 w-4 mr-2" /> 
                New Health Tip
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HealthTipsSidebar;