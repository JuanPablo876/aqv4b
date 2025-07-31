import { Button } from "./ui/button";

// Mock createClient function - replace with your actual implementation
const createClient = () => {
  return {
    auth{
      signOut () => {
        // Mock implementation - replace with actual Supabase client
        return { error };
      }
    }
  };
};
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const navigate = useNavigate();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    navigate("/auth/sign-up-success");
  };

  return <Button onClick={logout}>Logout</Button>;
}






