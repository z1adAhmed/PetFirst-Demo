import React, { useEffect, useCallback, useRef } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useSearchParams,
} from "react-router-dom";
import { useAppDispatch, useAppSelector } from "./store/hooks";
import {
  setAttachmentId,
  setCarouselAttachmentIds,
  setConfig,
  setSelectedTemplate,
  resetConfig,
  persistConfig,
} from "./store/slices/configSlice";
import {
  setCsvData,
  resetBroadcast,
  setIsBroadcasting,
} from "./store/slices/broadcastSlice";
import { showModal, closeModal } from "./store/slices/uiSlice";
import {
  uploadBroadcastAnalytic,
  executeTestBroadcast,
} from "./store/thunks/broadcastThunks";
import { fetchTemplateIfNeeded } from "./store/thunks/configThunks";
import Modal from "./components/modal/Modal";
import TemplateSelectionPage from "./pages/templates/TemplateSelectionPage";
import HomePage from "./pages/home/HomePage";
import CreateTemplatePage from "./pages/templates/CreateTemplatePage";
import UploadPage from "./pages/upload/UploadPage";
import BroadcastDetailsPage from "./pages/broadcast/BroadcastDetailsPage";
import { CSVData } from "./types";
import { formatFailureDetails } from "./utils/common";
import { buildWhatsAppPayload } from "./utils/payloadBuilder";
import RequireAuth from "./components/auth/RequireAuth";
import AppShell from "./components/layout/AppShell";
import LoginPage from "./pages/auth/LoginPage";

const metaEnv = {
  accessToken: import.meta.env.VITE_META_ACCESS_TOKEN || "",
  phoneNumberId: import.meta.env.VITE_META_PHONE_NUMBER_ID || "",
  wabaId: import.meta.env.VITE_META_WABA_ID || "",
  apiVersion: import.meta.env.VITE_META_API_VERSION || "v22.0",
};

const AUTH_SESSION_KEY = "pf_session_authed";

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [isAuthed, setIsAuthed] = React.useState(() => {
    return sessionStorage.getItem(AUTH_SESSION_KEY) === "1";
  });

  const { config, selectedTemplate, attachmentId, carouselAttachmentIds } =
    useAppSelector((state) => state.config);
  const templateSelectionMap = useAppSelector(
    (state) => state.templates.templateSelectionMap,
  );

  const { csvData, isBroadcasting, isTestBroadcasting, results } =
    useAppSelector((state) => state.broadcast);
  const { modal } = useAppSelector((state) => state.ui);
  const modalConfirmRef = useRef<(() => void) | undefined>(undefined);

  // Prevent accidental tab close/refresh while sending
  useEffect(() => {
    const shouldBlock = isBroadcasting || isTestBroadcasting;
    if (!shouldBlock) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Chrome requires returnValue to be set.
      e.returnValue = "";
      return "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isBroadcasting, isTestBroadcasting]);

  // If session storage is cleared (new browser session), force auth again.
  useEffect(() => {
    const handleVisibility = () => {
      const authed = sessionStorage.getItem(AUTH_SESSION_KEY) === "1";
      if (!authed && isAuthed) setIsAuthed(false);
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [isAuthed]);

  // Handle attachmentId from query params
  useEffect(() => {
    const queryAttachmentId = searchParams.get("attachmentId");
    if (queryAttachmentId && queryAttachmentId !== attachmentId) {
      dispatch(setAttachmentId(queryAttachmentId));
    } else if (!queryAttachmentId && attachmentId) {
      dispatch(setAttachmentId(null));
    }
  }, [searchParams, attachmentId, dispatch]);

  // Load template if needed when on upload page
  useEffect(() => {
    const isUploadPage =
      location.pathname === "/upload" ||
      location.pathname.startsWith("/upload");
    if (isUploadPage && config.templateName && !selectedTemplate) {
      dispatch(fetchTemplateIfNeeded({ templateName: config.templateName }));
    }
  }, [location.pathname, config.templateName, selectedTemplate, dispatch]);

  // Persist config to localStorage when it changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      dispatch(persistConfig());
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [config.templateName, config.languageCode, selectedTemplate, dispatch]);

  // Reset broadcast data on navigation
  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "/templates") {
      dispatch(resetBroadcast());
    }
  }, [location.pathname, dispatch]);

  const handleSelectTemplate = (
    template: any,
    attachmentId?: string,
    carouselAttachmentIds?: string[],
  ) => {
    const templateWithMap = {
      ...template,
      variableIndexMap:
        templateSelectionMap[template.name]?.templateVariables ||
        template.variableIndexMap,
      couponCode:
        templateSelectionMap[template.name]?.couponCode || template.couponCode,
    };
    dispatch(setSelectedTemplate(templateWithMap));
    if (carouselAttachmentIds?.length) {
      dispatch(setCarouselAttachmentIds(carouselAttachmentIds));
      dispatch(
        setAttachmentId(carouselAttachmentIds[0] ?? attachmentId ?? null),
      );
    } else {
      dispatch(setCarouselAttachmentIds(null));
      dispatch(setAttachmentId(attachmentId ?? null));
    }
    const headerFormat = template.components?.find(
      (c: any) => c.type === "HEADER",
    )?.format;
    if (headerFormat === "DOCUMENT") {
      const docName =
        templateSelectionMap[template.name]?.templateAttachmentFileName;
      dispatch(setConfig({ documentFilename: docName ?? undefined }));
    }
    const searchParams = new URLSearchParams();
    if (attachmentId || carouselAttachmentIds?.[0]) {
      searchParams.set(
        "attachmentId",
        attachmentId || carouselAttachmentIds?.[0] || "",
      );
    }
    navigate(`/upload?${searchParams.toString()}`);
  };

  const handleDataLoaded = useCallback(
    (data: CSVData | null, _file?: File | null) => {
      dispatch(setCsvData(data));
    },
    [dispatch],
  );

  const handleBackFromUpload = () => {
    dispatch(resetBroadcast());
    navigate("/templates");
  };

  const startBroadcast = async (
    file: File | null,
    retryOptions?: {
      enableRetry: boolean;
      firstRetryInHours: number;
      retryCount: number;
    },
  ) => {
    if (isBroadcasting || isTestBroadcasting) {
      return;
    }
    if (!file) {
      modalConfirmRef.current = undefined;
      dispatch(
        showModal({
          title: "Contacts file required",
          message:
            "Upload Excel file with recipients before starting the broadcast.",
          type: "warning",
        }),
      );
      return;
    }
    if (!csvData || csvData.rows.length === 0) {
      modalConfirmRef.current = undefined;
      dispatch(
        showModal({
          title: "Contacts file required",
          message:
            "Upload Excel file with recipients before starting the broadcast.",
          type: "warning",
        }),
      );
      return;
    }

    if (!selectedTemplate) {
      modalConfirmRef.current = undefined;
      dispatch(
        showModal({
          title: "Template required",
          message: "Select a template before sending a broadcast.",
          type: "warning",
        }),
      );
      return;
    }

    const fullConfig = {
      ...config,
      template: selectedTemplate,
      attachmentId: attachmentId ?? config.attachmentId ?? undefined,
      carouselAttachmentIds:
        carouselAttachmentIds ?? config.carouselAttachmentIds ?? undefined,
      documentFilename:
        config.documentFilename ??
        templateSelectionMap[selectedTemplate.name]?.templateAttachmentFileName ??
        undefined,
    };
    const dummyContact = { name: "", phone: "0" };
    const messagePayload = buildWhatsAppPayload(
      dummyContact,
      fullConfig,
      selectedTemplate,
      { useVariablePlaceholders: true },
    );

    const campaignName =
      csvData.fileName?.replace(/\.[^.]+$/, "") || "Broadcast";
    const templateName = selectedTemplate.name;
    const usersCount = csvData.rows.length;

    modalConfirmRef.current = async () => {
      dispatch(closeModal());
      dispatch(setIsBroadcasting(true));
      const result = await dispatch(
        uploadBroadcastAnalytic({
          file,
          template: messagePayload,
          campaignName,
          templateName,
          usersCount,
          firstRetryInHours:
            retryOptions?.enableRetry === true
              ? retryOptions.firstRetryInHours
              : undefined,
          retryCount:
            retryOptions?.enableRetry === true
              ? retryOptions.retryCount
              : undefined,
        }),
      );
      dispatch(setIsBroadcasting(false));

      if (uploadBroadcastAnalytic.fulfilled.match(result)) {
        modalConfirmRef.current = () => {
          dispatch(closeModal());
          dispatch(resetConfig());
          dispatch(resetBroadcast());
          navigate("/");
        };
        dispatch(
          showModal({
            title: "Broadcast uploaded",
            message:
              result.payload?.message ||
              "Your broadcast file and template have been sent to the backend. The broadcast will be processed there.",
            type: "success",
            confirmText: "OK",
          }),
        );
      } else {
        const errorMsg = result.payload ?? "Upload failed. Please try again.";
        dispatch(
          showModal({
            title: "Upload failed",
            message: errorMsg,
            type: "warning",
            confirmText: "OK",
          }),
        );
      }
    };
    dispatch(
      showModal({
        title: "Confirm broadcast",
        message: `You're about to send this broadcast to ${csvData.rows.length} recipient${csvData.rows.length === 1 ? "" : "s"} using the template "${selectedTemplate.name}". Do you want to continue?`,
        type: "confirm",
        confirmText: "Yes, Send",
        cancelText: "Cancel",
      }),
    );
  };

  const startTestBroadcast = async (numbers: string[]) => {
    if (isBroadcasting || isTestBroadcasting) {
      return;
    }
    if (!numbers.length) return;
    if (!selectedTemplate) {
      modalConfirmRef.current = undefined;
      dispatch(
        showModal({
          title: "Template Required",
          message: "Please select a template first.",
          type: "warning",
        }),
      );
      return;
    }

    const result = await dispatch(executeTestBroadcast({ numbers }));
    if (executeTestBroadcast.fulfilled.match(result)) {
      modalConfirmRef.current = undefined;
      const failureDetails = formatFailureDetails(result.payload);
      dispatch(
        showModal({
          title: "Test complete",
          message: `Delivered: ${result.payload.successCount}\nFailed: ${result.payload.failedCount}\nTotal recipients: ${numbers.length}${failureDetails}`,
          type: "success",
        }),
      );
    }
  };

  const handleLogin = () => {
    sessionStorage.setItem(AUTH_SESSION_KEY, "1");
    setIsAuthed(true);
  };

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthed ? (
              <Navigate to="/" replace />
            ) : (
              <LoginPage onLogin={handleLogin} />
            )
          }
        />

        <Route element={<RequireAuth isAuthed={isAuthed} />}>
          <Route element={<AppShell />}>
            <Route
              path="/"
              element={
                <HomePage
                  accessToken={config.accessToken}
                  wabaId={config.wabaId}
                />
              }
            />

            <Route
              path="/templates"
              element={
                <TemplateSelectionPage
                  accessToken={config.accessToken}
                  phoneNumberId={config.phoneNumberId}
                  wabaId={config.wabaId}
                  apiVersion={metaEnv.apiVersion}
                  onSelectTemplate={handleSelectTemplate}
                  selectedTemplate={config.templateName}
                />
              }
            />

            <Route path="/templates/new" element={<CreateTemplatePage />} />

            <Route
              path="/upload"
              element={
                <UploadPage
                  template={selectedTemplate}
                  templateName={config.templateName}
                  csvData={csvData}
                  onDataLoaded={handleDataLoaded}
                  onBack={handleBackFromUpload}
                  onStartBroadcast={startBroadcast}
                  onTestBroadcast={startTestBroadcast}
                  results={results}
                  isBroadcasting={isBroadcasting}
                  isTestBroadcasting={isTestBroadcasting}
                />
              }
            />

            <Route path="/broadcasts/:id" element={<BroadcastDetailsPage />} />
          </Route>
        </Route>

        <Route
          path="*"
          element={<Navigate to={isAuthed ? "/" : "/login"} replace />}
        />
      </Routes>

      <Modal
        isOpen={modal.isOpen}
        onClose={() => {
          modalConfirmRef.current = undefined;
          dispatch(closeModal());
        }}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={() => {
          if (modalConfirmRef.current) {
            modalConfirmRef.current();
            return;
          }
          dispatch(closeModal());
        }}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
      />
    </>
  );
};

export default App;
