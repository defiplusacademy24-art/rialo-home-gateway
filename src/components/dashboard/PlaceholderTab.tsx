import { Card, CardContent } from "@/components/ui/card";
import { Construction } from "lucide-react";

interface PlaceholderTabProps {
  title: string;
  description?: string;
}

const PlaceholderTab = ({ title, description }: PlaceholderTabProps) => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">{title}</h1>
      <Card>
        <CardContent className="pt-6 flex flex-col items-center justify-center py-16 text-center">
          <Construction className="w-12 h-12 text-muted-foreground mb-4" />
          <p className="text-lg font-semibold text-foreground">Coming Soon</p>
          <p className="text-sm text-muted-foreground max-w-md mt-2">
            {description || "This feature is currently under development and will be available soon."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderTab;
