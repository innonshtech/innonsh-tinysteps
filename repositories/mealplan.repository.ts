import { BaseRepository } from "./base.repository";

export class MealPlanRepository extends BaseRepository {
  constructor() {
    super('meal_plans');
  }
}

export class MealPlanDayRepository extends BaseRepository {
  constructor() {
    super('meal_plan_days');
  }
}

export class MealPlanItemRepository extends BaseRepository {
  constructor() {
    super('meal_plan_items');
  }
}

export class MealPlanSpecialRepository extends BaseRepository {
  constructor() {
    super('meal_plan_specials');
  }
}
