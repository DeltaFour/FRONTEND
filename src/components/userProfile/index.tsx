import { useEffect, useRef, useState } from "react";
import {
  Avatar,
  Box,
  DialogBackdrop,
  DialogContent,
  DialogPositioner,
  DialogRoot,
  IconButton,
  Menu,
  Portal,
} from "@chakra-ui/react";
import { Camera, LogOut, Trash2, User } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useColorModeValue } from "../../theme/colorMode";
import { toaster } from "../ui/toaster";

// Dark/Light mode colors
const COLORS = {
  menuBg: { light: "rgba(255,255,255,0.97)", dark: "rgba(24,24,27,0.97)" },
  menuBorder: { light: "rgba(0,0,0,0.07)", dark: "rgba(255,255,255,0.07)" },
  menuShadow: "0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)",
  dialogBg: { light: "white", dark: "rgb(24,24,27)" },
  dialogBorder: { light: "rgba(0,0,0,0.06)", dark: "rgba(255,255,255,0.07)" },
  textPrimary: { light: "#111827", dark: "#f3f4f6" },
  textSecondary: { light: "#6b7280", dark: "#9ca3af" },
  textTertiary: { light: "#9ca3af", dark: "#6b7280" },
  menuItemBg: { light: "rgba(0,0,0,0.04)", dark: "rgba(255,255,255,0.08)" },
  menuItemText: { light: "#374151", dark: "#e5e7eb" },
  dangerHover: { light: "#fef2f2", dark: "rgba(239,68,68,0.1)" },
  uploadZoneBorder: { light: "#e5e7eb", dark: "#374151" },
  uploadZoneHoverBorder: { light: "#a78bfa", dark: "#c4b5fd" },
  uploadZoneHoverBg: { light: "#faf5ff", dark: "rgba(139,92,246,0.1)" },
  buttonCancelBg: { light: "#f3f4f6", dark: "#3f3f46" },
  buttonCancelText: { light: "#374151", dark: "#e5e7eb" },
  buttonCancelHover: { light: "#e5e7eb", dark: "#52525b" },
  badge: { light: "#f3f4f6", dark: "#3f3f46" },
  badgeText: { light: "#374151", dark: "#e5e7eb" },
  separator: { light: "rgba(0,0,0,0.06)", dark: "rgba(255,255,255,0.08)" },
};

const AVATAR_STORAGE_KEY = "deltafour.user.avatar";

export default function UserProfileMenu() {
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [draftAvatar, setDraftAvatar] = useState<string | null>(null);
  const [draftFileName, setDraftFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Dark/Light mode colors
  const menuBg = useColorModeValue(COLORS.menuBg.light, COLORS.menuBg.dark);
  const menuBorder = useColorModeValue(
    COLORS.menuBorder.light,
    COLORS.menuBorder.dark,
  );
  const dialogBg = useColorModeValue(
    COLORS.dialogBg.light,
    COLORS.dialogBg.dark,
  );
  const dialogBorder = useColorModeValue(
    COLORS.dialogBorder.light,
    COLORS.dialogBorder.dark,
  );
  const textPrimary = useColorModeValue(
    COLORS.textPrimary.light,
    COLORS.textPrimary.dark,
  );
  const textSecondary = useColorModeValue(
    COLORS.textSecondary.light,
    COLORS.textSecondary.dark,
  );
  const textTertiary = useColorModeValue(
    COLORS.textTertiary.light,
    COLORS.textTertiary.dark,
  );
  const menuItemText = useColorModeValue(
    COLORS.menuItemText.light,
    COLORS.menuItemText.dark,
  );
  const dangerHover = useColorModeValue(
    COLORS.dangerHover.light,
    COLORS.dangerHover.dark,
  );
  const uploadZoneBorder = useColorModeValue(
    COLORS.uploadZoneBorder.light,
    COLORS.uploadZoneBorder.dark,
  );
  const uploadZoneHoverBorder = useColorModeValue(
    COLORS.uploadZoneHoverBorder.light,
    COLORS.uploadZoneHoverBorder.dark,
  );
  const uploadZoneHoverBg = useColorModeValue(
    COLORS.uploadZoneHoverBg.light,
    COLORS.uploadZoneHoverBg.dark,
  );
  const buttonCancelBg = useColorModeValue(
    COLORS.buttonCancelBg.light,
    COLORS.buttonCancelBg.dark,
  );
  const buttonCancelText = useColorModeValue(
    COLORS.buttonCancelText.light,
    COLORS.buttonCancelText.dark,
  );
  const buttonCancelHover = useColorModeValue(
    COLORS.buttonCancelHover.light,
    COLORS.buttonCancelHover.dark,
  );
  const badgeBg = useColorModeValue(COLORS.badge.light, COLORS.badge.dark);
  const badgeText = useColorModeValue(
    COLORS.badgeText.light,
    COLORS.badgeText.dark,
  );
  const separator = useColorModeValue(
    COLORS.separator.light,
    COLORS.separator.dark,
  );

  useEffect(() => {
    const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (storedAvatar) setAvatarSrc(storedAvatar);
  }, []);

  const handleLogout = async () => {
    await logout();
  };

  const handleOpenModal = () => {
    setDraftAvatar(avatarSrc);
    setDraftFileName(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => setIsModalOpen(false);

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toaster.error({
        title: "Arquivo inválido",
        description: "Selecione uma imagem válida.",
      });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toaster.error({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 2MB.",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setDraftAvatar(String(reader.result ?? ""));
      setDraftFileName(file.name);
    };
    reader.onerror = () => toaster.error({ title: "Erro ao carregar imagem" });
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftAvatar(null);
    setDraftFileName(null);
  };

  const handleSaveAvatar = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    if (draftAvatar) {
      localStorage.setItem(AVATAR_STORAGE_KEY, draftAvatar);
    } else {
      localStorage.removeItem(AVATAR_STORAGE_KEY);
    }
    setAvatarSrc(draftAvatar);
    setIsSaving(false);
    setIsModalOpen(false);
    toaster.success({ title: "Perfil atualizado!" });
  };

  const displayName = user?.name || "Usuário";
  const displayEmail = user?.email || "sem@email.com";

  return (
    <Box>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

        .pf-root * { font-family: 'DM Sans', sans-serif; }

        /* ── Trigger button ── */
        .pf-trigger {
          position: relative;
          cursor: pointer;
          border-radius: 50%;
          padding: 2px;
          background: transparent;
          transition: transform 0.2s ease;
        }
        .pf-trigger:hover { transform: scale(1.06); }
        .pf-trigger::after {
          content: '';
          position: absolute;
          bottom: 1px; right: 1px;
          width: 9px; height: 9px;
          border-radius: 50%;
          background: #22c55e;
          border: 2px solid white;
        }

        /* ── Menu ── */
        .pf-menu {
          backdrop-filter: blur(16px);
          border-radius: 14px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06);
          padding: 6px;
          min-width: 220px;
          animation: pf-fadeIn 0.15s ease;
        }
        @keyframes pf-fadeIn {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .pf-menu-header {
          padding: 10px 12px 8px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .pf-menu-name { font-weight: 600; font-size: 13.5px; line-height: 1.3; }
        .pf-menu-email { font-size: 11.5px; }

        .pf-sep {
          height: 1px;
          margin: 4px 0;
        }

        .pf-menu-item {
          display: flex;
          align-items: center;
          gap: 9px;
          padding: 8px 10px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 450;
          transition: background 0.12s ease, color 0.12s ease;
          user-select: none;
        }
        .pf-menu-item:hover { }
        .pf-menu-item.danger { color: #ef4444; }
        .pf-menu-item.danger:hover { }

        /* ── Dialog ── */
        .pf-dialog {
          font-family: 'DM Sans', sans-serif;
          border-radius: 20px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.14), 0 4px 16px rgba(0,0,0,0.07);
          max-width: 460px;
          width: calc(100vw - 32px);
          overflow: hidden;
          animation: pf-dialogIn 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        @keyframes pf-dialogIn {
          from { opacity: 0; transform: scale(0.93) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Avatar upload zone */
        .pf-upload-zone {
          border: 2px dashed;
          border-radius: 16px;
          padding: 28px 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: border-color 0.18s ease, background 0.18s ease;
          position: relative;
        }
        .pf-upload-zone:hover, .pf-upload-zone.dragging {
        }

        .pf-avatar-edit {
          position: relative;
          width: 88px;
          height: 88px;
          flex-shrink: 0;
        }
        .pf-avatar-edit .pf-cam-btn {
          position: absolute;
          bottom: 0; right: 0;
          width: 26px; height: 26px;
          border-radius: 50%;
          background: #7c3aed;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(124,58,237,0.35);
          transition: transform 0.15s ease, background 0.15s ease;
        }
        .pf-avatar-edit:hover .pf-cam-btn { transform: scale(1.1); background: #6d28d9; }

        .pf-info-box {
          flex: 1;
        }
        .pf-info-name {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: -0.01em;
        }
        .pf-info-email {
          font-size: 12.5px;
          margin-top: 2px;
        }
        .pf-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 500;
          padding: 3px 8px;
          margin-top: 6px;
          letter-spacing: 0.01em;
        }
        .pf-file-hint {
          font-size: 11.5px;
          margin-top: 4px;
        }

        /* Remove btn */
        .pf-remove-btn {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #ef4444;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          border: none;
          background: transparent;
          transition: background 0.12s ease;
          margin-top: 2px;
        }
        .pf-remove-btn:hover { }

        /* Buttons */
        .pf-btn-cancel {
          border: none;
          border-radius: 10px;
          padding: 8px 20px;
          font-size: 13.5px;
          font-weight: 500;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        .pf-btn-cancel:hover { }

        .pf-btn-save {
          background: linear-gradient(135deg, #7c3aed, #5b21b6);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 8px 24px;
          font-size: 13.5px;
          font-weight: 600;
          font-family: 'DM Sans', sans-serif;
          cursor: pointer;
          transition: opacity 0.15s ease, transform 0.12s ease;
          box-shadow: 0 4px 12px rgba(124,58,237,0.3);
          display: flex;
          align-items: center;
          gap: 6px;
          min-width: 110px;
          justify-content: center;
        }
        .pf-btn-save:hover:not(:disabled) { opacity: 0.9; transform: translateY(-1px); }
        .pf-btn-save:disabled { opacity: 0.7; cursor: not-allowed; }

        @keyframes pf-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        .pf-spinner {
          width: 13px; height: 13px;
          border: 2px solid rgba(255,255,255,0.35);
          border-top-color: white;
          border-radius: 50%;
          animation: pf-spin 0.7s linear infinite;
        }
      `}</style>

      {/* ── Trigger ── */}
      <Menu.Root>
        <Menu.Trigger asChild>
          <IconButton
            variant="ghost"
            aria-label="Abrir menu do usuário"
            className="pf-root"
          >
            <div className="pf-trigger">
              <Avatar.Root size="sm">
                {avatarSrc && (
                  <Avatar.Image src={avatarSrc} alt={displayName} />
                )}
                <Avatar.Fallback name={displayName} />
              </Avatar.Root>
            </div>
          </IconButton>
        </Menu.Trigger>

        <Menu.Positioner>
          <Menu.Content asChild>
            <div
              className="pf-menu pf-root"
              style={{
                background: menuBg,
                border: `1px solid ${menuBorder}`,
              }}
            >
              {/* Header */}
              <div className="pf-menu-header">
                <Avatar.Root size="md">
                  {avatarSrc && (
                    <Avatar.Image src={avatarSrc} alt={displayName} />
                  )}
                  <Avatar.Fallback name={displayName} />
                </Avatar.Root>
                <div>
                  <div className="pf-menu-name" style={{ color: textPrimary }}>
                    {displayName}
                  </div>
                  <div
                    className="pf-menu-email"
                    style={{ color: textSecondary }}
                  >
                    {displayEmail}
                  </div>
                </div>
              </div>

              <div className="pf-sep" style={{ background: separator }} />

              <div
                className="pf-menu-item"
                onClick={handleOpenModal}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleOpenModal();
                  }
                }}
                role="button"
                tabIndex={0}
                style={{
                  color: menuItemText,
                }}
              >
                <User size={14} />
                Editar perfil
              </div>

              <div className="pf-sep" style={{ background: separator }} />

              <div
                className="pf-menu-item danger"
                onClick={handleLogout}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleLogout();
                  }
                }}
                role="button"
                tabIndex={0}
                style={{
                  color: "#ef4444",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = dangerHover;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <LogOut size={14} />
                Sair da conta
              </div>
            </div>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>

      {/* ── Dialog ── */}
      <DialogRoot
        open={isModalOpen}
        onOpenChange={(d) => {
          if (!d.open) handleCloseModal();
        }}
        placement="center"
      >
        <Portal>
          <DialogBackdrop
            style={{
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
            }}
          />
          <DialogPositioner>
            <DialogContent asChild>
              <div
                className="pf-dialog pf-root"
                style={{
                  background: dialogBg,
                  border: `1px solid ${dialogBorder}`,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: "22px 24px 0",
                    borderBottom: `1px solid ${separator}`,
                  }}
                >
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 600,
                      color: textPrimary,
                      marginBottom: "16px",
                    }}
                  >
                    Editar perfil
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: "20px 24px" }}>
                  {/* Avatar + info row */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "16px",
                      marginBottom: "18px",
                    }}
                  >
                    <div
                      className="pf-avatar-edit"
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          fileInputRef.current?.click();
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <Avatar.Root w="88px" h="88px" borderRadius="full">
                        {draftAvatar && (
                          <Avatar.Image src={draftAvatar} alt={displayName} />
                        )}
                        <Avatar.Fallback
                          name={displayName}
                          style={{
                            background:
                              "linear-gradient(135deg, #7c3aed, #5b21b6)",
                            color: "white",
                            fontSize: "24px",
                            fontWeight: 600,
                          }}
                        />
                      </Avatar.Root>
                      <div className="pf-cam-btn">
                        <Camera size={12} color="white" strokeWidth={2.5} />
                      </div>
                    </div>

                    <div className="pf-info-box">
                      <div
                        className="pf-info-name"
                        style={{ color: textPrimary }}
                      >
                        {displayName}
                      </div>
                      <div
                        className="pf-info-email"
                        style={{ color: textSecondary }}
                      >
                        {displayEmail}
                      </div>
                      <div
                        className="pf-badge"
                        style={{
                          background: badgeBg,
                          color: badgeText,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#22c55e",
                            display: "inline-block",
                          }}
                        />
                        Conta ativa
                      </div>
                      {draftFileName && (
                        <div
                          className="pf-file-hint"
                          style={{ color: textTertiary }}
                        >
                          📎 {draftFileName}
                        </div>
                      )}
                      {draftAvatar && (
                        <button
                          type="button"
                          className="pf-remove-btn"
                          onClick={handleRemoveAvatar}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background =
                              "rgba(239, 68, 68, 0.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <Trash2 size={11} /> Remover foto
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Drop zone */}
                  <div
                    className={`pf-upload-zone${isDragging ? " dragging" : ""}`}
                    onClick={() => fileInputRef.current?.click()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        fileInputRef.current?.click();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    style={{
                      borderColor: isDragging
                        ? uploadZoneHoverBorder
                        : uploadZoneBorder,
                      background: isDragging
                        ? uploadZoneHoverBg
                        : "transparent",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = uploadZoneHoverBorder;
                      e.currentTarget.style.background = uploadZoneHoverBg;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = uploadZoneBorder;
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <Camera size={20} color={textTertiary} />
                    <div style={{ textAlign: "center" }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: 500,
                          color: menuItemText,
                        }}
                      >
                        Clique ou arraste uma imagem
                      </div>
                      <div
                        style={{
                          fontSize: "11.5px",
                          color: textTertiary,
                          marginTop: "2px",
                        }}
                      >
                        PNG, JPG, WEBP · máx. 2 MB
                      </div>
                    </div>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding: "14px 24px 20px",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: "10px",
                    borderTop: `1px solid ${separator}`,
                  }}
                >
                  <button
                    type="button"
                    className="pf-btn-cancel"
                    onClick={handleCloseModal}
                    style={{
                      background: buttonCancelBg,
                      color: buttonCancelText,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = buttonCancelHover;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = buttonCancelBg;
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="pf-btn-save"
                    onClick={handleSaveAvatar}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="pf-spinner" /> Salvando…
                      </>
                    ) : (
                      "Salvar alterações"
                    )}
                  </button>
                </div>
              </div>
            </DialogContent>
          </DialogPositioner>
        </Portal>
      </DialogRoot>
    </Box>
  );
}
