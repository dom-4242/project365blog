// Gemeinsame Nutrition-Konstanten (client- und serverseitig nutzbar).

export const MEAL_SLOTS = ['Frühstück', 'Mittag', 'Abend', 'Snack'] as const
export type MealSlot = (typeof MEAL_SLOTS)[number]
