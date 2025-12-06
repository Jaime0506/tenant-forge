import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";

export default function MainPage() {
    const navigate = useNavigate();
  return (
    <div>MainPage
        <Button onClick={() => navigate("/")}>Back</Button>
    </div>
  )
}
