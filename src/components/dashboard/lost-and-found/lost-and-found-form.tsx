
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useState, useRef, useEffect, useCallback } from "react";
import { Loader2, Camera, Upload } from "lucide-react";
import Image from "next/image";

const formSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  description: z.string().min(10, "Please provide a more detailed description."),
  location: z.string().min(3, "Location is required."),
  status: z.enum(["lost", "found"], { required_error: "You must select a status."}),
});

export type LostAndFoundFormValues = z.infer<typeof formSchema>;

interface LostAndFoundFormProps {
  onSubmit: (values: LostAndFoundFormValues, imageDataUrl: string | null) => Promise<void>;
}

export function LostAndFoundForm({ onSubmit }: LostAndFoundFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const getCameraPermission = useCallback(async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
           setHasCameraPermission(false);
           return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this feature.',
        });
      }
  }, [toast]);
  
  useEffect(() => {
      if(isClient) {
          getCameraPermission();
      }
  }, [isClient, getCameraPermission]);


  const form = useForm<LostAndFoundFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      status: "lost",
    },
  });

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setImageDataUrl(dataUrl);
        // Stop camera stream
        const stream = video.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImageDataUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };


  const handleFormSubmit = async (values: LostAndFoundFormValues) => {
    if (!imageDataUrl) {
        toast({ title: "Image Required", description: "Please provide a picture of the item.", variant: "destructive"});
        return;
    }
    setIsSubmitting(true);
    await onSubmit(values, imageDataUrl);
    setIsSubmitting(false);
    form.reset();
    setImageDataUrl(null);
  };
  
  const renderCameraOrUpload = () => {
    if (imageDataUrl) {
      return (
        <div className="space-y-2 text-center">
            <Image src={imageDataUrl} alt="Captured item" width={400} height={300} className="rounded-md mx-auto aspect-video object-cover" />
            <Button variant="outline" onClick={() => {setImageDataUrl(null); getCameraPermission();}}>Retake Picture</Button>
        </div>
      );
    }
    
    if (hasCameraPermission === null) {
      return <Skeleton className="h-48 w-full" />
    }

    if (hasCameraPermission) {
        return (
            <div className="space-y-2">
                <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                <Button type="button" onClick={handleCapture} className="w-full">
                    <Camera className="mr-2 h-4 w-4" /> Capture Photo
                </Button>
            </div>
        );
    }
    
    return (
        <div className="space-y-4">
             <Alert variant="destructive">
                <Camera className="h-4 w-4" />
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                   Camera access was denied or is not available. Please upload a file instead.
                </AlertDescription>
            </Alert>
            <Button type="button" onClick={() => fileInputRef.current?.click()} className="w-full">
                <Upload className="mr-2 h-4 w-4"/> Upload Image
            </Button>
            <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>
    )
  };


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-8 py-4">
        <div className="space-y-6 px-1 max-h-[75vh] overflow-y-auto pr-4">
            
            {renderCameraOrUpload()}
            <canvas ref={canvasRef} className="hidden"></canvas>


            <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem className="space-y-3">
                    <FormLabel>What is the status of this item?</FormLabel>
                    <FormControl>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4">
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="lost" /></FormControl>
                            <FormLabel className="font-normal">I Lost This Item</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-3 space-y-0">
                            <FormControl><RadioGroupItem value="found" /></FormControl>
                            <FormLabel className="font-normal">I Found This Item</FormLabel>
                        </FormItem>
                    </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />

             <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                    <FormLabel>Item Name / Title</FormLabel>
                    <FormControl><Input placeholder="e.g., Black Leather Wallet, Blue Water Bottle" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
             <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl><Textarea placeholder="Describe the item, any identifying marks, etc." {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
            <FormField control={form.control} name="location" render={({ field }) => (
                <FormItem>
                    <FormLabel>Last Known Location</FormLabel>
                    <FormControl><Input placeholder="e.g., Library 2nd Floor, Canteen" {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
            )} />
        </div>
        <div className="flex justify-end pt-4 border-t pr-1">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Report"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
