import React, { useEffect, useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import TemplateCard from "../../components/ui/TemplateCard";
import Input from "../../components/ui/Input";
import MediaUploadPanel from "../../components/upload/MediaUploadPanel";
import ConfirmActionModal from "../../components/ui/ConfirmActionModal";
import Loader from "../../components/ui/Loader";
import TemplateApprovalNotice from "../../components/ui/TemplateApprovalNotice";
import { MessageTemplate } from "../../types";
import {
  fetchTemplates,
  fetchTemplateDetailsThunk,
  fetchTemplateSelections,
  deleteTemplateThunk,
} from "../../store/thunks/templateThunks";
import { useSequentialBulkAction } from "../../hooks/useSequentialBulkAction";
import {
  uploadMediaToMeta,
  uploadStrapiFile,
  saveTemplateSelection,
  updateTemplateSelection as updateTemplateSelectionThunk,
} from "../../store/thunks/mediaThunks";
import {
  setSearchQuery,
  setExpandedTemplate,
  setUploadingTemplate,
  setUploadError,
  updateTemplateSelection,
} from "../../store/slices/templatesSlice";
import { setSelectedTemplate } from "../../store/slices/configSlice";
import { API_ENDPOINTS } from "../../utils/apiEndpoints";
import { getUploadErrorMessage } from "../../utils/errorMessage";

interface TemplateSelectionPageProps {
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  apiVersion: string;
  onSelectTemplate: (
    template: MessageTemplate,
    attachmentId?: string,
    carouselAttachmentIds?: string[],
  ) => void;
  selectedTemplate?: string;
}

const TemplateSelectionPage: React.FC<TemplateSelectionPageProps> = ({
  accessToken,
  phoneNumberId,
  wabaId,
  apiVersion,
  onSelectTemplate,
  selectedTemplate,
}) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const {
    templates,
    isLoading,
    error,
    loadingDetails,
    expandedTemplate,
    uploadingTemplate,
    uploadErrors,
    templateSelectionMap,
    searchQuery,
  } = useAppSelector((state) => state.templates);

  // Fetch templates on mount so list is always fresh (e.g. after creating a template)
  useEffect(() => {
    if (accessToken && wabaId) {
      dispatch(fetchTemplates({ accessToken, wabaId, apiVersion }));
    }
  }, [accessToken, wabaId, apiVersion, dispatch]);

  // Fetch template selections on mount
  useEffect(() => {
    dispatch(fetchTemplateSelections());
  }, [dispatch]);

  const templateRequiresMedia = (template: MessageTemplate) => {
    return Boolean(
      template.components?.some(
        (c: any) =>
          c.type === "CAROUSEL" ||
          (c.type === "HEADER" &&
            "format" in c &&
            (c.format === "IMAGE" ||
              c.format === "VIDEO" ||
              c.format === "DOCUMENT")),
      ),
    );
  };

  const isCarouselTemplate = (template: MessageTemplate) => {
    return (template.components as any)?.some(
      (c: any) => c.type === "CAROUSEL",
    );
  };

  const getTemplateType = (template: MessageTemplate) => {
    const header = template.components?.find((c) => c.type === "HEADER");
    const format =
      (header && "format" in header ? header.format : undefined) ?? "TEXT";
    return format.charAt(0) + format.slice(1).toLowerCase();
  };

  const getStrapiImageUrl = useCallback((image?: string) => {
    if (!image) return null;
    return API_ENDPOINTS.STRAPI.GET_UPLOADED_FILE(image);
  }, []);

  const getUploadedImageUrlForTemplate = useCallback(
    (templateName: string) => {
      const imageData = templateSelectionMap[templateName];
      const imageUrl =
        imageData?.templateImageUrl || imageData?.imageUrl || imageData?.image;
      const finalUrl = getStrapiImageUrl(imageUrl);
      if (finalUrl) {
        console.log(`Template ${templateName} - Using Strapi image:`, finalUrl);
      }
      return finalUrl;
    },
    [templateSelectionMap, getStrapiImageUrl],
  );

  const handleUploadForTemplate = async (
    template: MessageTemplate,
    file: File,
  ) => {
    dispatch(setUploadingTemplate(template.name));
    dispatch(setUploadError({ templateName: template.name, error: null }));

    try {
      // Upload to both Meta API and Strapi
      const mediaIdResult = await dispatch(
        uploadMediaToMeta({ file, accessToken, phoneNumberId, apiVersion }),
      );
      if (uploadMediaToMeta.rejected.match(mediaIdResult)) {
        throw new Error(mediaIdResult.payload || "Failed to upload media");
      }
      const mediaId = mediaIdResult.payload;

      const existingSelectionId =
        templateSelectionMap[template.name]?.selectionId;
      const selectionResult = existingSelectionId
        ? await dispatch(
            updateTemplateSelectionThunk({
              selectionId: existingSelectionId,
              templateId: template.id || "",
              templateName: template.name,
              mediaId,
              templateType: getTemplateType(template),
              isCarousel: isCarouselTemplate(template),
              templateVariables: template.variableIndexMap,
              couponCode: template.couponCode,
            }),
          )
        : await dispatch(
            saveTemplateSelection({
              templateId: template.id || "",
              templateName: template.name,
              mediaId,
              templateType: getTemplateType(template),
              isCarousel: isCarouselTemplate(template),
              templateVariables: template.variableIndexMap,
              couponCode: template.couponCode,
            }),
          );

      if (
        saveTemplateSelection.rejected.match(selectionResult) ||
        updateTemplateSelectionThunk.rejected.match(selectionResult)
      ) {
        throw new Error(
          selectionResult.payload || "Failed to save template selection",
        );
      }

      const localData = selectionResult.payload;
      const localAttributes =
        localData?.data?.attributes ||
        localData?.attributes ||
        localData?.data ||
        localData;
      const createdId =
        localData?.data?.id || localData?.id || existingSelectionId;
      if (!createdId) {
        throw new Error("Template selection created but missing id");
      }

      const strapiResult = await dispatch(
        uploadStrapiFile({
          file,
          ref: "api::marketing.marketing",
          refId: Number(createdId),
          field: isCarouselTemplate(template)
            ? "carouselTemplateAttachment"
            : "templateAttachment",
        }),
      );
      if (uploadStrapiFile.rejected.match(strapiResult)) {
        throw new Error(strapiResult.payload || "Failed to upload to Strapi");
      }
      const strapiFile = strapiResult.payload;

      // Update template selection map (Strapi fields: templateAttachment, templateAttachmentId)
      const templateImageUrl =
        localAttributes?.templateAttachment?.data?.attributes?.url ||
        strapiFile.url ||
        strapiFile.name;
      const templateImageId = localAttributes?.templateAttachmentId || mediaId;
      dispatch(
        updateTemplateSelection({
          templateName: template.name,
          data: {
            selectionId: Number(createdId),
            templateImageUrl,
            templateImageId,
            templateType:
              localAttributes?.templateType || getTemplateType(template),
            templateImageFileId: strapiFile.id,
            imageId: templateImageId,
            imageUrl: templateImageUrl,
            templateVariables: template.variableIndexMap,
            couponCode: template.couponCode,
          },
        }),
      );

      // Refresh selections
      await dispatch(fetchTemplateSelections());

      // Hide upload footer once upload completes (user can show again via "Replace Media")
      dispatch(setExpandedTemplate(null));
    } catch (error: unknown) {
      dispatch(
        setUploadError({
          templateName: template.name,
          error: getUploadErrorMessage(error),
        }),
      );
    } finally {
      dispatch(setUploadingTemplate(null));
    }
  };

  const loadTemplateDetails = useCallback(
    async (templateName: string) => {
      if (loadingDetails.includes(templateName)) return;

      await dispatch(
        fetchTemplateDetailsThunk({
          accessToken,
          wabaId,
          templateName,
          apiVersion,
        }),
      );
    },
    [dispatch, accessToken, wabaId, apiVersion, loadingDetails],
  );

  const resolveTemplateForView = useCallback(
    async (template: MessageTemplate): Promise<MessageTemplate | null> => {
      if (template.components?.length) {
        return template;
      }
      const result = await dispatch(
        fetchTemplateDetailsThunk({
          accessToken,
          wabaId,
          templateName: template.name,
          apiVersion,
        }),
      );
      if (fetchTemplateDetailsThunk.fulfilled.match(result)) {
        return {
          ...template,
          ...result.payload,
          components: result.payload.components || template.components,
        };
      }
      return null;
    },
    [dispatch, accessToken, wabaId, apiVersion],
  );

  const debouncedLoadTemplateDetails = useCallback(
    (templateName: string) => {
      const timer = setTimeout(() => {
        loadTemplateDetails(templateName);
      }, 300);
      return () => clearTimeout(timer);
    },
    [loadTemplateDetails],
  );

  const filteredTemplates = templates.filter((t) =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const [deleteTarget, setDeleteTarget] = useState<MessageTemplate | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const deleteMessage = useMemo(() => {
    if (!deleteTarget) return "";
    const parts = [
      `This will permanently delete "${deleteTarget.name}" from Meta.`,
      "This action cannot be undone.",
    ];
    if (deleteError) parts.push("", deleteError);
    return parts.join("\n");
  }, [deleteTarget, deleteError]);

  // Bulk selection
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedTemplateNames, setSelectedTemplateNames] = useState<
    Set<string>
  >(new Set());
  const [bulkDeleteTargets, setBulkDeleteTargets] = useState<
    MessageTemplate[] | null
  >(null);

  const deleteOneTemplate = useCallback(
    async (template: MessageTemplate) => {
      const result = await dispatch(
        deleteTemplateThunk({
          accessToken,
          wabaId,
          templateName: template.name,
          hsmId: template.id ? String(template.id) : undefined,
          apiVersion,
          strapiSelectionId: templateSelectionMap[template.name]?.selectionId,
          templateId: template.id ? String(template.id) : undefined,
        }),
      );
      if (deleteTemplateThunk.rejected.match(result)) {
        throw new Error(result.payload || "Failed to delete template");
      }
    },
    [dispatch, accessToken, wabaId, apiVersion, templateSelectionMap],
  );

  const {
    run: runBulkDelete,
    isRunning: isBulkDeleting,
    progress: bulkProgress,
    reset: resetBulkProgress,
  } = useSequentialBulkAction(deleteOneTemplate, {
    getItemKey: (t) => t.name,
    continueOnError: true,
  });

  const selectedTemplates = useMemo(
    () => filteredTemplates.filter((t) => selectedTemplateNames.has(t.name)),
    [filteredTemplates, selectedTemplateNames],
  );

  const bulkDeleteMessage = useMemo(() => {
    if (!bulkDeleteTargets?.length) return "";
    const names = bulkDeleteTargets.map((t) => `• ${t.name}`).join("\n");
    const errorEntries = Object.entries(bulkProgress.errors);
    const errorBlock =
      errorEntries.length > 0
        ? "\n\nFailed:\n" +
          errorEntries.map(([name, msg]) => `• ${name}: ${msg}`).join("\n")
        : "";
    return `The following templates will be permanently deleted from Meta:\n\n${names}\n\nThis action cannot be undone.${errorBlock}`;
  }, [bulkDeleteTargets, bulkProgress.errors]);

  const handleBulkDeleteConfirm = useCallback(async () => {
    if (!bulkDeleteTargets?.length) return;
    await runBulkDelete(bulkDeleteTargets);
    await dispatch(fetchTemplates({ accessToken, wabaId, apiVersion }));
    setBulkDeleteTargets(null);
    setSelectedTemplateNames(new Set());
    setSelectionMode(false);
    resetBulkProgress();
  }, [
    bulkDeleteTargets,
    runBulkDelete,
    dispatch,
    accessToken,
    wabaId,
    apiVersion,
    resetBulkProgress,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-black text-slate-700">
          Select Template
        </h1>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => navigate("/templates/new")}
            className="px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold bg-white text-[#00A89E] border-2 border-[#00A89E] hover:bg-[#00A89E] hover:text-white flex items-center gap-2 transition-colors"
          >
            <span className="text-lg leading-none">+</span>
            <span className="hidden sm:inline">New Template</span>
            <span className="sm:hidden">New</span>
            <svg
              className="w-3.5 h-3.5 opacity-70"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </button>
          <button
            onClick={() =>
              dispatch(fetchTemplates({ accessToken, wabaId, apiVersion }))
            }
            className="px-3 sm:px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold bg-[#00A89E] text-white hover:bg-[#00c4b8] flex items-center gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.5 12a7.5 7.5 0 0112.74-5.2M19.5 12a7.5 7.5 0 01-12.74 5.2M19.5 4.5v5h-5M4.5 19.5v-5h5"
              />
            </svg>
            <span className="hidden sm:inline">Refresh</span>
            <span className="sm:hidden">Sync</span>
          </button>
          {!error && filteredTemplates.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectionMode((prev) => {
                  if (!prev) setSelectedTemplateNames(new Set());
                  return !prev;
                });
              }}
              disabled={isLoading}
              className={`px-3 sm:px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                selectionMode
                  ? "bg-slate-700 text-white hover:bg-slate-800"
                  : "bg-white text-slate-600 border-2 border-slate-300 hover:border-teal-400 hover:text-teal-700"
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {selectionMode ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                  <span>Cancel selection</span>
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                  <span>Select templates</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {selectionMode && (
        <div className="sticky top-0 z-30 -mx-1 px-4 py-3 rounded-2xl bg-gradient-to-r from-teal-50 to-emerald-50 border-2 border-teal-200/80 shadow-lg shadow-teal-100/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 border border-teal-200 text-teal-800 font-black text-sm">
              <span className="w-6 h-6 rounded-lg bg-[#00A89E] text-white flex items-center justify-center text-xs">
                {selectedTemplateNames.size}
              </span>
              {selectedTemplateNames.size === 1
                ? "1 template selected"
                : `${selectedTemplateNames.size} templates selected`}
            </span>
            <button
              type="button"
              onClick={() => setSelectedTemplateNames(new Set())}
              className="text-sm font-bold text-slate-600 hover:text-slate-800 underline underline-offset-2"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (selectedTemplates.length > 0) {
                  setBulkDeleteTargets(selectedTemplates);
                }
              }}
              disabled={selectedTemplateNames.size === 0}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-500 text-white hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Delete{" "}
              {selectedTemplateNames.size > 0
                ? `(${selectedTemplateNames.size})`
                : ""}
            </button>
          </div>
        </div>
      )}

      <TemplateApprovalNotice templates={templates} />

      <div className="relative">
        <Input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => dispatch(setSearchQuery(e.target.value))}
        />
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader
              size="lg"
              className="mx-auto mb-4"
              ariaLabel="Loading templates"
            />
            <p className="text-slate-500 font-medium">Loading templates...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
          <p className="text-rose-600 text-sm font-bold">{error}</p>
        </div>
      )}

      {!isLoading && !error && filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="flex flex-col items-center">
            <span className="text-3xl">📭</span>
            <h3 className="text-lg font-black text-slate-700 mb-2">
              No Templates Found
            </h3>
            <p className="text-slate-400 text-sm">
              {searchQuery
                ? "Try adjusting your search query"
                : "No active templates available"}
            </p>
          </div>
        </div>
      )}

      {!isLoading && !error && filteredTemplates.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => {
            const uploadedData = templateSelectionMap[template.name];
            const isCarousel = isCarouselTemplate(template);
            const hasUploadedImage = isCarousel
              ? Boolean(
                  uploadedData?.templateCarouselImageIds?.length ||
                  uploadedData?.templateImageId ||
                  uploadedData?.imageId,
                )
              : Boolean(uploadedData?.templateImageId || uploadedData?.imageId);
            const attachmentId =
              uploadedData?.templateImageId || uploadedData?.imageId;
            const requiresMedia = template.components
              ? templateRequiresMedia(template)
              : uploadedData?.templateType === "Carousel" ||
                Boolean(uploadedData?.templateCarouselImageIds?.length);
            const isUploadingThisTemplate = uploadingTemplate === template.name;
            const broadcastDisabled =
              isUploadingThisTemplate ||
              template.status === "PENDING" ||
              (requiresMedia && !hasUploadedImage);
            const uploadDisabled =
              template.status === "PENDING" ||
              isUploadingThisTemplate ||
              (template.components
                ? !templateRequiresMedia(template)
                : !requiresMedia);
            const showUploadButton = requiresMedia;

            return (
              <TemplateCard
                key={template.name}
                template={template}
                selectionMode={selectionMode}
                bulkSelected={selectedTemplateNames.has(template.name)}
                onBulkSelectChange={(selected) => {
                  setSelectedTemplateNames((prev) => {
                    const next = new Set(prev);
                    if (selected) next.add(template.name);
                    else next.delete(template.name);
                    return next;
                  });
                }}
                onDeleteClick={() => {
                  setDeleteError(null);
                  setDeleteTarget(template);
                }}
                onViewTemplateClick={async () => {
                  const fullTemplate = await resolveTemplateForView(template);
                  if (!fullTemplate) return;
                  const templateWithMap = {
                    ...fullTemplate,
                    variableIndexMap:
                      templateSelectionMap[template.name]?.templateVariables ||
                      fullTemplate.variableIndexMap,
                    couponCode:
                      templateSelectionMap[template.name]?.couponCode ||
                      fullTemplate.couponCode,
                  };
                  navigate("/templates/new", {
                    state: {
                      mode: "view",
                      template: templateWithMap,
                      uploadedImageUrl:
                        getUploadedImageUrlForTemplate(template.name) ||
                        undefined,
                    },
                  });
                }}
                deleteDisabled={isUploadingThisTemplate}
                onBroadcastClick={() => {
                  if (template.status === "PENDING") return;
                  dispatch(setSelectedTemplate(template));
                  if (!template.components) {
                    debouncedLoadTemplateDetails(template.name);
                    return;
                  }
                  const templateWithMap = {
                    ...template,
                    variableIndexMap:
                      templateSelectionMap[template.name]?.templateVariables ||
                      template.variableIndexMap,
                    couponCode:
                      templateSelectionMap[template.name]?.couponCode ||
                      template.couponCode,
                  };
                  if (template.components && !templateRequiresMedia(template)) {
                    onSelectTemplate(templateWithMap);
                    return;
                  }
                  if (template.components && templateRequiresMedia(template)) {
                    if (!hasUploadedImage) return;
                    const isCarousel = template.components?.some(
                      (c: any) => c.type === "CAROUSEL",
                    );
                    if (
                      isCarousel &&
                      uploadedData?.carouselAttachmentIds?.length
                    ) {
                      onSelectTemplate(
                        templateWithMap,
                        attachmentId,
                        uploadedData.carouselAttachmentIds,
                      );
                    } else {
                      onSelectTemplate(templateWithMap, attachmentId);
                    }
                  }
                }}
                onUploadClick={() => {
                  if (template.status === "PENDING") return;
                  dispatch(setSelectedTemplate(template));
                  if (!template.components) {
                    debouncedLoadTemplateDetails(template.name);
                  }
                  dispatch(
                    setExpandedTemplate(
                      expandedTemplate === template.name ? null : template.name,
                    ),
                  );
                }}
                onMouseEnter={() => {
                  if (template.status === "PENDING") return;
                  if (!template.components) {
                    debouncedLoadTemplateDetails(template.name);
                  }
                }}
                isSelected={selectedTemplate === template.name}
                expanded={expandedTemplate === template.name}
                expandedContent={
                  templateRequiresMedia(template) ? (
                    <MediaUploadPanel
                      onUpload={(file) =>
                        handleUploadForTemplate(template, file)
                      }
                      isUploading={uploadingTemplate === template.name}
                      error={uploadErrors[template.name]}
                    />
                  ) : null
                }
                uploadedImageUrl={getUploadedImageUrlForTemplate(template.name)}
                showUploadButton={showUploadButton}
                uploadLabel={
                  requiresMedia && hasUploadedImage
                    ? "Replace Media"
                    : "Upload Media"
                }
                broadcastDisabled={broadcastDisabled}
                uploadDisabled={uploadDisabled}
                createdAt={uploadedData?.createdAt}
              />
            );
          })}
        </div>
      )}

      <ConfirmActionModal
        isOpen={Boolean(deleteTarget)}
        title="Delete template?"
        message={deleteMessage}
        confirmText="Delete"
        cancelText="Cancel"
        isLoading={isDeleting}
        onCancel={() => {
          if (isDeleting) return;
          setDeleteTarget(null);
          setDeleteError(null);
        }}
        onConfirm={async () => {
          if (!deleteTarget) return;
          setIsDeleting(true);
          setDeleteError(null);
          const result = await dispatch(
            deleteTemplateThunk({
              accessToken,
              wabaId,
              templateName: deleteTarget.name,
              hsmId: deleteTarget.id ? String(deleteTarget.id) : undefined,
              apiVersion,
              strapiSelectionId:
                templateSelectionMap[deleteTarget.name]?.selectionId,
              // Find and delete Strapi entry by templateId when selectionId is missing (e.g. after refresh)
              templateId: deleteTarget.id ? String(deleteTarget.id) : undefined,
            }),
          );
          if (deleteTemplateThunk.rejected.match(result)) {
            setDeleteError(result.payload || "Failed to delete template.");
            setIsDeleting(false);
            return;
          }
          // Refresh list to ensure UI matches Meta state.
          await dispatch(fetchTemplates({ accessToken, wabaId, apiVersion }));
          setIsDeleting(false);
          setDeleteTarget(null);
        }}
      />

      <ConfirmActionModal
        isOpen={bulkDeleteTargets !== null && bulkDeleteTargets.length > 0}
        title="Delete multiple templates?"
        message={bulkDeleteMessage}
        confirmText={`Delete ${bulkDeleteTargets?.length ?? 0} template${(bulkDeleteTargets?.length ?? 0) === 1 ? "" : "s"}`}
        cancelText="Cancel"
        isLoading={isBulkDeleting}
        loadingText={
          bulkProgress.total > 0 && isBulkDeleting
            ? `Deleting (${bulkProgress.currentIndex + 1}/${bulkProgress.total})...`
            : "Deleting..."
        }
        onCancel={() => {
          if (!isBulkDeleting) {
            setBulkDeleteTargets(null);
            resetBulkProgress();
          }
        }}
        onConfirm={handleBulkDeleteConfirm}
      />
    </div>
  );
};

export default TemplateSelectionPage;
