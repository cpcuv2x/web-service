import { CarStatus } from "@prisma/client"

export interface Location {
    lat: number,
    lng: number,
    timestamp: Date
}

export interface Passengers {
    passengers: number
    timestamp: Date
}

export interface Status {
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