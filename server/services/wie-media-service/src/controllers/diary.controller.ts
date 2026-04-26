import { Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import * as diaryService from "../services/diary.service";
import * as diarySettingsService from "../services/diary-settings.service";

export const createDiary = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { title, visibility, fluxIds } = req.body;
    if (!title) {
      res.status(400).json({ success: false, message: "Title is required" });
      return;
    }

    // fluxIds can come as JSON string or array
    let parsedFluxIds: string[] | undefined;
    if (fluxIds) {
      try {
        parsedFluxIds =
          typeof fluxIds === "string" ? JSON.parse(fluxIds) : fluxIds;
      } catch {
        parsedFluxIds = Array.isArray(fluxIds) ? fluxIds : [fluxIds];
      }
    }

    const diary = await diaryService.createDiary(
      req.userId!,
      title,
      visibility,
      req.file,
      parsedFluxIds,
    );
    res.status(201).json({ success: true, data: diary });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUserDiaries = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { userId } = req.params;
    const diaries = await diaryService.getUserDiaries(req.userId!, userId);
    res.json({ success: true, data: diaries });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDiaryById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { diaryId } = req.params;
    const diary = await diaryService.getDiaryById(diaryId, req.userId!);
    if (!diary) {
      res
        .status(404)
        .json({ success: false, message: "Diary not found or access denied" });
      return;
    }
    res.json({ success: true, data: diary });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const addFluxToDiary = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { diaryId } = req.params;
    const { fluxId } = req.body;
    const diary = await diaryService.addFluxToDiary(
      diaryId,
      fluxId,
      req.userId!,
    );
    res.json({ success: true, data: diary });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const removeFluxFromDiary = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { diaryId, fluxId } = req.params;
    const diary = await diaryService.removeFluxFromDiary(
      diaryId,
      fluxId,
      req.userId!,
    );
    res.json({ success: true, data: diary });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const editDiary = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { diaryId } = req.params;
    const { title, visibility } = req.body;
    const diary = await diaryService.editDiary(
      diaryId,
      req.userId!,
      { title, visibility },
      req.file,
    );
    res.json({ success: true, data: diary });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteDiary = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { diaryId } = req.params;
    await diaryService.deleteDiary(diaryId, req.userId!);
    res.json({ success: true, message: "Diary deleted" });
  } catch (error: any) {
    res.status(403).json({ success: false, message: error.message });
  }
};
// POST /api/diary/highlight
export const highlightFlux = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { fluxId, diaryId, newDiaryTitle } = req.body;
    if (!fluxId) {
      res.status(400).json({ success: false, message: "fluxId is required" });
      return;
    }
    const result = await diaryService.highlightFlux(
      req.userId!,
      fluxId,
      diaryId,
      newDiaryTitle,
    );
    const status = result.action === "created" ? 201 : 200;
    res.status(status).json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
// ── PATCH /api/diary/:diaryId/reorder — reorder fluxes inside a diary
export const reorderDiaryFluxes = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { diaryId } = req.params;
    const { orderedFluxIds } = req.body;

    if (!Array.isArray(orderedFluxIds)) {
      res
        .status(400)
        .json({ success: false, message: "orderedFluxIds must be an array" });
      return;
    }
    const diary = await diaryService.reorderDiaryFluxes(
      diaryId,
      req.userId!,
      orderedFluxIds,
    );
    res.json({ success: true, data: diary });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── PATCH /api/diary/:diaryId/pin — toggle pin on a diary
export const togglePinDiary = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { diaryId } = req.params;
    const diary = await diaryService.togglePinDiary(diaryId, req.userId!);
    res.json({ success: true, data: diary, isPinned: diary.isPinned });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ── GET /api/diary/settings
export const getDiarySettings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const settings = await diarySettingsService.getDiarySettings(req.userId!);
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── PATCH /api/diary/settings
export const updateDiarySettings = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const settings = await diarySettingsService.updateDiarySettings(
      req.userId!,
      req.body,
    );
    res.json({ success: true, data: settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
