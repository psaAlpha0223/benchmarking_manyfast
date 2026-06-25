"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { createClient } from "@/lib/supabase";

export interface UploadedFile {
  name: string;
  path: string;
  size: number;
}

const ACCEPTED_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".hwp",
  ".xlsx",
  ".xls",
  ".png",
  ".jpg",
  ".jpeg",
];
const MAX_FILE_SIZE = 200 * 1024 * 1024;
const MAX_TOTAL_SIZE = 1024 * 1024 * 1024;
const BUCKET = "request-files";

export default function FileUploader({
  userId,
  files,
  onChange,
}: {
  userId: string;
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (accepted: File[]) => {
      setError(null);

      const invalid = accepted.find(
        (file) =>
          !ACCEPTED_EXTENSIONS.some((ext) =>
            file.name.toLowerCase().endsWith(ext)
          )
      );
      if (invalid) {
        setError(`지원하지 않는 파일 형식입니다: ${invalid.name}`);
        return;
      }

      const tooLarge = accepted.find((file) => file.size > MAX_FILE_SIZE);
      if (tooLarge) {
        setError(`파일당 최대 200MB까지 업로드할 수 있습니다: ${tooLarge.name}`);
        return;
      }

      const currentTotal = files.reduce((sum, f) => sum + f.size, 0);
      const newTotal =
        currentTotal + accepted.reduce((sum, f) => sum + f.size, 0);
      if (newTotal > MAX_TOTAL_SIZE) {
        setError("전체 파일 용량은 최대 1GB까지 업로드할 수 있습니다.");
        return;
      }

      setUploading(true);
      const supabase = createClient();
      const uploaded: UploadedFile[] = [];

      for (const file of accepted) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const path = `${userId}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(path, file);

        if (uploadError) {
          setError(`업로드 실패: ${file.name} (${uploadError.message})`);
          continue;
        }
        uploaded.push({ name: file.name, path, size: file.size });
      }

      setUploading(false);
      if (uploaded.length > 0) {
        onChange([...files, ...uploaded]);
      }
    },
    [files, onChange, userId]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  async function removeFile(target: UploadedFile) {
    const supabase = createClient();
    await supabase.storage.from(BUCKET).remove([target.path]);
    onChange(files.filter((f) => f.path !== target.path));
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-gray-700">파일 첨부 (선택)</label>
      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed px-4 py-8 text-center text-sm ${
          isDragActive ? "border-gray-500 bg-gray-50" : "border-gray-300"
        }`}
      >
        <input {...getInputProps()} />
        <p className="text-gray-500">
          파일을 드래그하거나 클릭해서 업로드하세요
        </p>
        <p className="mt-1 text-xs text-gray-400">
          pdf, docx, hwp, xlsx, xls, png, jpg, jpeg · 파일당 200MB, 전체 1GB
        </p>
      </div>

      {uploading && <p className="text-xs text-gray-500">업로드 중...</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {files.length > 0 && (
        <ul className="flex flex-col gap-1">
          {files.map((file) => (
            <li
              key={file.path}
              className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-sm"
            >
              <span className="truncate text-gray-700">{file.name}</span>
              <button
                type="button"
                onClick={() => removeFile(file)}
                className="text-gray-400 hover:text-gray-700"
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
