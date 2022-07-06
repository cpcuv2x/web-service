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
    carId: string,
    licensePlate: string,
    timestamp: Date
}