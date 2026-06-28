-- Add required_vehicle on Order (stored from checkout quote) and DeliveryJob (copied at job creation)
ALTER TABLE "Order" ADD COLUMN "required_vehicle" "DeliveryVehicle";
ALTER TABLE "DeliveryJob" ADD COLUMN "required_vehicle" "DeliveryVehicle";
