import { useRef, useCallback } from 'react'

/**
 * Previne duplo clique / submissões duplicadas.
 * Retorna um wrapper que ignora chamadas enquanto a anterior ainda está em execução.
 */
export function useSubmitting() {
    const submitting = useRef(false)

    const wrap = useCallback(
        <T>(fn: () => Promise<T>): Promise<T | void> => {
            if (submitting.current) return Promise.resolve()
            submitting.current = true
            return fn().finally(() => {
                submitting.current = false
            })
        },
        []
    )

    return wrap
}
