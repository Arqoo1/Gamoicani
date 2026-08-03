import { useCallback, useState } from "react";

export function useProfileActions() {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [actionSheet, setActionSheet] = useState<"none" | "cover" | "avatar">("none");

  const handleCoverTap = useCallback(() => setActionSheet("cover"), []);
  const handleAvatarTap = useCallback(() => setActionSheet("avatar"), []);
  const hideActionSheet = useCallback(() => setActionSheet("none"), []);
  const hidePickers = useCallback(() => {
    setShowColorPicker(false);
    setShowCoverPicker(false);
  }, []);

  return {
    actionSheet,
    handleAvatarTap,
    handleCoverTap,
    hideActionSheet,
    hidePickers,
    setShowColorPicker,
    setShowCoverPicker,
    showColorPicker,
    showCoverPicker,
  };
}
