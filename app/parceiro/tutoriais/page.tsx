import TutorialsPage from "@/components/tutorials/tutorials-page";
import { PARTNER_TUTORIAL_VIDEOS } from "@/lib/tutorial-videos";

export default function PartnerTutorialsPage() {
  return (
    <TutorialsPage
      title="Tutoriais do Parceiro"
      subtitle="Guia em vídeo para operar o painel, cadastrar contas e acompanhar comissões."
      videos={PARTNER_TUTORIAL_VIDEOS}
    />
  );
}
