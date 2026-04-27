import TutorialsPage from "@/components/tutorials/tutorials-page";
import { CLIENT_TUTORIAL_VIDEOS } from "@/lib/tutorial-videos";

export default function DashboardTutorialsPage() {
  return (
    <TutorialsPage
      title="Tutoriais"
      subtitle="Assista aos vídeos para configurar e usar sua lista de presentes."
      videos={CLIENT_TUTORIAL_VIDEOS}
    />
  );
}
