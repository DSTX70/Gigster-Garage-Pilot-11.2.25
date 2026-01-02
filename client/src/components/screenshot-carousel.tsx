import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Play, Pause } from "lucide-react";

interface Screenshot {
  id: string;
  title: string;
  description: string;
  src: string;
}

const SCREENSHOTS: Screenshot[] = [
  {
    id: "dashboard",
    title: "My Dashboard",
    description: "Your command center — see every spark, track every win, fuel your hustle",
    src: "/screenshots/dashboard.png"
  },
  {
    id: "task-form",
    title: "Task Creation",
    description: "Spark new tasks with precision — deadlines, priorities, and project assignments locked in",
    src: "/screenshots/task-form.png"
  },
  {
    id: "kanban",
    title: "Project Board",
    description: "Drag, drop, dominate — visual project flow that keeps your momentum rolling",
    src: "/screenshots/kanban.png"
  }
];

export function ScreenshotCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SCREENSHOTS.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
    setIsAutoPlaying(false);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + SCREENSHOTS.length) % SCREENSHOTS.length);
    setIsAutoPlaying(false);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % SCREENSHOTS.length);
    setIsAutoPlaying(false);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(!isAutoPlaying);
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main Image Display */}
      <div className="relative aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-2xl">
        <img
          src={SCREENSHOTS[currentIndex].src}
          alt={SCREENSHOTS[currentIndex].title}
          className="w-full h-full object-cover transition-opacity duration-500"
        />
        
        {/* Navigation Buttons */}
        <Button
          variant="outline"
          size="sm"
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white border-gray-200 shadow-lg"
        >
          <ChevronLeft size={20} />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={goToNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/90 hover:bg-white border-gray-200 shadow-lg"
        >
          <ChevronRight size={20} />
        </Button>

        {/* Auto-play Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAutoPlay}
          className="absolute top-4 right-4 bg-white/90 hover:bg-white border-gray-200 shadow-lg"
        >
          {isAutoPlaying ? <Pause size={16} /> : <Play size={16} />}
        </Button>

        {/* Overlay with Info */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <h3 className="text-white font-bold text-xl mb-1">
            {SCREENSHOTS[currentIndex].title}
          </h3>
          <p className="text-white/90 text-sm">
            {SCREENSHOTS[currentIndex].description}
          </p>
        </div>
      </div>

      {/* Thumbnail Navigation */}
      <div className="flex justify-center mt-6 space-x-4">
        {SCREENSHOTS.map((screenshot, index) => (
          <button
            key={screenshot.id}
            onClick={() => goToSlide(index)}
            className={`relative w-20 h-12 rounded-lg overflow-hidden border-2 transition-all ${
              index === currentIndex
                ? "border-blue-900 ring-2 ring-blue-200"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <img
              src={screenshot.src}
              alt={screenshot.title}
              className="w-full h-full object-cover"
            />
            {index === currentIndex && (
              <div className="absolute inset-0 bg-blue-900/20" />
            )}
          </button>
        ))}
      </div>

      {/* Progress Indicators */}
      <div className="flex justify-center mt-4 space-x-2">
        {SCREENSHOTS.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all ${
              index === currentIndex ? "w-8 bg-blue-900" : "w-2 bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}