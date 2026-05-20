export { useGroups } from "./useGroups";
export { useCompanies } from "./useCompanies";
export { useBusinessUnits } from "./useBusinessUnits";
export { useWorkspaces } from "./useWorkspaces";
export { useLoans, useLoanDetails } from "./useLoans";

// Prefer @/queries for new code
export {
  useCompaniesList,
  useCompany,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
} from "@/queries/companies";
export {
  useGroupsList,
  useGroup,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
} from "@/queries/groups";
export {
  useBusinessUnitsList,
  useBusinessUnit,
  useCreateBusinessUnit,
  useUpdateBusinessUnit,
  useDeleteBusinessUnit,
} from "@/queries/businessUnits";
export { useWorkspacesList } from "@/queries/workspaces";
export {
  useLoansList,
  useLoan,
  useLoanStatistics,
  useLoanDetailsBundle,
} from "@/queries/loans";
export {
  useShareholdersList,
  useShareholderMutations,
} from "@/queries/shareholders";
export { useUsersList } from "@/queries/users";
export {
  useStructureTree,
  useInvalidateStructure,
  fetchBusinessUnitsForCompany,
} from "@/queries/structure";
export { queryKeys, useAuthEnabled } from "@/queries";
