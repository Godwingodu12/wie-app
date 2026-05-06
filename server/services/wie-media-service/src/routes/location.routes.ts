import express from "express";
import { authenticate } from "../middlewares/auth";
import {
  locationSearch,
  locationDetails,
  locationReverse,
} from "../controllers/location.controller";
const router: express.Router = express.Router();
// GET /api/location/search?q=kochi&session=uuid
router.get("/search", authenticate, locationSearch);

// GET /api/location/details/:placeId
router.get("/details/:placeId", authenticate, locationDetails);
// GET /api/location/reverse?lat=10.85&lng=76.27
router.get("/reverse", authenticate, locationReverse);
export default router;
