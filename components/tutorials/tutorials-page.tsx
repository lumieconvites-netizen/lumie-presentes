import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TutorialVideo } from "@/lib/tutorial-videos";

export default function TutorialsPage({
  title,
  subtitle,
  videos,
}: {
  title: string;
  subtitle: string;
  videos: TutorialVideo[];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-display text-foreground">{title}</h1>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {videos.map((video) => (
          <Card key={video.id} className="border-[#ead9cd] overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg">{video.title}</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="rounded-lg overflow-hidden border border-[#ead9cd] bg-black">
                <video
                  controls
                  preload="metadata"
                  className="w-full h-auto bg-black"
                  src={video.url}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
