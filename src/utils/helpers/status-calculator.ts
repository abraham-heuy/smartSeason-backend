
import { FieldStage } from "../../entities/FieldStage.enum";
import { Field} from "../../entities/Field.entity";

export function calculateFieldStatus(field: Field): 'Active' | 'At Risk' | 'Completed' {
  // Cast to string to bypass type narrowing issues
  const currentStage = field.currentStage as string;
  
  if (currentStage === FieldStage.HARVESTED) {
    return 'Completed';
  }
  
  const now = new Date();
  const plantingDate = new Date(field.plantingDate);
  const daysSincePlanting = Math.floor((now.getTime() - plantingDate.getTime()) / (1000 * 3600 * 24));
  
  const lastUpdate = field.updates?.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0];
  let daysSinceLastUpdate = 0;
  if (lastUpdate) {
    daysSinceLastUpdate = Math.floor((now.getTime() - lastUpdate.createdAt.getTime()) / (1000 * 3600 * 24));
  } else {
    daysSinceLastUpdate = daysSincePlanting;
  }
  
  // At Risk if planted over 30 days ago and not yet Ready or Harvested
  if (daysSincePlanting > 30 && currentStage !== FieldStage.READY && currentStage !== FieldStage.HARVESTED) {
    return 'At Risk';
  }
  
  // At Risk if no update in last 14 days
  if (daysSinceLastUpdate > 14) {
    return 'At Risk';
  }
  
  return 'Active';
}