import { useMutation } from "@tanstack/react-query";

import { useAuth } from "@/application/providers/auth";
import { AuthUser } from "@/entities/user/types";
import { updateMyProfile } from "@/features/auth/api/authApi";
import {
  uploadCoverPhoto as apiUploadCoverPhoto,
  uploadProfilePhoto as apiUploadProfilePhoto,
} from "@/features/profile/api/profileApi";
import { equipItem, unequipItem } from "@/features/shop/api/shopApi";
import { SHOP_ITEMS_META } from "@/features/profile/model/profileMeta";

export function useUploadProfilePhoto() {
  const { setSessionUser } = useAuth();

  return useMutation({
    mutationFn: apiUploadProfilePhoto,
    onSuccess: (response) => {
      setSessionUser(response.user);
    },
  });
}

export function useUploadCoverPhoto() {
  const { setSessionUser } = useAuth();

  return useMutation({
    mutationFn: apiUploadCoverPhoto,
    onSuccess: (response) => {
      setSessionUser(response.user);
    },
  });
}

export function useUpdateProfile() {
  const { setSessionUser } = useAuth();

  return useMutation({
    mutationFn: updateMyProfile,
    onSuccess: (response) => {
      setSessionUser(response.user);
    },
  });
}

export function useEquipShopItem() {
  const { setSessionUser, user } = useAuth();
  const updateProfile = useUpdateProfile();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const category = SHOP_ITEMS_META[itemId]?.category;
      const result = await equipItem(itemId);

      if (category === "avatar") {
        await updateProfile.mutateAsync({ profilePhotoUrl: null });
      }
      if (category === "banner") {
        await updateProfile.mutateAsync({ coverPhotoUrl: null });
      }

      return { category, result };
    },
    onSuccess: ({ result }) => {
      if (!user) return;

      const nextUser: AuthUser = {
        ...user,
        equippedItems: result.equippedItems,
      };

      setSessionUser(nextUser);
    },
  });
}

export function useUnequipShopItem() {
  const { setSessionUser, user } = useAuth();

  return useMutation({
    mutationFn: unequipItem,
    onSuccess: (result) => {
      if (!user) return;
      setSessionUser({ ...user, equippedItems: result.equippedItems });
    },
  });
}
