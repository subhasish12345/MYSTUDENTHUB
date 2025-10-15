
"use client";

import { useState } from "react";
import { useBackground } from "@/components/background-provider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const themes = [
  { id: "default", name: "Default", className: "bg-background" },
  { id: "pattern-1", name: "Cosmic Swirl", className: "bg-pattern-1" },
  { id: "pattern-2", name: "Digital Matrix", className: "bg-pattern-2" },
  { id: "pattern-3", name: "Retro Circles", className: "bg-pattern-3" },
  { id: "pattern-lamp-scene", name: "Lamp Scene", className: "bg-pattern-lamp-scene" },
  { id: "pattern-synthwave", name: "Synthwave", className: "bg-pattern-synthwave" },
  { id: "pattern-rain", name: "Rain", className: "bg-pattern-rain" },
  { id: "pastel-aurora", name: "Pastel Aurora", className: "bg-pastel-aurora" },
  { id: "blue-squares", name: "Blue Squares", className: "bg-blue-squares" },
  { id: "quantum-grid", name: "Quantum Grid", className: "bg-quantum-grid" },
  { id: 'bw-future', name: 'B&W Future', className: 'bg-bw-future' },
  { id: 'seigaiha', name: 'Seigaiha Wave', className: 'bg-seigaiha' },
  { id: 'fiery-texture', name: 'Fiery Texture', className: 'bg-fiery-texture' },
  { id: 'mandala', name: 'Mandala', className: 'bg-mandala' },
  { id: 'island-backdrop', name: 'Island View', className: 'bg-island-backdrop' },
];

export default function SettingsPage() {
  const { theme, setTheme } = useBackground();
  const [selectedTheme, setSelectedTheme] = useState(theme);

  const handleApply = () => {
    setTheme(selectedTheme);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Customize your dashboard experience.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>
            Select a background theme for your dashboard. This will be saved to
            your browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedTheme}
            onValueChange={setSelectedTheme}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {themes.map((t) => (
              <div key={t.id}>
                <RadioGroupItem value={t.id} id={t.id} className="sr-only" />
                <Label
                  htmlFor={t.id}
                  className={cn(
                    "block w-full h-24 rounded-lg border-2 cursor-pointer relative overflow-hidden",
                    selectedTheme === t.id && "border-primary ring-2 ring-primary"
                  )}
                >
                  <div className={cn("w-full h-full rounded-md", t.className)} />
                  <div className="absolute bottom-2 left-2 bg-background/80 text-foreground px-2 py-1 rounded-md text-sm">
                    {t.name}
                  </div>
                   {selectedTheme === t.id && (
                     <div className="absolute top-2 right-2 h-6 w-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                        <Check className="h-4 w-4" />
                    </div>
                  )}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button onClick={handleApply}>Apply Theme</Button>
      </div>
    </div>
  );
}
