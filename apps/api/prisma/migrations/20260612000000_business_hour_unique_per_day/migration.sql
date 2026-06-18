-- Supprimer les doublons (conserver la ligne la plus ancienne par établissement/jour)
DELETE FROM "BusinessHour" a
USING "BusinessHour" b
WHERE a.merchant_id = b.merchant_id
  AND a.day = b.day
  AND a.id > b.id;

-- Un seul horaire par jour et par établissement
CREATE UNIQUE INDEX "BusinessHour_merchant_id_day_key" ON "BusinessHour"("merchant_id", "day");
