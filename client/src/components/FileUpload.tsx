import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Check, File, FileUp, Trash2, X } from "lucide-react";

interface FileUploadProps {
  onFileUploaded: (fileId: number) => void;
  fileId: number | null;
}

export default function FileUpload({ onFileUploaded, fileId }: FileUploadProps) {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // Simulate progress
      const simulateProgress = () => {
        let currentProgress = 0;
        const interval = setInterval(() => {
          currentProgress += 5;
          if (currentProgress >= 95) {
            clearInterval(interval);
          } else {
            setProgress(currentProgress);
          }
        }, 100);

        return () => clearInterval(interval);
      };

      const cleanup = simulateProgress();

      try {
        // Read file content as text
        const fileContent = await readFileAsText(file);

        // Send file to server
        const response = await apiRequest("POST", "/api/files", {
          fileName: file.name,
          fileType: file.type || "text/csv",
          fileContent: fileContent,
        });

        const data = await response.json();
        
        // Set progress to 100% when complete
        setProgress(100);
        
        // Cleanup progress simulation
        cleanup();
        
        return data;
      } catch (error) {
        cleanup();
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "File Uploaded",
        description: "Your file has been uploaded successfully.",
      });
      onFileUploaded(data.id);

      // Reset progress after short delay
      setTimeout(() => {
        setProgress(0);
      }, 1000);
    },
    onError: (error) => {
      setProgress(0);
      toast({
        title: "Upload Failed",
        description: `Error: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Read file as text
  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsText(file);
    });
  };

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
    }
  };

  // Handle file upload
  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    } else {
      toast({
        title: "No File Selected",
        description: "Please select a file to upload.",
        variant: "destructive",
      });
    }
  };

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  // Cancel upload
  const handleCancel = () => {
    setFile(null);
    setProgress(0);
  };

  return (
    <div className="space-y-4">
      {!file && !fileId && (
        <div
          className={`border-2 border-dashed rounded-lg p-10 text-center ${
            dragActive
              ? "border-primary bg-primary/5"
              : "border-gray-300 hover:border-primary/50"
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center space-y-4">
            <FileUp className="h-12 w-12 text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">
                Drag and drop your file here
              </h3>
              <p className="text-sm text-muted-foreground">
                or click to browse from your computer
              </p>
            </div>
            <input
              id="file-upload"
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              Select File
            </Button>
          </div>
        </div>
      )}

      {file && !fileId && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <File className="h-8 w-8 text-primary mr-3" />
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={handleCancel}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            {progress > 0 && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2 w-full" />
                <p className="text-xs text-right text-muted-foreground">
                  {progress}%
                </p>
              </div>
            )}

            {progress === 0 && (
              <Button onClick={handleUpload} className="w-full">
                Upload File
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {fileId && (
        <Card>
          <CardContent className="p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">File Uploaded Successfully</p>
                  <p className="text-sm text-muted-foreground">
                    Your file is ready for analysis
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={handleCancel}
              >
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
