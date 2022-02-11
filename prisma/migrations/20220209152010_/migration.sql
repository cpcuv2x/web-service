-- CreateTable
CREATE TABLE "Dashboard" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "default" BOOLEAN NOT NULL,

    CONSTRAINT "Dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardComponent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "DashboardComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DashboardComponentAssociation" (
    "id" TEXT NOT NULL,
    "x" INTEGER NOT NULL,
    "y" INTEGER NOT NULL,
    "w" INTEGER NOT NULL,
    "h" INTEGER NOT NULL,
    "configuration" TEXT NOT NULL,
    "dashboardId" TEXT,
    "dashboardComponentId" TEXT,

    CONSTRAINT "DashboardComponentAssociation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DashboardComponentAssociation" ADD CONSTRAINT "DashboardComponentAssociation_dashboardId_fkey" FOREIGN KEY ("dashboardId") REFERENCES "Dashboard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DashboardComponentAssociation" ADD CONSTRAINT "DashboardComponentAssociation_dashboardComponentId_fkey" FOREIGN KEY ("dashboardComponentId") REFERENCES "DashboardComponent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
