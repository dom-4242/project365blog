-- Scale existing MealLog scores from 0–5 to 0–10
UPDATE "MealLog" SET score = score * 2 WHERE score IS NOT NULL;
