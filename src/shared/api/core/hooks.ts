import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  QueryKey,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
} from '@tanstack/react-query'

import { useApiClient } from '../runtimeConfig/provider/provider'
import { useSessionQuery } from '../auth'

export type ApiQueryResult<TData, TError = Error> = UseQueryResult<
  TData,
  TError
>

export type ApiMutationResult<
  TData,
  TVars = unknown,
  TContext = unknown,
  TError = Error,
> = UseMutationResult<TData, TError, TVars, TContext>

type ApiQueryArgs<TQueryFnData, TData = TQueryFnData, TError = Error> = {
  key: QueryKey
  path: string
  params?: Record<string, unknown>
  enabled?: boolean
  refetchInterval?: UseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    QueryKey
  >['refetchInterval']
  refetchIntervalInBackground?: UseQueryOptions<
    TQueryFnData,
    TError,
    TData,
    QueryKey
  >['refetchIntervalInBackground']
} & Pick<
  UseQueryOptions<TQueryFnData, TError, TData, QueryKey>,
  'retry' | 'staleTime' | 'select' | 'gcTime'
>

type ApiMutationOptions<TData, TVars, TContext, TError = Error> = Pick<
  UseMutationOptions<TData, TError, TVars, TContext>,
  'onMutate' | 'onSuccess' | 'onError' | 'onSettled' | 'retry'
> & {
  invalidate?: QueryKey
  invalidateOn?: 'success' | 'settled'
}

type ApiMutationPath<TVars> = string | ((vars: TVars) => string)

export function useApiQuery<
  TQueryFnData = unknown,
  TData = TQueryFnData,
  TError = Error,
>(
  args: ApiQueryArgs<TQueryFnData, TData, TError>,
): ApiQueryResult<TData, TError> {
  const client = useApiClient()

  const {
    key,
    path,
    params,
    enabled = true,
    refetchInterval,
    refetchIntervalInBackground,
    ...opts
  } = args

  return useQuery<TQueryFnData, TError, TData, QueryKey>({
    queryKey: params ? [...key, params] : key,
    enabled,
    queryFn: async ({ signal }) => {
      const response = await client.get<TQueryFnData>(path, {
        params,
        signal,
      })

      return response.data
    },
    refetchInterval,
    refetchIntervalInBackground,
    ...opts,
  })
}

export function useApiMutation<
  TData = unknown,
  TVars = unknown,
  TContext = unknown,
  TError = Error,
>(
  path: ApiMutationPath<TVars>,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options?: ApiMutationOptions<TData, TVars, TContext, TError>,
): ApiMutationResult<TData, TVars, TContext, TError> {
  const client = useApiClient()
  const queryClient = useQueryClient()

  const {
    invalidate,
    invalidateOn = 'success',
    onSuccess,
    onSettled,
    ...mutationOptions
  } = options ?? {}

  return useMutation<TData, TError, TVars, TContext>({
    ...mutationOptions,

    mutationFn: async (vars) => {
      const url = typeof path === 'function' ? path(vars) : path
      const response = await client.request<TData>({
        url,
        method,
        data: vars,
      })

      return response.data
    },

    onSuccess: async (data, vars, ctx, context) => {
      if (invalidate && invalidateOn === 'success') {
        await queryClient.invalidateQueries({
          queryKey: invalidate,
        })
      }

      await onSuccess?.(data, vars, ctx, context)
    },

    onSettled: async (data, err, vars, ctx, context) => {
      if (invalidate && invalidateOn === 'settled') {
        await queryClient.invalidateQueries({
          queryKey: invalidate,
        })
      }

      await onSettled?.(data, err, vars, ctx, context)
    },
  })
}

export function useAuthedQuery<
  TQueryFnData = unknown,
  TData = TQueryFnData,
  TError = Error,
>(
  args: ApiQueryArgs<TQueryFnData, TData, TError>,
): ApiQueryResult<TData, TError> {
  const session = useSessionQuery({ enabled: true })

  const isAuthenticated = session.isSuccess && session.data !== null

  return useApiQuery<TQueryFnData, TData, TError>({
    ...args,
    enabled: (args.enabled ?? true) && isAuthenticated,
  })
}

export function useAuthedMutation<
  TData = unknown,
  TVars = unknown,
  TOnMutateResult = unknown,
  TError = Error,
>(
  path: ApiMutationPath<TVars>,
  method: 'post' | 'put' | 'patch' | 'delete' = 'post',
  options?: ApiMutationOptions<
    TData,
    TVars,
    TOnMutateResult | undefined,
    TError
  >,
): ApiMutationResult<TData, TVars, TOnMutateResult | undefined, TError> {
  const session = useSessionQuery({ enabled: true })

  const isAuthenticated = session.isSuccess && session.data != null

  const originalOnMutate = options?.onMutate

  return useApiMutation<TData, TVars, TOnMutateResult | undefined, TError>(
    path,
    method,
    {
      ...options,

      onMutate: async (vars, context) => {
        if (session.isLoading || session.isFetching) {
          throw new Error('Auth state is loading')
        }

        if (!isAuthenticated) {
          throw new Error('Not authorized')
        }

        if (!originalOnMutate) {
          return undefined
        }

        return originalOnMutate(vars, context)
      },
    },
  )
}
