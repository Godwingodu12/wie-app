import DiarySettingsModel, {
  IDiarySettings,
} from "../models/diary-settings.model";

/** Returns existing settings or creates defaults on first call */
export const getDiarySettings = async (
  userId: string,
): Promise<IDiarySettings> => {
  let settings = await DiarySettingsModel.findOne({ userId });
  if (!settings) {
    settings = await DiarySettingsModel.create({
      userId,
      defaultVisibility: "followers",
      allowComments: true,
      allowReactions: true,
      allowSharing: true,
      showFluxCount: true,
      autoArchive: true,
    });
  }
  return settings;
};

export const updateDiarySettings = async (
  userId: string,
  updates: Partial<IDiarySettings>,
): Promise<IDiarySettings> => {
  const settings = await DiarySettingsModel.findOneAndUpdate(
    { userId },
    { $set: updates },
    { new: true, upsert: true, runValidators: true },
  );
  return settings!;
};
