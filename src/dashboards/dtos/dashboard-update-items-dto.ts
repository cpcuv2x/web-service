export interface DashboardUpdateItemsDto {
  associations: {
    dashboardItemId: string;
    x: number;
    y: number;
  }[];
}
