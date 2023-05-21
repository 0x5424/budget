<script lang=ts>
  import type { OmitIncomeFilter } from 'src/lib/types'

  /** @note component doesn't need state..... yet */
  export let filterItem: OmitIncomeFilter

  function accountsLabel(item: OmitIncomeFilter) {
    return item.accounts ? `[${item.accounts.join(', ')}]` : '[ALL ACCOUNTS]'
  }

  function operatorLabel(item: OmitIncomeFilter) {
    if (item.conditions.length === 1) return 'If '
    if (item.operator === 'AND') return 'If all conditions are met: '
    if (item.operator === 'OR')  return 'If any condition is met: '
  }

  type LabelAndParamFormat = {
    labelText: string
    paramText?: string
    condition: OmitIncomeFilter['conditions'][number]['condition']
  }
  function getLabelAndParamText(allConditions: OmitIncomeFilter['conditions']): LabelAndParamFormat[] {
    return allConditions.map(({ condition, param }) => {
      let labelText: string
      let paramText: void | string
      if (condition === 'dateIs') labelText = `day of month is ${param}`
      if (condition === 'amountGreaterThan') labelText = `income is more than ${param}`
      if (condition === 'amountLessThan') labelText = `income is less than ${param}`
      if (condition === 'labelIncludes') {
        labelText = `transaction label includes text`
        paramText = `"${param}"`
      }
      if (!labelText) throw new Error(`unhandled condition/param: ${condition} (${param})`)

      const out: LabelAndParamFormat = { condition, labelText }
      if (paramText) out.paramText = paramText

      return out
    })
  }

  function getElementParamTag(condition: OmitIncomeFilter['conditions'][number]['condition']) {
    if (condition === 'labelIncludes') return 'code'
    return 'span'
  }

  $: formattedConditions = getLabelAndParamText(filterItem.conditions)
</script>

<li class=my-2>
  <span class='font-bold' class:font-mono={filterItem.accounts}>
    {accountsLabel(filterItem)}
  </span>
  <span>{operatorLabel(filterItem)}</span>
  {#each formattedConditions as { condition, labelText, paramText }, idx}
    {labelText}
    {#if paramText}
      <svelte:element this={getElementParamTag(condition)}>
        {paramText}
      </svelte:element>
    {/if}
    {#if idx + 1 !== formattedConditions.length}
      {' and '}
    {/if}
  {/each}
</li>
