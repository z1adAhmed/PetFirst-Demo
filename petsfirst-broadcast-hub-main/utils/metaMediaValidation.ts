export const META_MEDIA = {
  /** Image: 5 MB. Formats: JPEG, JPG, PNG, WEBP. Min recommended 640×640px. */
  IMAGE: {
    maxSizeMB: 5,
    extensions: [".jpeg", ".jpg", ".png", ".webp"],
    mimeTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    minWidth: 640,
    minHeight: 640,
    maxWidth: 4096,
    maxHeight: 4096,
  },
  /** Video: 16 MB. MP4, 3GP. H.264 video + AAC audio required. */
  VIDEO: {
    maxSizeMB: 16,
    extensions: [".mp4", ".3gp"],
    mimeTypes: ["video/mp4", "video/3gpp"],
  },
  /** Document: 100 MB. PDF, DOC(X), XLS(X), PPT(X), TXT. Filename up to 240 chars. */
  DOCUMENT: {
    maxSizeMB: 100,
    maxFilenameLength: 240,
    extensions: [
      ".pdf",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".ppt",
      ".pptx",
      ".txt",
    ],
    mimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-powerpoint",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "text/plain",
    ],
  },
  /** Audio: 16 MB. AAC, M4A, AMR, MP3, OGG (OPUS). */
  AUDIO: {
    maxSizeMB: 16,
    extensions: [".aac", ".m4a", ".amr", ".mp3", ".ogg"],
    mimeTypes: [
      "audio/aac",
      "audio/mp4",
      "audio/amr",
      "audio/mpeg",
      "audio/ogg",
    ],
  },
  /** Sticker: 100 KB static, 500 KB animated. WEBP, exactly 512×512px. */
  STICKER: {
    maxSizeKBStatic: 100,
    maxSizeKBAnim: 500,
    extensions: [".webp"],
    mimeTypes: ["image/webp"],
    width: 512,
    height: 512,
  },
} as const;

export type MetaMediaType = keyof typeof META_MEDIA;

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

function isAllowedType(
  file: File,
  extensions: readonly string[],
  mimeTypes: readonly string[],
): boolean {
  const ext = getExtension(file.name);
  if (ext && extensions.includes(ext)) return true;
  if (file.type && mimeTypes.includes(file.type)) return true;
  return false;
}

/**
 * Validates a file for Meta Image: type, size (5 MB), optional min dimensions (640×640).
 * Returns error message or null if valid.
 */
export function validateMetaImage(file: File): string | null {
  const { maxSizeMB, extensions, mimeTypes } = META_MEDIA.IMAGE;
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (!isAllowedType(file, extensions, mimeTypes)) {
    return `Invalid format. Allowed: JPEG, JPG, PNG, WEBP. Max size: ${maxSizeMB}MB.`;
  }
  if (file.size > maxBytes) {
    return `File size must be under ${maxSizeMB}MB.`;
  }
  return null;
}

/**
 * Validates a file for Meta Video: type (MP4, 3GP), size (16 MB).
 * Note: Meta requires H.264 video and AAC audio; we cannot verify codec in browser.
 */
export function validateMetaVideo(file: File): string | null {
  const { maxSizeMB, extensions, mimeTypes } = META_MEDIA.VIDEO;
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (!isAllowedType(file, extensions, mimeTypes)) {
    return `Invalid format. Allowed: MP4, 3GP. Max size: ${maxSizeMB}MB. Use H.264 video and AAC audio.`;
  }
  if (file.size > maxBytes) {
    return `File size must be under ${maxSizeMB}MB.`;
  }
  return null;
}

/**
 * Validates a file for Meta Document: type, size (100 MB), filename length (240 chars).
 */
export function validateMetaDocument(file: File): string | null {
  const { maxSizeMB, maxFilenameLength, extensions, mimeTypes } =
    META_MEDIA.DOCUMENT;
  const maxBytes = maxSizeMB * 1024 * 1024;

  if (!isAllowedType(file, extensions, mimeTypes)) {
    return `Invalid format. Allowed: PDF, DOC(X), XLS(X), PPT(X), TXT. Max size: ${maxSizeMB}MB.`;
  }
  if (file.size > maxBytes) {
    return `File size must be under ${maxSizeMB}MB.`;
  }
  if (file.name.length > maxFilenameLength) {
    return `Filename must be ${maxFilenameLength} characters or fewer.`;
  }
  return null;
}

/**
 * Detects media type from file and runs the appropriate Meta validator.
 * Returns error message or null if valid.
 */
export function validateMetaMediaByFile(file: File): string | null {
  const ext = getExtension(file.name);
  const type = file.type?.toLowerCase() ?? "";

  if (
    META_MEDIA.IMAGE.extensions.some((e) => ext === e) ||
    type.startsWith("image/")
  ) {
    return validateMetaImage(file);
  }
  if (
    META_MEDIA.VIDEO.extensions.some((e) => ext === e) ||
    type.startsWith("video/")
  ) {
    return validateMetaVideo(file);
  }
  if (
    META_MEDIA.DOCUMENT.extensions.some((e) => ext === e) ||
    META_MEDIA.DOCUMENT.mimeTypes.some((m) => type === m)
  ) {
    return validateMetaDocument(file);
  }
  return "Unsupported file type. Use image (JPEG/PNG/WEBP), video (MP4/3GP), or document (PDF/DOC/XLS/PPT/TXT).";
}

/**
 * Returns the HTML accept string for a given Meta media type.
 */
export function getMetaAcceptString(
  mediaType: "IMAGE" | "VIDEO" | "DOCUMENT",
): string {
  switch (mediaType) {
    case "IMAGE":
      return [
        ...META_MEDIA.IMAGE.mimeTypes,
        ...META_MEDIA.IMAGE.extensions,
      ].join(",");
    case "VIDEO":
      return [
        ...META_MEDIA.VIDEO.mimeTypes,
        ...META_MEDIA.VIDEO.extensions,
      ].join(",");
    case "DOCUMENT":
      return [
        ...META_MEDIA.DOCUMENT.mimeTypes,
        ...META_MEDIA.DOCUMENT.extensions,
      ].join(",");
    default:
      return "";
  }
}

/**
 * Returns a user-friendly allowed types label for a given Meta media type.
 */
export function getMetaAllowedTypesLabel(
  mediaType: "IMAGE" | "VIDEO" | "DOCUMENT",
): string {
  switch (mediaType) {
    case "IMAGE":
      return "Allowed: JPEG, JPG, PNG, WEBP. Max file size: 5MB. Min 640×640px recommended.";
    case "VIDEO":
      return "Allowed: MP4, 3GP (H.264 + AAC). Max file size: 16MB.";
    case "DOCUMENT":
      return "Allowed: PDF, DOC(X), XLS(X), PPT(X), TXT. Max file size: 100MB. Filename up to 240 characters.";
    default:
      return "";
  }
}

/**
 * Returns max size in MB for a given Meta media type (for use with FileUpload maxSizeMB).
 */
export function getMetaMaxSizeMB(
  mediaType: "IMAGE" | "VIDEO" | "DOCUMENT",
): number {
  return META_MEDIA[mediaType].maxSizeMB;
}

/**
 * Loads image dimensions from a File. Use for Meta min 640×640 check.
 */
export function getImageDimensions(
  file: File,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

/**
 * Async validation for Meta image: enforces min 640×640 after sync validation passes.
 * Returns error message or null if valid.
 */
export async function validateMetaImageDimensions(
  file: File,
): Promise<string | null> {
  const { minWidth, minHeight, maxWidth, maxHeight } = META_MEDIA.IMAGE;
  try {
    const { width, height } = await getImageDimensions(file);
    if (width < minWidth || height < minHeight) {
      return `Image must be at least ${minWidth}×${minHeight} pixels (Meta requirement). Yours: ${width}×${height}.`;
    }
    if (width > maxWidth || height > maxHeight) {
      return `Image must not exceed ${maxWidth}×${maxHeight} pixels. Yours: ${width}×${height}.`;
    }
    return null;
  } catch {
    return "Could not read image dimensions. Use an image at least 640×640 pixels.";
  }
}
