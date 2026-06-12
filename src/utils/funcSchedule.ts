/**
 * Funciones de validación para horarios de farmacia.
 *
 * Retornan «factories de reglas» compatibles con la prop `rules`
 * de BaseInput: (val) => string | true
 */

/**
 * Regla: si el campo compañero (pairValue) tiene valor,
 * este campo también es obligatorio.
 *
 * @param pairValue - Valor actual del campo compañero (apertura o cierre)
 * @returns Función de regla para BaseInput
 */
export function requiredIfPairFilled(pairValue: string): (val: string) => string | true {
  return (val: string) => {
    if (pairValue && !val) {
      return 'Debes completar ambos horarios'
    }
    return true
  }
}

/**
 * Regla: la hora de cierre debe ser estrictamente posterior
 * a la hora de apertura.
 * Solo aplica cuando ambos campos tienen valor.
 *
 * Comparación léxica directa: funciona correctamente con
 * formato "HH:mm" (24 h) que produce el input type="time".
 *
 * @param openValue - Valor actual de la hora de apertura
 * @returns Función de regla para BaseInput
 */
export function closeMustBeAfterOpen(openValue: string): (val: string) => string | true {
  return (val: string) => {
    if (openValue && val && val <= openValue) {
      return 'El cierre debe ser después de la apertura'
    }
    return true
  }
}
