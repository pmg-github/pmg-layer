<script setup lang="ts">
import type { PubPollViewModel } from "models";
import { useUserStore, useFetchPolls } from "#imports";
const userStore = useUserStore();
const { getPoll, submit, deleteAnswer } = useFetchPolls();
const user = useUserStore();
const route = useRoute();

const props = defineProps<{
  id: string;
}>();

const currentCollectionReference: Ref<string | null> = useState<string | null>(
  "currentCollectionReference",
);

type VotesRecord = Record<number, number>;

const selectedAnswer = ref<number | null>(null);
const isSubmitting = ref(false);
const highlightedAnswerId = ref<number | null>(null);
const userHasInteracted = ref(false);
const showLoginModal = ref(false);
const showTestResult = ref(false);
const selectedTestAnswers = ref<number[]>([]);

const forceShowResults = computed(() => route.query.showresults === "true");

const localVotes = ref<VotesRecord>({});
const localTotalVotes = ref(0);

let highlightInterval: ReturnType<typeof setInterval> | null = null;

const { data: poll, refresh } = await useAsyncData<PubPollViewModel>(
  `article-poll-${props.id}`,
  async () => {
    return getPoll(props.id!);
  },
);

const answers = computed(() => poll.value?.answers ?? []);
const hasVoted = computed(() => selectedAnswer.value !== null);
const isTest = computed(() => poll.value?.isTest === 1);
const isMultiple = computed(() => poll.value?.isMultiple === 1);
const needsVoteButton = computed(() => isMultiple.value);
const isDisabled = computed(
  () => hasVoted.value || isSubmitting.value || !answers.value.length,
);

const isAnswerCorrect = (answerId: number): boolean => {
  const answer = answers.value.find((a) => a.id === answerId);
  return answer?.isWright === 1;
};

const selectedTestAnswersAreCorrect = computed(() => {
  if (selectedTestAnswers.value.length === 0) return null;
  return selectedTestAnswers.value.every((id) => isAnswerCorrect(id));
});

const customerLogoUrl = computed(() => {
  if (!poll.value?.customer?.klnr) return null;
  return `https://www.dobbit.be/uploads/logotheek/${poll.value.customer.klnr}.png`;
});

const getPercentage = (answerId: number): number => {
  if (localTotalVotes.value === 0) return 0;
  const votes = localVotes.value[answerId] || 0;
  return Math.round((votes / localTotalVotes.value) * 100);
};

const stopHighlightAnimation = () => {
  highlightedAnswerId.value = null;
  if (highlightInterval) {
    clearInterval(highlightInterval);
    highlightInterval = null;
  }
};

const startHighlightAnimation = () => {
  const answersList = answers.value;
  if (!answersList.length || userHasInteracted.value) return;

  let currentIndex = 0;

  highlightInterval = setInterval(() => {
    if (hasVoted.value || userHasInteracted.value) {
      stopHighlightAnimation();
      return;
    }

    highlightedAnswerId.value = answersList[currentIndex].id;
    currentIndex = (currentIndex + 1) % answersList.length;
  }, 1500);
};

const handleVote = async (answerId: number) => {
  if (hasVoted.value || isSubmitting.value) return;

  if (!poll.value) return;

  if (!userStore.user) {
    userHasInteracted.value = true;
    stopHighlightAnimation();
    showLoginModal.value = true;
    return;
  }

  if (needsVoteButton.value && !showTestResult.value) {
    const index = selectedTestAnswers.value.indexOf(answerId);
    if (index > -1) {
      selectedTestAnswers.value.splice(index, 1);
    } else {
      selectedTestAnswers.value.push(answerId);
    }
    userHasInteracted.value = true;
    stopHighlightAnimation();
    return;
  }

  isSubmitting.value = true;
  selectedAnswer.value = answerId;
  selectedTestAnswers.value = [answerId];
  userHasInteracted.value = true;
  stopHighlightAnimation();

  if (isTest.value) {
    showTestResult.value = true;
  }

  localVotes.value[answerId] = (localVotes.value[answerId] || 0) + 1;
  localTotalVotes.value += 1;

  try {
    await submit({
      pollId: poll.value.id,
      answerIds: [answerId],
      orderLineNumber: poll.value.orderLineNumber,
      projectCode: currentCollectionReference.value,
    });
    await refresh();
  } catch (e) {
    localVotes.value[answerId] -= 1;
    localTotalVotes.value -= 1;
    selectedAnswer.value = null;
  } finally {
    isSubmitting.value = false;
  }
};

const updateVotes = (ids: number[], delta: number) => {
  ids.forEach((id) => {
    localVotes.value[id] = (localVotes.value[id] || 0) + delta;
  });
  localTotalVotes.value += ids.length * delta;
};

const submitMultipleAnswers = async () => {
  if (selectedTestAnswers.value.length === 0 || !poll.value) return;

  isSubmitting.value = true;
  showTestResult.value = true;
  selectedAnswer.value = selectedTestAnswers.value[0];

  updateVotes(selectedTestAnswers.value, 1);

  try {
    await submit({
      pollId: poll.value.id,
      answerIds: selectedTestAnswers.value,
      orderLineNumber: poll.value.orderLineNumber,
    });
    await refresh();
  } catch (e) {
    console.error("Failed to submit answers", e);
    updateVotes(selectedTestAnswers.value, -1);
  } finally {
    isSubmitting.value = false;
  }
};

const handleButtonHover = () => {
  if (!userHasInteracted.value && !hasVoted.value) {
    userHasInteracted.value = true;
    stopHighlightAnimation();
  }
};

const removeAnswer = async (pollId?: number) => {
  if (!pollId) return;

  const previousAnswerId = selectedAnswer.value;

  deleteAnswer(pollId);
  selectedAnswer.value = null;
  selectedTestAnswers.value = [];
  showTestResult.value = false;
  userHasInteracted.value = false;
  stopHighlightAnimation();

  if (previousAnswerId !== null) {
    localVotes.value[previousAnswerId] =
      (localVotes.value[previousAnswerId] || 1) - 1;
    localTotalVotes.value -= 1;
  }

  setTimeout(() => {
    if (!hasVoted.value && !userHasInteracted.value) {
      startHighlightAnimation();
    }
  }, 500);
};

onMounted(() => {
  setTimeout(() => {
    if (!hasVoted.value && !userHasInteracted.value) {
      startHighlightAnimation();
    }
  }, 2000);
});

onUnmounted(() => {
  stopHighlightAnimation();
});

watch(
  poll,
  (newPoll) => {
    if (!newPoll) {
      localVotes.value = {};
      localTotalVotes.value = 0;
      return;
    }

    localTotalVotes.value = newPoll.amountOfVotes ?? 0;

    localVotes.value =
      newPoll.answers?.reduce((acc, answer) => {
        acc[answer.id] = answer.amountOfVotes;
        return acc;
      }, {} as VotesRecord) ?? {};

    const votedAnswers = newPoll.answers?.filter((a) => a.hasVoted) ?? [];
    if (votedAnswers.length) {
      selectedAnswer.value = votedAnswers[0].id;
      selectedTestAnswers.value = votedAnswers.map((a) => a.id);
    } else {
      selectedAnswer.value = null;
      selectedTestAnswers.value = [];
    }

    if (newPoll.isTest === 1 && votedAnswers.length) {
      showTestResult.value = true;
    } else {
      showTestResult.value = false;
    }
  },
  { immediate: true },
);
</script>

<template>
  <RegisterModal v-model="showLoginModal" />
  <div
    id="poll"
    :data-theme="poll?.colorScheme"
    class="flex h-full w-full flex-col items-center justify-center bg-white"
  >
    <div class="mx-auto flex h-full w-full flex-col @container">
      <!-- Header -->
      <div class="flex flex-shrink-0 flex-col">
        <span
          v-if="poll?.label"
          class="mb-2 w-fit rounded-full bg-primary-700 px-4 text-sm font-medium text-white"
        >
          {{ poll?.label }}
        </span>
        <span
          v-else
          class="mb-2 w-fit rounded-full bg-primary-700 px-4 text-sm font-medium text-white"
        >
          <Translate translate-key="poll.header" />
        </span>

        <h3 class="mt-1 text-xl font-semibold leading-tight text-black">
          {{ poll?.question ?? "Poll" }}
        </h3>
      </div>

      <!-- Answers -->
      <div class="flex-1 space-y-2.5">
        <div class="mt-2 flex items-center justify-between">
          <span class="text-sm font-medium text-black">
            <template v-if="isTest && showTestResult">
              <template v-if="selectedTestAnswersAreCorrect === null">
                <span v-if="poll?.successMessage">{{
                  poll?.successMessage
                }}</span>
                <Translate v-else translate-key="poll.subheaderVoted" />
              </template>
              <template v-else>
                <div>
                  <Translate
                    v-if="
                      !poll?.succesMessageRight && selectedTestAnswersAreCorrect
                    "
                    :translate-key="'poll.test.correct'"
                  />
                  <span
                    v-if="
                      poll?.succesMessageRight && selectedTestAnswersAreCorrect
                    "
                    >{{ poll?.succesMessageRight }}</span
                  >
                  <span
                    v-if="
                      poll?.succesMessageWrong && !selectedTestAnswersAreCorrect
                    "
                    >{{ poll?.succesMessageWrong }}</span
                  >
                  <Translate
                    v-if="
                      !poll?.succesMessageWrong &&
                      !selectedTestAnswersAreCorrect
                    "
                    :translate-key="'poll.test.incorrect'"
                  />
                </div>
              </template>
            </template>
            <template v-else-if="hasVoted">
              <Translate translate-key="poll.subheaderVoted" />
            </template>
            <template v-else-if="poll?.helperText">
              {{ poll?.helperText }}
            </template>
            <template v-else>
              <Translate translate-key="poll.subheader" />
            </template>
          </span>
          <div class="flex items-center gap-3">
            <span
              v-if="
                isTest &&
                showTestResult &&
                selectedTestAnswers.length > 0 &&
                answers.length > 0
              "
              class="rounded-md bg-primary-100 px-2.5 py-1 text-sm font-bold text-primary-900"
            >
              {{
                selectedTestAnswers.filter((id) => isAnswerCorrect(id)).length
              }}/{{ selectedTestAnswers.length }}
            </span>
            <button
              v-if="hasVoted && user.isPMG"
              type="button"
              @click="removeAnswer(poll?.id)"
              class="text-sm font-medium text-black underline"
            >
              reset
            </button>
          </div>
        </div>

        <button
          v-for="answer in answers"
          :key="answer.id"
          type="button"
          class="group relative w-full overflow-hidden rounded-xl border-2 p-3 text-left text-sm transition-all duration-300"
          :class="[
            isTest && showTestResult
              ? answer.isWright === 1 && selectedTestAnswers.includes(answer.id)
                ? 'cursor-default border-green-500 '
                : answer.isWright === 1
                  ? 'cursor-default border-green-300 '
                  : selectedTestAnswers.includes(answer.id)
                    ? 'cursor-default border-red-500 '
                    : 'cursor-default border-gray-300/30'
              : needsVoteButton && selectedTestAnswers.includes(answer.id)
                ? 'border-3 cursor-pointer border-primary-700 '
                : isDisabled
                  ? selectedAnswer === answer.id
                    ? 'border-3 cursor-default border-primary-700'
                    : 'cursor-default border-gray-300/30'
                  : selectedAnswer === answer.id
                    ? 'border-3 cursor-pointer border-primary-700 bg-primary-50'
                    : 'cursor-pointer border-gray-100 bg-white hover:border-primary-300 hover:bg-primary-100',
          ]"
          @click="handleVote(answer.id)"
          @mouseenter="handleButtonHover"
          :disabled="isTest || needsVoteButton ? showTestResult : isDisabled"
          :aria-pressed="
            needsVoteButton
              ? selectedTestAnswers.includes(answer.id)
              : selectedAnswer === answer.id
          "
          :aria-disabled="
            isTest || needsVoteButton ? showTestResult : isDisabled
          "
        >
          <!-- Shine effect -->
          <div
            v-if="!isDisabled"
            class="absolute inset-y-0 -left-full top-0 z-10 h-full w-1/2 -skew-x-12 transform bg-gradient-to-r from-transparent via-white/90 to-transparent opacity-0 group-hover:animate-shine group-hover:opacity-50"
            aria-hidden="true"
          />

          <!-- Progress bar (shown after voting) -->
          <div
            v-if="
              forceShowResults ||
              (isTest && showTestResult) ||
              (needsVoteButton && hasVoted) ||
              (!isTest && !needsVoteButton && hasVoted)
            "
            class="absolute inset-0 overflow-hidden"
            aria-hidden="true"
          >
            <div
              class="h-full transition-all duration-700 ease-out"
              :class="[
                isTest && showTestResult
                  ? answer.isWright === 1 &&
                    selectedTestAnswers.includes(answer.id)
                    ? 'bg-green-200'
                    : answer.isWright === 1
                      ? 'bg-green-200'
                      : selectedTestAnswers.includes(answer.id)
                        ? 'bg-red-50'
                        : 'bg-gray-300/30'
                  : needsVoteButton && selectedTestAnswers.includes(answer.id)
                    ? 'bg-primary-500/30'
                    : selectedAnswer === answer.id
                      ? 'bg-primary-500/30'
                      : 'bg-primary-500/30',
              ]"
              :style="{ width: `${getPercentage(answer.id)}%` }"
            />
          </div>

          <!-- Content -->
          <div
            class="relative flex min-h-[1.75rem] items-center justify-between gap-4"
          >
            <div class="flex min-w-0 items-center gap-3">
              <!-- Checkbox indicator for multiple choice -->
              <div
                v-if="isMultiple"
                class="relative z-20 flex size-5 flex-shrink-0 items-center justify-center rounded transition-colors"
                :class="[
                  'rounded-md',
                  isTest && showTestResult
                    ? selectedTestAnswers.includes(answer.id)
                      ? answer.isWright === 1
                        ? 'border-2 border-green-600 bg-green-600'
                        : 'border-2 border-red-600 bg-red-600'
                      : 'border-2 border-gray-300 bg-white'
                    : selectedTestAnswers.includes(answer.id) ||
                        selectedAnswer === answer.id
                      ? 'border-2 border-primary-700 bg-primary-700'
                      : 'border-2 border-gray-300 bg-white',
                ]"
              >
                <Icon
                  v-if="
                    (selectedTestAnswers.includes(answer.id) ||
                      selectedAnswer === answer.id) &&
                    !(
                      isTest &&
                      showTestResult &&
                      selectedTestAnswers.includes(answer.id) &&
                      answer.isWright === 0
                    )
                  "
                  class="size-3 text-white"
                  name="material-symbols:check"
                />
                <Icon
                  v-else-if="
                    isTest &&
                    showTestResult &&
                    selectedTestAnswers.includes(answer.id) &&
                    answer.isWright === 0
                  "
                  class="size-3 text-white"
                  name="material-symbols:close"
                />
              </div>

              <span
                :class="[
                  'relative z-20 text-sm font-semibold leading-snug',
                  isTest && showTestResult
                    ? answer.isWright === 1 &&
                      selectedTestAnswers.includes(answer.id)
                      ? 'text-green-700'
                      : answer.isWright === 1
                        ? 'text-green-700'
                        : selectedTestAnswers.includes(answer.id)
                          ? 'text-red-700'
                          : 'text-gray-600'
                    : hasVoted && selectedAnswer === answer.id
                      ? ''
                      : hasVoted
                        ? 'text-gray-900'
                        : 'text-gray-900',
                ]"
              >
                {{ answer.answer }}
              </span>

              <!-- Test mode icons (single choice) -->
              <Icon
                v-if="
                  isTest &&
                  showTestResult &&
                  !isMultiple &&
                  selectedTestAnswers.includes(answer.id) &&
                  answer.isWright === 1
                "
                class="size-6 shrink-0 text-green-600"
                name="material-symbols:check-circle"
              />
              <Icon
                v-else-if="
                  isTest &&
                  showTestResult &&
                  !isMultiple &&
                  selectedTestAnswers.includes(answer.id) &&
                  answer.isWright === 0
                "
                class="size-6 shrink-0 text-red-600"
                name="material-symbols:cancel"
              />

              <!-- Regular poll check icon -->
              <Icon
                v-if="
                  !isTest &&
                  ((needsVoteButton &&
                    hasVoted &&
                    !isMultiple &&
                    selectedTestAnswers.includes(answer.id)) ||
                    (!needsVoteButton && selectedAnswer === answer.id))
                "
                class="size-6 shrink-0 text-primary-700"
                name="material-symbols:check-circle"
              />
            </div>

            <span
              v-if="
                forceShowResults ||
                (isTest && showTestResult) ||
                (needsVoteButton && showTestResult) ||
                !isTest
              "
              :class="[
                'relative z-20 flex-shrink-0 text-base font-bold tabular-nums',
                hasVoted || showTestResult || forceShowResults
                  ? (
                      needsVoteButton
                        ? selectedTestAnswers.includes(answer.id)
                        : selectedAnswer === answer.id
                    )
                    ? 'text-primary-900'
                    : 'text-gray-900'
                  : 'invisible',
              ]"
            >
              {{ getPercentage(answer.id) }}%
            </span>
          </div>
        </button>

        <!-- Multiple choice submit button -->
        <button
          v-if="
            needsVoteButton &&
            selectedTestAnswers.length > 0 &&
            !showTestResult &&
            !hasVoted
          "
          type="button"
          @click="submitMultipleAnswers"
          :disabled="isSubmitting"
          class="mt-4 w-full rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-primary-700 disabled:opacity-50"
        >
          <span v-if="isSubmitting">Bezig...</span>
          <span v-else-if="poll?.button">
            {{ poll?.button }}
          </span>
          <span v-else>
            <Translate v-if="poll?.isTest" translate-key="poll.button" />
            <Translate v-else translate-key="poll.voteButton" />
          </span>
        </button>
      </div>

      <div
        class="flex h-20 w-full items-center justify-center rounded-xl text-center text-sm underline"
      >
        <NuxtLinkLocale to="/polls" v-if="hasVoted">
          <Translate translate-key="poll.viewMore" />
        </NuxtLinkLocale>
      </div>
    </div>

    <div class="w-full py-4">
      <div
        class="flex flex-col items-center justify-center gap-2 text-xs font-medium text-gray-600"
      >
        <Translate translate-key="poll.disclaimer" />
      </div>
    </div>
  </div>
</template>

<style lang="postcss" scoped>
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  #poll[data-theme="green"],
  #poll-slide[data-theme="green"] {
    --primary-50: 240, 248, 240;
    --primary-100: 220, 237, 220;
    --primary-200: 190, 220, 190;
    --primary-300: 160, 202, 160;
    --primary-400: 130, 185, 130;
    --primary-500: 100, 167, 100;
    --primary-600: 80, 134, 80;
    --primary-700: 60, 100, 60;
    --primary-800: 40, 67, 40;
    --primary-900: 20, 33, 20;
    --primary-950: 10, 17, 10;
  }
  #poll[data-theme="yellow"],
  #poll-slide[data-theme="yellow"] {
    --primary-50: 255, 250, 240;
    --primary-100: 255, 240, 200;
    --primary-200: 255, 230, 160;
    --primary-300: 255, 220, 120;
    --primary-400: 255, 210, 80;
    --primary-500: 255, 200, 40;
    --primary-600: 200, 160, 30;
    --primary-700: 150, 120, 20;
    --primary-800: 100, 80, 15;
    --primary-900: 50, 40, 10;
    --primary-950: 25, 20, 5;
  }
  #poll[data-theme="brown"],
  #poll-slide[data-theme="brown"] {
    --primary-50: 250, 245, 240;
    --primary-100: 240, 224, 210;
    --primary-200: 230, 204, 180;
    --primary-300: 210, 174, 140;
    --primary-400: 190, 144, 100;
    --primary-500: 170, 114, 60;
    --primary-600: 140, 94, 50;
    --primary-700: 110, 74, 40;
    --primary-800: 80, 54, 30;
    --primary-900: 50, 34, 20;
    --primary-950: 30, 20, 10;
  }
  #poll[data-theme="blue"],
  #poll-slide[data-theme="blue"] {
    --primary-50: 245, 250, 255;
    --primary-100: 220, 235, 245;
    --primary-200: 190, 215, 235;
    --primary-300: 160, 195, 225;
    --primary-400: 130, 175, 215;
    --primary-500: 100, 155, 205;
    --primary-600: 80, 125, 165;
    --primary-700: 60, 95, 125;
    --primary-800: 40, 65, 85;
    --primary-900: 20, 35, 45;
    --primary-950: 10, 20, 25;
  }
  #poll[data-theme="red"],
  #poll-slide[data-theme="red"] {
    --primary-50: 255, 230, 230;
    --primary-100: 255, 200, 200;
    --primary-200: 245, 150, 150;
    --primary-300: 235, 100, 100;
    --primary-400: 215, 70, 70;
    --primary-500: 195, 40, 40;
    --primary-600: 165, 30, 30;
    --primary-700: 135, 20, 20;
    --primary-800: 105, 15, 15;
    --primary-900: 75, 10, 10;
    --primary-950: 50, 5, 5;
  }
  #poll[data-theme="pink"],
  #poll-slide[data-theme="pink"] {
    --primary-50: 255, 240, 245;
    --primary-100: 255, 200, 215;
    --primary-200: 255, 160, 185;
    --primary-300: 255, 120, 155;
    --primary-400: 255, 80, 125;
    --primary-500: 255, 40, 100;
    --primary-600: 200, 30, 80;
    --primary-700: 150, 20, 60;
    --primary-800: 100, 15, 40;
    --primary-900: 50, 10, 20;
    --primary-950: 25, 5, 10;
  }
  #poll[data-theme="orange"],
  #poll-slide[data-theme="orange"] {
    --primary-50: 255, 245, 230;
    --primary-100: 255, 230, 200;
    --primary-200: 255, 210, 160;
    --primary-300: 255, 190, 120;
    --primary-400: 255, 170, 80;
    --primary-500: 255, 150, 40;
    --primary-600: 200, 110, 30;
    --primary-700: 150, 80, 20;
    --primary-800: 100, 50, 15;
    --primary-900: 50, 25, 10;
    --primary-950: 25, 15, 5;
  }
}

.group:hover .group-hover\:text-primary-800 {
  color: rgb(var(--primary-800));
}

button:focus-visible span.inline-flex {
  box-shadow: 0 0 0 3px rgba(var(--primary-300), 0.18);
}
</style>
