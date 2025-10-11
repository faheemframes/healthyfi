import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Bell, Clock, Plus, Trash2, CheckCircle, XCircle } from "lucide-react";

interface ReminderSystemProps {
  userId: string;
  userProfile?: {
    daily_calorie_goal: number | null;
    daily_water_goal_ml: number;
    reminder_enabled: boolean;
    reminder_times: string[];
  } | null;
}

interface Reminder {
  id: string;
  reminder_type: string;
  message: string;
  scheduled_time: string;
  sent_at: string | null;
  status: string;
  created_at: string;
}

const ReminderSystem = ({ userId, userProfile }: ReminderSystemProps) => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [newReminderTime, setNewReminderTime] = useState("");
  const [newReminderType, setNewReminderType] = useState("water");

  useEffect(() => {
    fetchReminders();
  }, [userId]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reminders")
        .select("*")
        .eq("user_id", userId)
        .order("scheduled_time", { ascending: true });

      if (error) throw error;
      setReminders(data || []);
    } catch (error: any) {
      console.error("Error fetching reminders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch reminders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createReminder = async () => {
    if (!newReminderTime) return;

    const today = new Date();
    const [hours, minutes] = newReminderTime.split(":");
    today.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    let message = "";
    switch (newReminderType) {
      case "water":
        message = "💧 Time to hydrate! Don't forget to drink water.";
        break;
      case "meal":
        message = "🍽️ Time for a healthy meal! Log your food to stay on track.";
        break;
      case "goal":
        message = "🎯 Check your daily progress! How are you doing with your goals?";
        break;
    }

    try {
      const { error } = await supabase
        .from("reminders")
        .insert({
          user_id: userId,
          reminder_type: newReminderType,
          message,
          scheduled_time: today.toISOString(),
          status: "pending"
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reminder created successfully!",
      });

      setNewReminderTime("");
      setNewReminderType("water");
      fetchReminders();
    } catch (error: any) {
      console.error("Error creating reminder:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create reminder",
        variant: "destructive",
      });
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      const { error } = await supabase
        .from("reminders")
        .delete()
        .eq("id", reminderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Reminder deleted successfully!",
      });

      fetchReminders();
    } catch (error: any) {
      console.error("Error deleting reminder:", error);
      toast({
        title: "Error",
        description: "Failed to delete reminder",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "sent":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "water":
        return "bg-blue-100 text-blue-800";
      case "meal":
        return "bg-green-100 text-green-800";
      case "goal":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Reminder System
        </CardTitle>
        <CardDescription>
          Set up daily reminders to help you stay on track with your health goals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create New Reminder */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Reminder
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="reminder-type">Type</Label>
              <Select value={newReminderType} onValueChange={setNewReminderType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="water">💧 Water</SelectItem>
                  <SelectItem value="meal">🍽️ Meal</SelectItem>
                  <SelectItem value="goal">🎯 Goal Check</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="reminder-time">Time</Label>
              <Input
                id="reminder-time"
                type="time"
                value={newReminderTime}
                onChange={(e) => setNewReminderTime(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={createReminder} disabled={!newReminderTime} className="w-full">
                Add Reminder
              </Button>
            </div>
          </div>
        </div>

        {/* Existing Reminders */}
        <div className="space-y-4">
          <h4 className="font-medium">Your Reminders</h4>
          
          {loading ? (
            <div className="text-center py-4">Loading reminders...</div>
          ) : reminders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No reminders set up yet. Create your first reminder above!
            </div>
          ) : (
            <div className="space-y-3">
              {reminders.map((reminder) => (
                <div
                  key={reminder.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(reminder.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(reminder.reminder_type)}>
                          {reminder.reminder_type}
                        </Badge>
                        <Badge className={getStatusColor(reminder.status)}>
                          {reminder.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {reminder.message}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(reminder.scheduled_time)}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteReminder(reminder.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Smart Reminders Info */}
        <div className="p-4 bg-secondary/50 rounded-lg">
          <h5 className="font-medium mb-2">Smart Reminders</h5>
          <p className="text-sm text-muted-foreground">
            Based on your profile, we recommend setting reminders for:
            {userProfile?.daily_water_goal_ml && (
              <span className="block mt-1">
                💧 Water intake every 2-3 hours
              </span>
            )}
            {userProfile?.daily_calorie_goal && (
              <span className="block">
                🍽️ Meal logging at breakfast, lunch, and dinner
              </span>
            )}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReminderSystem;
