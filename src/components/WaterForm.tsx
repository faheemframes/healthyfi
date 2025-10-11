import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Droplet } from "lucide-react";

interface WaterFormProps {
  userId: string;
  onWaterAdded: () => void;
}

const WaterForm = ({ userId, onWaterAdded }: WaterFormProps) => {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("water_intake").insert({
      user_id: userId,
      amount_ml: parseInt(amount),
      time: new Date().toISOString(),
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to log water. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Water intake logged!",
      });
      setAmount("");
      onWaterAdded();
    }
  };

  const quickAdd = async (ml: number) => {
    setLoading(true);

    const { error } = await supabase.from("water_intake").insert({
      user_id: userId,
      amount_ml: ml,
      time: new Date().toISOString(),
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to log water. Please try again.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Added ${ml}ml of water!`,
      });
      onWaterAdded();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplet className="h-5 w-5" />
          Log Water
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="water-amount">Amount (ml)</Label>
            <Input
              id="water-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 250"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Logging..." : "Log Water"}
          </Button>
        </form>
        
        <div className="space-y-2">
          <Label>Quick Add</Label>
          <div className="grid grid-cols-3 gap-2">
            <Button type="button" variant="outline" onClick={() => quickAdd(250)} disabled={loading}>
              250ml
            </Button>
            <Button type="button" variant="outline" onClick={() => quickAdd(500)} disabled={loading}>
              500ml
            </Button>
            <Button type="button" variant="outline" onClick={() => quickAdd(1000)} disabled={loading}>
              1L
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WaterForm;
