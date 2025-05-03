import React, { useRef, forwardRef } from "react";

type FileInputProps = {
  onFileSelect: (file: File) => void;
  accept?: string;
  children: React.ReactNode;
  className?: string;
};

export const FileInput = forwardRef<HTMLDivElement, FileInputProps>(
  ({ onFileSelect, accept = ".json", children, className }, ref) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleClick = () => {
      fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleClick();
      }
    };

    return (
      <div
        ref={ref}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        className={className}
        aria-label="Select file"
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={accept}
          className="hidden"
          tabIndex={-1}
          aria-hidden="true"
        />
        {children}
      </div>
    );
  }
);

FileInput.displayName = "FileInput";

export default FileInput;
