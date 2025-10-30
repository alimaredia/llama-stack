import { Card, CardContent } from "@/components/ui/card";
import { HardDrive, AlertCircle } from "lucide-react";
import { useBackendStatus } from "@/hooks/use-backend-status";

export function BackendStatus() {
  const { isConnected, isLoading } = useBackendStatus();

  if (isLoading) {
    return null;
  }

  if (!isConnected) {
    return (
      <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Demo Mode</span>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            Backend server is not running. Showing placeholder data. 
            Connect to a Llama Stack server to see real data.
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
}
