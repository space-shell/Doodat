import type { Component } from 'solid-js';

const AccountabilityCard: Component = () => (
  <article data-testid="accountability-card" class="neu-raised w-full max-w-md p-6">
    <h2 class="text-xl font-bold text-dodaat-textPrimary">Three skipped.</h2>
    <p class="mt-3 text-sm leading-relaxed text-dodaat-textSecondary">
      You've skipped three cards today. That's a signal worth pausing on. Is
      something getting in the way right now, or are these practices not
      landing for you?
    </p>

    <div class="neu-inset mt-6 p-4">
      <p class="text-xs italic text-dodaat-textMuted">
        A moment of honest reflection — for you alone. (Voice notes return
        with the social layer.)
      </p>
    </div>
  </article>
);

export default AccountabilityCard;
