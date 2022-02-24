export interface CreateDashboardDto {
  name: string;
  default: boolean;
}

export interface UpdateDashboardDto {
  name?: string;
  default?: boolean;
}

interface UpdateDashboardComponentsCreatePayload {
  dashboardComponentId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  configuration: string;
}

interface UpdateDashboardComponentsUpdatePayload {
  dashboardComponentAssociationId: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  configuration?: string;
}

export interface UpdateDashboardComponentsDto {
  create: UpdateDashboardComponentsCreatePayload[];
  update: UpdateDashboardComponentsUpdatePayload[];
  delete: string[];
}
