export const QUERY_BOOLEAN_TRUE = 'true' as const;
export const QUERY_BOOLEAN_FALSE = 'false' as const;

export type QueryBooleanFilter = typeof QUERY_BOOLEAN_TRUE | typeof QUERY_BOOLEAN_FALSE;

export function createQueryBooleanSelectOptions(
  trueLabel: string,
  falseLabel: string
): Array<{ label: string; value: QueryBooleanFilter }> {
  return [
    { label: trueLabel, value: QUERY_BOOLEAN_TRUE },
    { label: falseLabel, value: QUERY_BOOLEAN_FALSE }
  ];
}
