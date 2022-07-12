import { DriverStatus } from "@prisma/client"

export interface ECR {
    ecr: number,
    ecrThreshold: number,
    timestamp: Date
}

export interface Status {
    status: DriverStatus,
    timestamp: Date
}
