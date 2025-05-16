import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface HealthDataCardProps {
  title: string;
  value: string;
  unit?: string;
  status: "normal" | "warning" | "critical";
  icon: React.ReactNode;
}

export default function HealthDataCard({
  title,
  value,
  unit,
  status,
  icon
}: HealthDataCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div
              className={cn(
                "p-2 rounded-full mr-3",
                status === "normal" && "bg-green-100",
                status === "warning" && "bg-yellow-100",
                status === "critical" && "bg-red-100"
              )}
            >
              {icon}
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {title}
              </p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold">{value}</p>
                {unit && (
                  <p className="ml-1 text-xs text-muted-foreground">{unit}</p>
                )}
              </div>
            </div>
          </div>
          <div
            className={cn(
              "h-3 w-3 rounded-full",
              status === "normal" && "bg-green-500",
              status === "warning" && "bg-yellow-500",
              status === "critical" && "bg-red-500"
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
