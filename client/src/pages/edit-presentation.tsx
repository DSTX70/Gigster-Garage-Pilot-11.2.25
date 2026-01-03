import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AppHeader } from "@/components/app-header";
import { Link, useParams } from "wouter";
import { ArrowLeft, Presentation, Save, Loader2, Plus, X, GripVertical } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/i18n";
import type { Presentation as PresentationType } from "@shared/schema";

interface Slide {
  id: number;
  type: "title" | "content" | "image" | "bullets";
  title: string;
  content: string;
  imageUrl?: string;
  bullets?: string[];
}

export default function EditPresentation() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    title: "",
    audience: "",
    objective: "",
    theme: "professional",
  });

  const [slides, setSlides] = useState<Slide[]>([
    { id: 1, type: "title", title: "", content: "" }
  ]);

  const { data: presentation, isLoading: presentationLoading } = useQuery<PresentationType>({
    queryKey: ["/api/presentations", id],
    queryFn: () => apiRequest("GET", `/api/presentations/${id}`),
  });

  useEffect(() => {
    if (presentation) {
      setFormData({
        title: presentation.title || "",
        audience: presentation.audience || "",
        objective: presentation.objective || "",
        theme: presentation.theme || "professional",
      });
      if (presentation.slides && Array.isArray(presentation.slides) && presentation.slides.length > 0) {
        setSlides(presentation.slides.map((slide: any, index: number) => ({
          id: index + 1,
          type: slide.type || "content",
          title: slide.title || "",
          content: slide.content || "",
          imageUrl: slide.imageUrl,
          bullets: slide.bullets,
        })));
      }
    }
  }, [presentation]);

  const updatePresentationMutation = useMutation({
    mutationFn: (data: any) => apiRequest("PUT", `/api/presentations/${id}`, data),
    onSuccess: () => {
      toast({
        title: t('presentationUpdated') || "Presentation updated",
        description: t('presentationUpdatedDesc') || "Your presentation has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/presentations"] });
    },
    onError: () => {
      toast({
        title: t('error'),
        description: t('failedToUpdatePresentation') || "Failed to update presentation.",
        variant: "destructive",
      });
    },
  });

  const handleSlideChange = (slideId: number, field: keyof Slide, value: any) => {
    setSlides(prev => prev.map(slide => 
      slide.id === slideId ? { ...slide, [field]: value } : slide
    ));
  };

  const addSlide = () => {
    const newId = Math.max(...slides.map(s => s.id), 0) + 1;
    setSlides(prev => [...prev, { id: newId, type: "content", title: "", content: "" }]);
  };

  const removeSlide = (slideId: number) => {
    if (slides.length > 1) {
      setSlides(prev => prev.filter(slide => slide.id !== slideId));
    }
  };

  const handleSubmit = () => {
    const presentationData = {
      ...formData,
      slides,
    };
    updatePresentationMutation.mutate(presentationData);
  };

  if (presentationLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  if (!presentation) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex items-center justify-center h-96">
          <p className="text-gray-500">{t('presentationNotFound') || "Presentation not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/filing-cabinet">
            <Button variant="ghost" size="sm" data-testid="button-back">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('back')}
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <Presentation className="h-6 w-6 text-purple-600" />
            <h1 className="text-2xl font-bold">{t('editPresentation') || "Edit Presentation"}</h1>
          </div>
          <Badge variant="secondary">{presentation.status || "draft"}</Badge>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('presentationDetails') || "Presentation Details"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">{t('presentationTitle') || "Presentation Title"}</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter presentation title"
                  data-testid="input-presentation-title"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="audience">{t('audience') || "Target Audience"}</Label>
                  <Input
                    id="audience"
                    value={formData.audience}
                    onChange={(e) => setFormData({ ...formData, audience: e.target.value })}
                    placeholder="Who is this presentation for?"
                    data-testid="input-audience"
                  />
                </div>
                <div>
                  <Label htmlFor="theme">{t('theme') || "Theme"}</Label>
                  <Input
                    id="theme"
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    placeholder="professional, modern, minimal..."
                    data-testid="input-theme"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="objective">{t('objective') || "Objective"}</Label>
                <Textarea
                  id="objective"
                  value={formData.objective}
                  onChange={(e) => setFormData({ ...formData, objective: e.target.value })}
                  placeholder="What is the goal of this presentation?"
                  rows={2}
                  data-testid="textarea-objective"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('slides') || "Slides"}</span>
                <Button variant="outline" size="sm" onClick={addSlide} data-testid="button-add-slide">
                  <Plus className="h-4 w-4 mr-2" />
                  {t('addSlide') || "Add Slide"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {slides.map((slide, index) => (
                  <Card key={slide.id} className="border-2 border-dashed">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center gap-2 text-gray-400">
                          <GripVertical className="h-5 w-5" />
                          <span className="text-sm font-medium">{index + 1}</span>
                        </div>
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-4">
                            <div className="flex-1">
                              <Label>{t('slideTitle') || "Slide Title"}</Label>
                              <Input
                                value={slide.title}
                                onChange={(e) => handleSlideChange(slide.id, 'title', e.target.value)}
                                placeholder="Slide title..."
                                data-testid={`input-slide-title-${slide.id}`}
                              />
                            </div>
                            <div className="w-32">
                              <Label>{t('slideType') || "Type"}</Label>
                              <select
                                value={slide.type}
                                onChange={(e) => handleSlideChange(slide.id, 'type', e.target.value)}
                                className="w-full h-10 px-3 border rounded-md text-sm"
                                data-testid={`select-slide-type-${slide.id}`}
                              >
                                <option value="title">Title</option>
                                <option value="content">Content</option>
                                <option value="bullets">Bullets</option>
                                <option value="image">Image</option>
                              </select>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSlide(slide.id)}
                              disabled={slides.length === 1}
                              className="mt-6"
                              data-testid={`button-remove-slide-${slide.id}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                          <div>
                            <Label>{t('slideContent') || "Content"}</Label>
                            <Textarea
                              value={slide.content}
                              onChange={(e) => handleSlideChange(slide.id, 'content', e.target.value)}
                              placeholder="Slide content..."
                              rows={3}
                              data-testid={`textarea-slide-content-${slide.id}`}
                            />
                          </div>
                          {slide.type === "image" && (
                            <div>
                              <Label>{t('imageUrl') || "Image URL"}</Label>
                              <Input
                                value={slide.imageUrl || ""}
                                onChange={(e) => handleSlideChange(slide.id, 'imageUrl', e.target.value)}
                                placeholder="https://..."
                                data-testid={`input-slide-image-${slide.id}`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Link href="/filing-cabinet">
              <Button variant="outline" data-testid="button-cancel">
                {t('cancel')}
              </Button>
            </Link>
            <Button
              onClick={handleSubmit}
              disabled={updatePresentationMutation.isPending}
              data-testid="button-save-presentation"
            >
              {updatePresentationMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t('savePresentation')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
