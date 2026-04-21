export const cleanMapping = (mapping: Record<string, string>): Record<string, string> => {
  const cleaned: Record<string, string> = {};
  Object.entries(mapping).forEach(([sourceColumn, targetField]) => {
    if (targetField && targetField !== "") {
      cleaned[sourceColumn] = targetField;
    }
  });
  return cleaned;
};