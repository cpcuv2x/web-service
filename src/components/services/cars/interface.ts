import { CarStatus } from "@prisma/client"

export interface LocationMessage {
    lat: number,
    lng: number,
    timestamp: Date
}

export interface PassengersMessage {
    passengers: number
    timestamp: Date
}

export interface StatusMessage {
    status: CarStatus,
    timestamp: Date
}

export interface Information {
    licensePlate: string,
}

export interface TotalPassengersOutput {
    id: string,
    passengers: number,
    status: CarStatus
}

export interface CarInformationOutput {
    id: string,
    licensePlate: string,
    passengers: number,
    status: CarStatus
}