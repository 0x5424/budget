<script lang=ts>
  import { today } from 'src/stores'
  import { lastIncome, nextIncome } from 'src/stores'

  // show a single date or a range
  $: currentRangeTitle = !$lastIncome ? 'No income info yet' : [
    'Income for',
    `${$lastIncome.month + 1}/${$lastIncome.date}`,
    $nextIncome && `to ${$nextIncome.month + 1}/${$nextIncome.date}`
  ].filter(Boolean).join(' ')
</script>

<article class='container max-w-md mx-auto px-6'>
  <fieldset class='border px-6 py-3'>
    <legend>Finances, {$today.toDateString()}</legend>
    <dl class='grid grid-cols-2'>
      <div class='col-span-2'>
        <dt>{currentRangeTitle}</dt>
        <dd>Bar</dd>
      </div>
    </dl>
  </fieldset>
  <!--
  <fieldset>
    <legend>Old</legend>
    <dl>
      <dt>Ending balance on {'foofy'}</dt>
      <dd>{'boofy'}</dd>
      <dt>Income for {`${'foofy'} to ${'foofy'}`}</dt>
      <dd>{'foofy'}</dd>
      <dt>Fixed expenses</dt>
      <dd>{'boofy'} ({'nyoron'}%)</dd>
      <dt>Repayments</dt>
      <dd>{'boofy'} ({'nyoron'}%)</dd>
      <dt>Disposable Income</dt>
      <dd class=takehome>{'boofy'}</dd>
      <dt>Auxillary expenses</dt>
      <dd>{'foofy'} ({'nyoron'}%)</dd>
      <dt>Remainder</dt>
      <dd>{'foofy'}</dd>
    </dl>

    <dl>
      <dt>Spending avg. (non-fixed, ~{69} days)</dt>
      <dd>{100} ({'nyoron'}% per day)</dd>
    </dl>

    <dl>
      <dt>Upcoming expenses</dt>
      <dd>{'foofy'}</dd>
      <dt class=remainder>Est. balance on {'4-20'}</dt>
      <dd class=takehome>{'foofy'} ({'nyoron'}%)</dd>
      <dd>+ {100} (est.)</dd>
      <dd>= {'foofy'} effective</dd>
      <dt>Next fixed expenses (estimated)</dt>
      <dd>{'boofy'} ({'nyoron'}%)</dd>
      <dt>Next repayments (estimated)</dt>
      <dd>{'boofy'} ({'nyoron'}%)</dd>
      <dt>Est. disposable</dt>
      <dd>{'foofy'} ({'nyoron'}%)</dd>
    </dl>
  </fieldset>
  -->
</article>

<style>
  dt {
    font-weight: 200;
  }

  dd {
    margin-left: 1.75rem;
    font-weight: 500;
    font-family: var(--font-mono);
  }
  /*
  dt { font-weight: 200; }
  dd {
    margin-left: 2em;
    font-family: var(--font-mono);
  }

  .takehome {
    width: fit-content;
    padding: 0.125em 0.5em;
    background-color: #facc;
  }

  .remainder {
    font-size: 0.875rem;
    font-weight: 800;
  }

  .container {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  article {
    padding: 0.25em;
    display: flex;
    flex-wrap: wrap;
    width: 20rem;
  }

  fieldset {
    width: 100%;
  }
  */
</style>
