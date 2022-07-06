import { CameraRole, CameraStatus } from "@prisma/client";

export interface Status {
    status: CameraStatus,
    cameraRole: CameraRole
    timestamp: Date
}