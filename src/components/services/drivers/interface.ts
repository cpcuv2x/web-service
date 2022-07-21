import { DriverStatus } from "@prisma/client"

export interface ECRMessage {
    ecr: number,
    ecrThreshold: number,
    timestamp: Date
}

export interface DriverStatusMessage {
    status: DriverStatus,
    timestamp: Date
}
