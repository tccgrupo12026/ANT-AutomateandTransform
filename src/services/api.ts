/**
 * Base Service Module
 * Extend this service layer as API routes, database queries, and business logic are added.
 */

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
}

export const baseService = {
  getHealth: async (): Promise<ApiResponse<{ status: string }>> => {
    return {
      data: { status: 'healthy' },
      error: null,
      status: 200,
    };
  },
};
