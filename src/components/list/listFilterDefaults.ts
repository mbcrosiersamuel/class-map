import type { GroupValue } from '../../types';

export interface ListFilterValues {
  search: string;
  group: GroupValue | '';
  city: string;
  country: string;
}

export const INITIAL_FILTERS: ListFilterValues = {
  search: '',
  group: '',
  city: '',
  country: '',
};
