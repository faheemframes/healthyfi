import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogOut, Apple } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
interface NavbarProps {
  user: any;
}
const Navbar = ({
  user
}: NavbarProps) => {
  const navigate = useNavigate();
  const handleLogout = async () => {
    const {
      error
    } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive"
      });
    } else {
      toast({
        title: "Success",
        description: "Logged out successfully"
      });
      navigate("/auth");
    }
  };
  return <nav className="border-b bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <Apple className="h-6 w-6" />
            <span>Healthyfi</span>
          </Link>
          
          {user && <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{user.email}</span>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>}
        </div>
      </div>
    </nav>;
};
export default Navbar;